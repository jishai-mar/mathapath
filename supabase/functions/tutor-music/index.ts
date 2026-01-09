import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { parseAndValidate, tutorMusicSchema } from '../_shared/validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Pre-defined music prompts for studying
const musicPrompts: Record<string, string> = {
  calm: 'calm ambient study music, soft piano, minimal, 60 bpm, relaxing, loopable',
  lofi: 'lofi hip hop study beats, chill, mellow, 85 bpm, vinyl crackle, loopable',
  classical: 'gentle classical piano, Mozart style, peaceful studying, elegant, loopable',
  nature: 'ambient nature sounds with soft music, rain, forest, peaceful, loopable',
  focus: 'deep focus concentration music, binaural beats, alpha waves, ambient, loopable',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate input
    const validation = await parseAndValidate(req, tutorMusicSchema, corsHeaders);
    if (!validation.success) {
      return validation.response;
    }
    const { type, customPrompt, duration } = validation.data;

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');

    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    const prompt = customPrompt || (type ? musicPrompts[type] : undefined) || musicPrompts.calm;
    const musicDuration = duration ?? 30; // Default 30 seconds

    console.log(`Generating music: type=${type}, duration=${musicDuration}s`);

    const response = await fetch(
      'https://api.elevenlabs.io/v1/music',
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          duration_seconds: musicDuration,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs Music error:', response.status, errorText);
      throw new Error(`Music generation failed: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    console.log('Music generated successfully, size:', audioBuffer.byteLength);

    return new Response(audioBuffer, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error) {
    console.error('Error in tutor-music:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
