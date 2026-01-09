import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { parseAndValidate, updateLearningPathFullSchema } from '../_shared/validation.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PerformanceData {
  topicId: string;
  score: number;
  weakSubtopics: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate input
    const validation = await parseAndValidate(req, updateLearningPathFullSchema, corsHeaders);
    if (!validation.success) {
      return validation.response;
    }
    const { userId, performanceData, source } = validation.data;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Updating learning path for user: ${userId}, source: ${source}`);

    // Fetch active learning goal
    const { data: activeGoal, error: goalError } = await supabase
      .from("user_learning_goals")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (goalError) throw goalError;

    if (!activeGoal) {
      return new Response(
        JSON.stringify({ message: "No active learning goal found", updated: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Analyze performance data
    const weakTopics: string[] = [];
    const strongTopics: string[] = [];
    const allWeakSubtopics: string[] = [];

    const perfDataArray = Array.isArray(performanceData) ? performanceData : [performanceData];
    
    for (const pd of perfDataArray) {
      if (pd.score < 60) {
        weakTopics.push(pd.topicId);
      } else if (pd.score >= 80) {
        strongTopics.push(pd.topicId);
      }
      if (pd.weakSubtopics?.length) {
        allWeakSubtopics.push(...pd.weakSubtopics);
      }
    }

    const updates: any[] = [];

    // Get current path nodes
    const { data: pathNodes, error: nodesError } = await supabase
      .from("learning_path_nodes")
      .select("*")
      .eq("goal_id", activeGoal.id)
      .eq("status", "pending")
      .order("scheduled_date")
      .order("order_index");

    if (nodesError) throw nodesError;

    // If there are weak topics, add reinforcement nodes
    if (weakTopics.length > 0 && allWeakSubtopics.length > 0) {
      // Get subtopic details
      const { data: subtopicDetails, error: subtopicError } = await supabase
        .from("subtopics")
        .select("*")
        .in("id", allWeakSubtopics);

      if (!subtopicError && subtopicDetails) {
        // Find the next available date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let nextDate = new Date(today);
        nextDate.setDate(nextDate.getDate() + 1);

        // Get existing dates to avoid conflicts
        const existingDates = new Set(
          (pathNodes || []).map((n: any) => n.scheduled_date)
        );

        // Find next open slot
        while (existingDates.has(nextDate.toISOString().split("T")[0])) {
          nextDate.setDate(nextDate.getDate() + 1);
        }

        // Create reinforcement nodes for weak subtopics
        const reinforcementNodes = subtopicDetails.slice(0, 3).map((subtopic: any, index: number) => ({
          user_id: userId,
          goal_id: activeGoal.id,
          topic_id: subtopic.topic_id,
          subtopic_id: subtopic.id,
          scheduled_date: nextDate.toISOString().split("T")[0],
          target_difficulty: "easy", // Start with easier difficulty for reinforcement
          status: "pending",
          order_index: -1000 + index, // Negative order to prioritize
          estimated_minutes: 25,
        }));

        if (reinforcementNodes.length > 0) {
          const { error: insertError } = await supabase
            .from("learning_path_nodes")
            .insert(reinforcementNodes);

          if (insertError) {
            console.error("Error inserting reinforcement nodes:", insertError);
          } else {
            updates.push({
              type: "reinforcement_added",
              count: reinforcementNodes.length,
              topics: weakTopics,
            });
          }
        }
      }
    }

    // If strong topics, mark some nodes as skippable
    if (strongTopics.length > 0) {
      const { error: updateError } = await supabase
        .from("learning_path_nodes")
        .update({ target_difficulty: "hard" }) // Jump to harder difficulty
        .in("topic_id", strongTopics)
        .eq("goal_id", activeGoal.id)
        .eq("status", "pending")
        .eq("target_difficulty", "easy");

      if (!updateError) {
        updates.push({
          type: "difficulty_increased",
          topics: strongTopics,
        });
      }
    }

    // Update user's topic progress based on performance
    if (Array.isArray(performanceData)) {
      for (const pd of performanceData) {
        await supabase
          .from("user_topic_progress")
          .upsert({
            user_id: userId,
            topic_id: pd.topicId,
            mastery_percentage: pd.score,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "user_id,topic_id"
          });
      }
    }

    console.log(`Path updates applied:`, updates);

    return new Response(
      JSON.stringify({
        success: true,
        updates,
        weakTopicsDetected: weakTopics.length,
        strongTopicsDetected: strongTopics.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error updating learning path:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
