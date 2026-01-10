import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { parseAndValidate, generateTheoryMediaSchema } from '../_shared/validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VisualPlanSegment {
  startTime: number;
  endTime: number;
  type: 'title' | 'definition' | 'formula' | 'step' | 'graph' | 'highlight' | 'recap';
  content: string;
  latex?: string;
  highlight?: string;
}

interface VisualPlan {
  totalDuration: number;
  segments: VisualPlanSegment[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate input
    const validation = await parseAndValidate(req, generateTheoryMediaSchema, corsHeaders);
    if (!validation.success) {
      return validation.response;
    }
    const { theoryBlockId } = validation.data;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const elevenLabsKey = Deno.env.get('ELEVENLABS_API_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the theory block
    const { data: block, error: blockError } = await supabase
      .from('theory_blocks')
      .select('*')
      .eq('id', theoryBlockId)
      .single();

    if (blockError || !block) {
      throw new Error(`Theory block not found: ${blockError?.message}`);
    }

    console.log(`Processing theory block: ${block.block_number} - ${block.title}`);

    // Update status to processing
    await supabase
      .from('theory_blocks')
      .update({ video_status: 'processing', generation_error: null })
      .eq('id', theoryBlockId);

    // Step 1: Generate narration script and visual plan
    const { narrationScript, visualPlan } = await generateNarrationAndPlan(
      block, 
      lovableApiKey!
    );

    console.log('Generated narration script:', narrationScript.substring(0, 100) + '...');

    // Update with narration script
    await supabase
      .from('theory_blocks')
      .update({ 
        narration_script: narrationScript,
        visual_plan: visualPlan 
      })
      .eq('id', theoryBlockId);

    // Step 2: Generate audio with ElevenLabs TTS
    let audioUrl: string | null = null;
    if (elevenLabsKey) {
      audioUrl = await generateAudio(
        narrationScript, 
        block.narration_voice_id || 'EXAVITQu4vr4xnSDxMaL',
        elevenLabsKey,
        supabaseUrl,
        supabaseKey,
        block.topic_id,
        block.block_number
      );
      console.log('Generated audio URL:', audioUrl);
    }

    // Update block with results
    await supabase
      .from('theory_blocks')
      .update({
        audio_url: audioUrl,
        video_status: 'ready',
        generation_mode: 'fallback', // Using fallback mode with audio + animated visuals
        last_generated_at: new Date().toISOString(),
        generation_error: null
      })
      .eq('id', theoryBlockId);

    return new Response(
      JSON.stringify({
        success: true,
        blockId: theoryBlockId,
        blockNumber: block.block_number,
        audioUrl,
        visualPlan,
        narrationScript
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating theory media:', errorMessage);
    
    // Try to update the block with error status
    try {
      const { theoryBlockId } = await req.clone().json();
      if (theoryBlockId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        await supabase
          .from('theory_blocks')
          .update({
            video_status: 'failed',
            generation_error: errorMessage
          })
          .eq('id', theoryBlockId);
      }
    } catch (e) {
      console.error('Failed to update error status:', e);
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateNarrationAndPlan(
  block: Record<string, unknown>,
  apiKey: string
): Promise<{ narrationScript: string; visualPlan: VisualPlan }> {
  const content = block.content as Record<string, unknown>;
  const blockType = block.block_type as string;
  const title = block.title as string;
  const blockNumber = block.block_number as string;

  const systemPrompt = `You are a mathematics narrator. Transform the given theory block into:
1. A spoken narration script (natural speech, no visual instructions)
2. A visual plan (timeline of what to show on screen)

RULES:
- The narration must contain ONLY content from the theory block
- Do NOT add new concepts, examples, or explanations
- Do NOT use informal language like "obviously", "you can see that", "basically"
- Keep the narration clear and academic
- The visual plan segments should sync with narration timing

BLOCK TYPE: ${blockType}
BLOCK NUMBER: ${blockNumber}
TITLE: ${title}

Respond in this exact JSON format:
{
  "narrationScript": "The complete narration text...",
  "visualPlan": {
    "totalDuration": 60,
    "segments": [
      { "startTime": 0, "endTime": 10, "type": "title", "content": "Title text" },
      { "startTime": 10, "endTime": 25, "type": "definition", "content": "Description", "latex": "LaTeX formula" }
    ]
  }
}`;

  const userPrompt = `Transform this ${blockType} block into narration and visual plan:

Title: ${title}
Block Number: ${blockNumber}
Content: ${JSON.stringify(content, null, 2)}
${block.latex_content ? `LaTeX Content: ${block.latex_content}` : ''}`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI generation failed: ${errorText}`);
  }

  const data = await response.json();
  const responseText = data.choices[0]?.message?.content || '';
  
  // Parse JSON from response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse AI response as JSON');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  
  return {
    narrationScript: parsed.narrationScript,
    visualPlan: parsed.visualPlan
  };
}

async function generateAudio(
  narrationScript: string,
  voiceId: string,
  apiKey: string,
  supabaseUrl: string,
  supabaseKey: string,
  topicId: string,
  blockNumber: string
): Promise<string | null> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  try {
    // Call ElevenLabs TTS API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: narrationScript,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.7,
            similarity_boost: 0.75,
            style: 0.2,
            speed: 0.9,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs TTS error:', errorText);
      throw new Error(`TTS failed: ${response.status}`);
    }

    // Get audio as buffer
    const audioBuffer = await response.arrayBuffer();
    const audioBytes = new Uint8Array(audioBuffer);
    
    // Upload to Supabase Storage
    const fileName = `${topicId}/${blockNumber}_audio.mp3`;
    
    const { error: uploadError } = await supabase.storage
      .from('theory-media')
      .upload(fileName, audioBytes, {
        contentType: 'audio/mpeg',
        upsert: true
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('theory-media')
      .getPublicUrl(fileName);

    return urlData.publicUrl;

  } catch (error) {
    console.error('Audio generation error:', error);
    return null;
  }
}
