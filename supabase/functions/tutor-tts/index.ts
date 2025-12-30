import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Voice IDs mapped to personalities
const tutorVoices: Record<string, string> = {
  patient: 'EXAVITQu4vr4xnSDxMaL',      // Sarah - warm, patient
  encouraging: 'pFZP5JQG7iQjIQuC4Bku',  // Lily - enthusiastic
  strict: 'JBFqnCBsd6RMkjVDRZzb',       // George - authoritative
  friendly: 'N2lVS1w4EtoT3dr4eOWO',     // Callum - soothing
};

// Voice settings based on context
const contextSettings: Record<string, { stability: number; similarity_boost: number; style: number; speed: number }> = {
  explaining: { stability: 0.7, similarity_boost: 0.75, style: 0.2, speed: 0.9 },
  encouraging: { stability: 0.5, similarity_boost: 0.75, style: 0.5, speed: 1.0 },
  correcting: { stability: 0.8, similarity_boost: 0.8, style: 0.15, speed: 0.85 },
  celebrating: { stability: 0.4, similarity_boost: 0.7, style: 0.6, speed: 1.1 },
  thinking: { stability: 0.6, similarity_boost: 0.75, style: 0.3, speed: 0.95 },
  default: { stability: 0.5, similarity_boost: 0.75, style: 0.3, speed: 1.0 },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voiceId, personality, context, stream } = await req.json();
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');

    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    if (!text) {
      throw new Error('Text is required');
    }

    // Select voice based on personality or use provided voiceId
    const selectedVoiceId = voiceId || tutorVoices[personality] || tutorVoices.patient;
    
    // Get voice settings based on context
    const settings = contextSettings[context] || contextSettings.default;

    console.log(`TTS: personality=${personality}, context=${context}, voice=${selectedVoiceId}, stream=${stream}`);

    // Use streaming endpoint for lower latency
    const endpoint = stream 
      ? `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}/stream`
      : `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5', // Low latency model
        output_format: 'mp3_44100_128',
        voice_settings: {
          stability: settings.stability,
          similarity_boost: settings.similarity_boost,
          style: settings.style,
          use_speaker_boost: true,
          speed: settings.speed,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs TTS error:', response.status, errorText);
      throw new Error(`TTS failed: ${response.status}`);
    }

    // For streaming, return the stream directly
    if (stream && response.body) {
      console.log('Returning streaming audio response');
      return new Response(response.body, {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'audio/mpeg',
          'Transfer-Encoding': 'chunked',
        },
      });
    }

    const audioBuffer = await response.arrayBuffer();
    console.log('Speech generated successfully, size:', audioBuffer.byteLength);

    return new Response(audioBuffer, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error) {
    console.error('Error in tutor-tts:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
