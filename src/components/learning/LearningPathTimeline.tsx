import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { format, differenceInDays, isToday, isTomorrow, isPast, isFuture, parseISO } from "date-fns";
import { Calendar, Clock, Target, CheckCircle2, Circle, Play, ChevronRight, Flame, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PathNode {
  id: string;
  topic_id: string;
  subtopic_id: string;
  scheduled_date: string;
  target_difficulty: string;
  status: string;
  order_index: number;
  estimated_minutes: number;
  topic?: { name: string; icon: string };
  subtopic?: { name: string };
}

interface LearningGoal {
  id: string;
  target_date: string;
  is_active: boolean;
}

export default function LearningPathTimeline() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pathNodes, setPathNodes] = useState<PathNode[]>([]);
  const [activeGoal, setActiveGoal] = useState<LearningGoal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadLearningPath();
    }
  }, [user]);

  const loadLearningPath = async () => {
    if (!user) return;

    try {
      // Fetch active learning goal
      const { data: goalData, error: goalError } = await supabase
        .from("user_learning_goals")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (goalError) throw goalError;
      setActiveGoal(goalData);

      if (!goalData) {
        setIsLoading(false);
        return;
      }

      // Fetch path nodes with topic and subtopic names
      const { data: nodesData, error: nodesError } = await supabase
        .from("learning_path_nodes")
        .select(`
          *,
          topic:topics(name, icon),
          subtopic:subtopics(name)
        `)
        .eq("goal_id", goalData.id)
        .order("scheduled_date")
        .order("order_index");

      if (nodesError) throw nodesError;
      setPathNodes(nodesData || []);
    } catch (error) {
      console.error("Error loading learning path:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markNodeComplete = async (nodeId: string) => {
    try {
      await supabase
        .from("learning_path_nodes")
        .update({ status: "completed" })
        .eq("id", nodeId);
      
      setPathNodes(prev =>
        prev.map(node =>
          node.id === nodeId ? { ...node, status: "completed" } : node
        )
      );
    } catch (error) {
      console.error("Error updating node:", error);
    }
  };

  const startPractice = (node: PathNode) => {
    // Navigate to practice with the specific subtopic
    navigate(`/practice?subtopic=${node.subtopic_id}&difficulty=${node.target_difficulty}`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activeGoal) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Learning Goal Set</h3>
          <p className="text-muted-foreground mb-4">
            Set a target date to generate your personalized learning path
          </p>
          <Button onClick={() => navigate("/set-goal")}>
            Set Learning Goal
          </Button>
        </CardContent>
      </Card>
    );
  }

  const daysUntilDeadline = differenceInDays(parseISO(activeGoal.target_date), new Date());
  const completedNodes = pathNodes.filter(n => n.status === "completed").length;
  const totalNodes = pathNodes.length;
  const progressPercentage = totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0;

  // Group nodes by date
  const nodesByDate = pathNodes.reduce((acc, node) => {
    const date = node.scheduled_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(node);
    return acc;
  }, {} as Record<string, PathNode[]>);

  const todayNodes = pathNodes.filter(n => isToday(parseISO(n.scheduled_date)));
  const upcomingNodes = pathNodes.filter(n => isFuture(parseISO(n.scheduled_date)) && !isToday(parseISO(n.scheduled_date)));

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isPast(date)) return format(date, "MMM d") + " (Past)";
    return format(date, "EEEE, MMM d");
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "medium": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "hard": return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      case "exam": return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "in_progress": return <Play className="h-5 w-5 text-primary" />;
      default: return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-primary">{daysUntilDeadline}</div>
              <div className="text-sm text-muted-foreground">Days Left</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{completedNodes}/{totalNodes}</div>
              <div className="text-sm text-muted-foreground">Sessions Done</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{progressPercentage}%</div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{todayNodes.length}</div>
              <div className="text-sm text-muted-foreground">Today's Tasks</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Target: {format(parseISO(activeGoal.target_date), "MMMM d, yyyy")}</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/set-goal")}>
              Adjust Goal
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Today's Focus */}
      {todayNodes.length > 0 && (
        <Card className="border-primary/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Today's Focus</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayNodes.map((node, index) => (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg border transition-all",
                    node.status === "completed" ? "bg-green-500/5 border-green-500/20" : "bg-card hover:border-primary/50"
                  )}
                >
                  {getStatusIcon(node.status)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{node.subtopic?.name || "Practice Session"}</div>
                    <div className="text-sm text-muted-foreground">{node.topic?.name}</div>
                  </div>

                  <Badge variant="outline" className={getDifficultyColor(node.target_difficulty)}>
                    {node.target_difficulty}
                  </Badge>

                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{node.estimated_minutes}m</span>
                  </div>

                  {node.status !== "completed" ? (
                    <Button size="sm" onClick={() => startPractice(node)}>
                      Start <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" disabled>
                      Done
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Schedule */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Upcoming Schedule</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
              {Object.entries(nodesByDate)
                .filter(([date]) => !isPast(parseISO(date)) || isToday(parseISO(date)))
                .slice(0, 7) // Show next 7 days
                .map(([date, nodes]) => (
                  <div key={date}>
                    <div className={cn(
                      "text-sm font-medium mb-3 flex items-center gap-2",
                      isToday(parseISO(date)) ? "text-primary" : "text-muted-foreground"
                    )}>
                      {isToday(parseISO(date)) && <Flame className="h-4 w-4" />}
                      {getDateLabel(date)}
                    </div>
                    
                    <div className="space-y-2 pl-4 border-l-2 border-muted">
                      {nodes.map(node => (
                        <div
                          key={node.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer",
                            node.status === "completed" ? "bg-green-500/5" : "bg-muted/30 hover:bg-muted/50"
                          )}
                          onClick={() => node.status !== "completed" && startPractice(node)}
                        >
                          {getStatusIcon(node.status)}
                          
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {node.subtopic?.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {node.topic?.name}
                            </div>
                          </div>

                          <Badge variant="outline" className={cn("text-xs", getDifficultyColor(node.target_difficulty))}>
                            {node.target_difficulty}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
