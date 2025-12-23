import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Pre-defined sound effect prompts
const soundEffects: Record<string, { prompt: string; duration: number }> = {
  correct: { prompt: 'gentle chime success notification sound, positive, bright, short', duration: 1.5 },
  incorrect: { prompt: 'soft error notification, gentle, not harsh, brief', duration: 1 },
  achievement: { prompt: 'celebration sparkle sound effect, magical, triumphant', duration: 2 },
  levelUp: { prompt: 'level up video game sound, ascending notes, exciting', duration: 2.5 },
  hint: { prompt: 'magical discovery sound, soft whoosh, mystical', duration: 1.5 },
  newExercise: { prompt: 'page turn paper sound, soft, subtle', duration: 1 },
  xpGain: { prompt: 'coin collect sound, soft ding, rewarding', duration: 1 },
  streak: { prompt: 'fire whoosh sound, energetic, powerful', duration: 1.5 },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, customPrompt, duration } = await req.json();
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');

    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    // Get predefined effect or use custom prompt
    const effect = soundEffects[type];
    const prompt = customPrompt || effect?.prompt;
    const effectDuration = duration || effect?.duration || 2;

    if (!prompt) {
      throw new Error('Invalid sound effect type or no custom prompt provided');
    }

    console.log(`Generating SFX: type=${type}, duration=${effectDuration}s`);

    const response = await fetch(
      'https://api.elevenlabs.io/v1/sound-generation',
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: prompt,
          duration_seconds: effectDuration,
          prompt_influence: 0.3,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs SFX error:', response.status, errorText);
      throw new Error(`SFX generation failed: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    console.log('SFX generated successfully, size:', audioBuffer.byteLength);

    return new Response(audioBuffer, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error) {
    console.error('Error in tutor-sfx:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
