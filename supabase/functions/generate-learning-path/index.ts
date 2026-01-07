import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TopicProgress {
  topic_id: string;
  mastery_percentage: number;
}

interface Subtopic {
  id: string;
  topic_id: string;
  name: string;
  order_index: number;
}

interface Topic {
  id: string;
  name: string;
  order_index: number;
}

interface Prerequisite {
  topic_id: string;
  prerequisite_topic_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, goalId, targetDate, selectedTopics } = await req.json();

    if (!userId || !goalId || !targetDate || !selectedTopics?.length) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Generating learning path for user:", userId);

    // Fetch all topics
    const { data: allTopics, error: topicsError } = await supabase
      .from("topics")
      .select("*")
      .in("id", selectedTopics)
      .order("order_index");

    if (topicsError) throw topicsError;

    // Fetch all subtopics for selected topics
    const { data: allSubtopics, error: subtopicsError } = await supabase
      .from("subtopics")
      .select("*")
      .in("topic_id", selectedTopics)
      .order("order_index");

    if (subtopicsError) throw subtopicsError;

    // Fetch user's current progress
    const { data: userProgress, error: progressError } = await supabase
      .from("user_topic_progress")
      .select("topic_id, mastery_percentage")
      .eq("user_id", userId)
      .in("topic_id", selectedTopics);

    if (progressError) throw progressError;

    // Fetch prerequisites
    const { data: prerequisites, error: prereqError } = await supabase
      .from("topic_prerequisites")
      .select("topic_id, prerequisite_topic_id")
      .in("topic_id", selectedTopics);

    // Create progress map
    const progressMap = new Map<string, number>();
    (userProgress || []).forEach((p: TopicProgress) => {
      progressMap.set(p.topic_id, p.mastery_percentage);
    });

    // Create prerequisite map
    const prereqMap = new Map<string, string[]>();
    (prerequisites || []).forEach((p: Prerequisite) => {
      const existing = prereqMap.get(p.topic_id) || [];
      prereqMap.set(p.topic_id, [...existing, p.prerequisite_topic_id]);
    });

    // Topological sort topics based on prerequisites
    const sortedTopics = topologicalSort(allTopics || [], prereqMap);

    // Calculate days available
    const targetDateObj = new Date(targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalDays = Math.ceil((targetDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    console.log(`Total days available: ${totalDays}`);

    // Calculate work units per topic (inverse of mastery = more work needed)
    const topicWorkUnits = new Map<string, number>();
    let totalWorkUnits = 0;
    
    sortedTopics.forEach((topic: Topic) => {
      const mastery = progressMap.get(topic.id) || 0;
      const workNeeded = Math.max(100 - mastery, 20); // Minimum 20% work even if mastered
      topicWorkUnits.set(topic.id, workNeeded);
      totalWorkUnits += workNeeded;
    });

    // Generate path nodes
    const pathNodes: any[] = [];
    let currentDate = new Date(today);
    currentDate.setDate(currentDate.getDate() + 1); // Start tomorrow
    let orderIndex = 0;

    // Allocate days proportionally to work needed
    sortedTopics.forEach((topic: Topic) => {
      const workUnits = topicWorkUnits.get(topic.id) || 50;
      const daysForTopic = Math.max(
        Math.round((workUnits / totalWorkUnits) * totalDays),
        3 // Minimum 3 days per topic
      );

      const topicSubtopics = (allSubtopics || []).filter(
        (s: Subtopic) => s.topic_id === topic.id
      );

      // Distribute subtopics across allocated days
      const subtopicsPerDay = Math.max(1, Math.ceil(topicSubtopics.length / daysForTopic));
      let subtopicIndex = 0;

      for (let day = 0; day < daysForTopic && subtopicIndex < topicSubtopics.length; day++) {
        const dayDate = new Date(currentDate);
        dayDate.setDate(dayDate.getDate() + day);

        // Assign subtopics for this day
        for (let i = 0; i < subtopicsPerDay && subtopicIndex < topicSubtopics.length; i++) {
          const subtopic = topicSubtopics[subtopicIndex];
          const mastery = progressMap.get(topic.id) || 0;

          // Determine starting difficulty based on mastery
          let difficulty = "easy";
          if (mastery >= 80) difficulty = "hard";
          else if (mastery >= 50) difficulty = "medium";

          pathNodes.push({
            user_id: userId,
            goal_id: goalId,
            topic_id: topic.id,
            subtopic_id: subtopic.id,
            scheduled_date: dayDate.toISOString().split("T")[0],
            target_difficulty: difficulty,
            status: "pending",
            order_index: orderIndex++,
            estimated_minutes: difficulty === "easy" ? 20 : difficulty === "medium" ? 30 : 40,
          });

          subtopicIndex++;
        }
      }

      // Move to next topic's start date
      currentDate.setDate(currentDate.getDate() + daysForTopic);
    });

    // Clear existing path nodes for this goal
    await supabase
      .from("learning_path_nodes")
      .delete()
      .eq("goal_id", goalId);

    // Insert new path nodes in batches
    const batchSize = 100;
    for (let i = 0; i < pathNodes.length; i += batchSize) {
      const batch = pathNodes.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from("learning_path_nodes")
        .insert(batch);

      if (insertError) {
        console.error("Error inserting batch:", insertError);
        throw insertError;
      }
    }

    console.log(`Generated ${pathNodes.length} path nodes`);

    // Generate summary
    const summary = {
      totalNodes: pathNodes.length,
      totalDays,
      topicsCount: sortedTopics.length,
      estimatedTotalMinutes: pathNodes.reduce((sum, n) => sum + n.estimated_minutes, 0),
      startDate: pathNodes[0]?.scheduled_date,
      endDate: pathNodes[pathNodes.length - 1]?.scheduled_date,
    };

    return new Response(
      JSON.stringify({ success: true, summary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error generating learning path:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Topological sort with Kahn's algorithm
function topologicalSort(topics: Topic[], prereqMap: Map<string, string[]>): Topic[] {
  const topicMap = new Map<string, Topic>();
  topics.forEach(t => topicMap.set(t.id, t));

  // Calculate in-degrees (considering only selected topics)
  const selectedIds = new Set(topics.map(t => t.id));
  const inDegree = new Map<string, number>();
  topics.forEach(t => inDegree.set(t.id, 0));

  prereqMap.forEach((prereqs, topicId) => {
    if (selectedIds.has(topicId)) {
      const validPrereqs = prereqs.filter(p => selectedIds.has(p));
      inDegree.set(topicId, validPrereqs.length);
    }
  });

  // Find topics with no prerequisites (among selected topics)
  const queue: Topic[] = [];
  topics.forEach(t => {
    if ((inDegree.get(t.id) || 0) === 0) {
      queue.push(t);
    }
  });

  // Sort by order_index for consistent ordering among peers
  queue.sort((a, b) => a.order_index - b.order_index);

  const result: Topic[] = [];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);

    // Find topics that depend on current
    prereqMap.forEach((prereqs, topicId) => {
      if (prereqs.includes(current.id) && selectedIds.has(topicId)) {
        const newDegree = (inDegree.get(topicId) || 1) - 1;
        inDegree.set(topicId, newDegree);
        
        if (newDegree === 0) {
          const topic = topicMap.get(topicId);
          if (topic) {
            // Insert in order_index order
            const insertIndex = queue.findIndex(t => t.order_index > topic.order_index);
            if (insertIndex === -1) {
              queue.push(topic);
            } else {
              queue.splice(insertIndex, 0, topic);
            }
          }
        }
      }
    });
  }

  // Add any remaining topics (in case of cycles or isolated nodes)
  topics.forEach(t => {
    if (!result.find(r => r.id === t.id)) {
      result.push(t);
    }
  });

  return result;
}
