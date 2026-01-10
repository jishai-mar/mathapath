import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, durationMinutes, selectedTopicIds } = await req.json();

    console.log('Planning session for user:', userId, 'duration:', durationMinutes);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch user's progress data
    const [
      { data: subtopicProgress },
      { data: topicProgress },
      { data: recentAttempts },
      { data: topics },
      { data: subtopics },
      { data: learningProfile }
    ] = await Promise.all([
      supabase
        .from('user_subtopic_progress')
        .select('*')
        .eq('user_id', userId),
      supabase
        .from('user_topic_progress')
        .select('*')
        .eq('user_id', userId),
      supabase
        .from('exercise_attempts')
        .select('*, exercises!inner(subtopic_id, difficulty)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('topics')
        .select('id, name')
        .order('order_index'),
      supabase
        .from('subtopics')
        .select('id, name, topic_id')
        .order('order_index'),
      supabase
        .from('learning_profiles')
        .select('*')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle()
    ]);

    // Build context for AI
    const topicMap = new Map((topics || []).map(t => [t.id, t.name]));
    const subtopicMap = new Map((subtopics || []).map(s => [s.id, { name: s.name, topic_id: s.topic_id }]));

    // Identify weak areas
    const weakSubtopics = (subtopicProgress || [])
      .filter(sp => sp.mastery_percentage < 70 && sp.exercises_completed > 0)
      .sort((a, b) => a.mastery_percentage - b.mastery_percentage);

    // Identify recent mistakes
    const recentMistakes = (recentAttempts || [])
      .filter(a => !a.is_correct)
      .slice(0, 10);

    // Identify untouched subtopics
    const practicedSubtopicIds = new Set((subtopicProgress || []).map(sp => sp.subtopic_id));
    const untouchedSubtopics = (subtopics || []).filter(s => !practicedSubtopicIds.has(s.id));

    // Filter by selected topics if any
    let relevantSubtopics = subtopics || [];
    if (selectedTopicIds && selectedTopicIds.length > 0) {
      relevantSubtopics = relevantSubtopics.filter(s => selectedTopicIds.includes(s.topic_id));
    }

    // Estimate exercises per session (roughly 3-5 min per exercise)
    const estimatedExerciseCount = Math.max(3, Math.floor(durationMinutes / 4));

    // Build prompt for AI
    const prompt = `You are an expert math tutor planning a ${durationMinutes}-minute learning session.

STUDENT DATA:
- Weak subtopics (low mastery): ${weakSubtopics.slice(0, 5).map(w => {
  const info = subtopicMap.get(w.subtopic_id);
  return info ? `${info.name} (${w.mastery_percentage}% mastery)` : null;
}).filter(Boolean).join(', ') || 'None identified yet'}

- Recent mistakes in: ${recentMistakes.slice(0, 5).map(m => {
  const subInfo = subtopicMap.get(m.exercises?.subtopic_id);
  return subInfo?.name;
}).filter(Boolean).join(', ') || 'None'}

- Untouched topics: ${untouchedSubtopics.slice(0, 5).map(s => s.name).join(', ') || 'None'}

- Selected focus areas: ${selectedTopicIds?.length > 0 
  ? selectedTopicIds.map((id: string) => topicMap.get(id)).filter(Boolean).join(', ')
  : 'None specified (choose based on needs)'}

AVAILABLE SUBTOPICS:
${relevantSubtopics.slice(0, 30).map(s => {
  const progress = subtopicProgress?.find(sp => sp.subtopic_id === s.id);
  return `- ${s.name} (${topicMap.get(s.topic_id)}) - ${progress?.mastery_percentage || 0}% mastery`;
}).join('\n')}

Create a session plan with exactly ${estimatedExerciseCount} exercises. Return a JSON object with:
{
  "exercises": [
    {
      "subtopicId": "uuid",
      "subtopicName": "name",
      "topicName": "topic",
      "difficulty": "easy|medium|hard",
      "reason": "Brief explanation why this exercise",
      "estimatedMinutes": 3-5
    }
  ],
  "focusAreas": ["area1", "area2"],
  "planRationale": "One sentence explaining the session strategy"
}

PLANNING RULES:
1. Start with foundational weak areas before advanced topics
2. Increase difficulty gradually within the session
3. Include 1-2 review exercises for recent mistakes
4. Balance challenge with achievability
5. If student has weak fundamentals, prioritize those over new topics
6. Match difficulty to mastery level (low mastery = easier start)`;

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are an expert math tutor. Return only valid JSON, no markdown.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      console.error('AI gateway error:', status);
      
      if (status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limited', 
          rate_limited: true 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Credits depleted', 
          credits_depleted: true 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content from AI');
    }

    // Parse JSON from response
    let plan;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      plan = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse session plan');
    }

    // Validate and enrich the plan
    const validatedExercises = (plan.exercises || []).map((ex: any) => {
      // Validate subtopic exists
      const subtopicInfo = subtopicMap.get(ex.subtopicId);
      if (!subtopicInfo) {
        // Find by name as fallback
        const matchingSubtopic = (subtopics || []).find(s => 
          s.name.toLowerCase().includes(ex.subtopicName?.toLowerCase() || '')
        );
        if (matchingSubtopic) {
          return {
            ...ex,
            subtopicId: matchingSubtopic.id,
            subtopicName: matchingSubtopic.name,
            topicName: topicMap.get(matchingSubtopic.topic_id) || ex.topicName,
          };
        }
      }
      return {
        ...ex,
        subtopicName: subtopicInfo?.name || ex.subtopicName,
        topicName: topicMap.get(subtopicInfo?.topic_id || '') || ex.topicName,
      };
    }).filter((ex: any) => ex.subtopicId);

    const sessionPlan = {
      id: crypto.randomUUID(),
      totalMinutes: durationMinutes,
      exercises: validatedExercises,
      focusAreas: plan.focusAreas || [],
      planRationale: plan.planRationale || 'Personalized plan based on your progress',
      estimatedExerciseCount: validatedExercises.length,
    };

    console.log('Session plan created:', sessionPlan.id, 'with', sessionPlan.exercises.length, 'exercises');

    return new Response(JSON.stringify(sessionPlan), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error planning session:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
