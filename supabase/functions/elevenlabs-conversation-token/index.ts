import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { parseAndValidate, elevenlabsConversationTokenSchema } from "../_shared/validation.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY')
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured')
    }

    // Validate input - parse JSON with fallback to empty object for optional params
    let agentId: string | undefined;
    let mode: "token" | "signed_url" | undefined;
    
    try {
      const body = await req.json();
      const validation = elevenlabsConversationTokenSchema.safeParse(body);
      if (validation.success) {
        agentId = validation.data.agentId;
        mode = validation.data.mode;
      }
    } catch {
      // Empty body is allowed - use defaults
    }

    const agent = agentId || 'agent_4501kd82684tegmad70k26kqzs17'

    const endpoint = mode === 'signed_url'
      ? `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agent}`
      : `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agent}`

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs API error:', response.status, errorText)
      throw new Error(`ElevenLabs API error: ${response.status}`)
    }

    const data = await response.json()

    return new Response(
      JSON.stringify(
        mode === 'signed_url'
          ? { signedUrl: data.signed_url }
          : { token: data.token },
      ),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error getting conversation token:', error)
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
