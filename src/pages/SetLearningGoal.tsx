import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, differenceInDays, addWeeks } from "date-fns";
import { Calendar as CalendarIcon, Target, Clock, Sparkles, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Topic {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  order_index: number;
}

interface TopicMastery {
  topic_id: string;
  mastery_percentage: number;
}

export default function SetLearningGoal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [targetDate, setTargetDate] = useState<Date | undefined>(addWeeks(new Date(), 8));
  const [topicMastery, setTopicMastery] = useState<Map<string, number>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState<'topics' | 'date' | 'review'>('topics');

  useEffect(() => {
    loadTopicsAndProgress();
  }, [user]);

  const loadTopicsAndProgress = async () => {
    if (!user) return;

    try {
      // Fetch all topics
      const { data: topicsData, error: topicsError } = await supabase
        .from("topics")
        .select("*")
        .order("order_index");

      if (topicsError) throw topicsError;
      setTopics(topicsData || []);
      setSelectedTopics((topicsData || []).map(t => t.id));

      // Fetch user's current mastery per topic
      const { data: progressData, error: progressError } = await supabase
        .from("user_topic_progress")
        .select("topic_id, mastery_percentage")
        .eq("user_id", user.id);

      if (progressError) throw progressError;

      const masteryMap = new Map<string, number>();
      (progressData || []).forEach((p: TopicMastery) => {
        masteryMap.set(p.topic_id, p.mastery_percentage);
      });
      setTopicMastery(masteryMap);
    } catch (error) {
      console.error("Error loading topics:", error);
      toast.error("Failed to load topics");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTopic = (topicId: string) => {
    setSelectedTopics(prev =>
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const selectAll = () => setSelectedTopics(topics.map(t => t.id));
  const deselectAll = () => setSelectedTopics([]);

  const daysUntilDeadline = targetDate ? differenceInDays(targetDate, new Date()) : 0;
  const weeksUntilDeadline = Math.ceil(daysUntilDeadline / 7);

  const estimatedMinutesPerDay = () => {
    if (!selectedTopics.length || daysUntilDeadline <= 0) return 0;
    
    // Calculate total work needed based on mastery gaps
    let totalWorkUnits = 0;
    selectedTopics.forEach(topicId => {
      const currentMastery = topicMastery.get(topicId) || 0;
      const gapToFill = 100 - currentMastery;
      totalWorkUnits += gapToFill;
    });
    
    // Estimate ~3 minutes per 1% of mastery to gain
    const totalMinutes = totalWorkUnits * 3;
    return Math.ceil(totalMinutes / daysUntilDeadline);
  };

  const getPaceAssessment = () => {
    const minutes = estimatedMinutesPerDay();
    if (minutes <= 30) return { level: "relaxed", color: "text-green-500", message: "Comfortable pace" };
    if (minutes <= 60) return { level: "moderate", color: "text-yellow-500", message: "Moderate intensity" };
    if (minutes <= 90) return { level: "intensive", color: "text-orange-500", message: "Intensive schedule" };
    return { level: "extreme", color: "text-destructive", message: "Very challenging" };
  };

  const handleGeneratePath = async () => {
    if (!user || selectedTopics.length === 0 || !targetDate) {
      toast.error("Please select topics and a target date");
      return;
    }

    if (daysUntilDeadline < 14) {
      toast.error("Please select a date at least 2 weeks from now");
      return;
    }

    setIsGenerating(true);

    try {
      // Deactivate any existing goals
      await supabase
        .from("user_learning_goals")
        .update({ is_active: false })
        .eq("user_id", user.id);

      // Create new learning goal
      const { data: goalData, error: goalError } = await supabase
        .from("user_learning_goals")
        .insert({
          user_id: user.id,
          target_date: format(targetDate, "yyyy-MM-dd"),
          topics_to_master: selectedTopics,
          is_active: true,
        })
        .select()
        .single();

      if (goalError) throw goalError;

      // Generate the learning path
      const { data, error } = await supabase.functions.invoke("generate-learning-path", {
        body: {
          userId: user.id,
          goalId: goalData.id,
          targetDate: format(targetDate, "yyyy-MM-dd"),
          selectedTopics,
        },
      });

      if (error) throw error;

      // Update profile with target date
      await supabase
        .from("profiles")
        .update({
          target_mastery_date: format(targetDate, "yyyy-MM-dd"),
          learning_path_generated_at: new Date().toISOString(),
          onboarding_completed: true,
        })
        .eq("id", user.id);

      toast.success("Learning path generated successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error generating learning path:", error);
      toast.error("Failed to generate learning path");
    } finally {
      setIsGenerating(false);
    }
  };

  const pace = getPaceAssessment();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Target className="h-4 w-4" />
            <span className="text-sm font-medium">Set Your Learning Goal</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">When do you want to master everything?</h1>
          <p className="text-muted-foreground">
            We'll create a personalized learning path based on your current level and deadline
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {['topics', 'date', 'review'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  step === s ? "bg-primary text-primary-foreground" :
                  ['topics', 'date', 'review'].indexOf(step) > i ? "bg-primary/20 text-primary" :
                  "bg-muted text-muted-foreground"
                )}
              >
                {['topics', 'date', 'review'].indexOf(step) > i ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className={cn(
                "text-sm hidden sm:block",
                step === s ? "text-foreground font-medium" : "text-muted-foreground"
              )}>
                {s === 'topics' ? 'Select Topics' : s === 'date' ? 'Set Deadline' : 'Review'}
              </span>
              {i < 2 && <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 'topics' && (
            <motion.div
              key="topics"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Select Topics to Master</CardTitle>
                  <CardDescription>
                    Choose which topics you want to include in your learning path
                  </CardDescription>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={selectAll}>Select All</Button>
                    <Button variant="outline" size="sm" onClick={deselectAll}>Deselect All</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="grid gap-3">
                      {topics.map(topic => {
                        const mastery = topicMastery.get(topic.id) || 0;
                        const isSelected = selectedTopics.includes(topic.id);
                        
                        return (
                          <div
                            key={topic.id}
                            className={cn(
                              "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all",
                              isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                            )}
                            onClick={() => toggleTopic(topic.id)}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleTopic(topic.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{topic.name}</span>
                                {mastery >= 80 && (
                                  <Badge variant="secondary" className="text-xs">Strong</Badge>
                                )}
                              </div>
                              {topic.description && (
                                <p className="text-sm text-muted-foreground truncate">{topic.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="text-sm font-medium">{mastery}%</div>
                                <div className="text-xs text-muted-foreground">mastery</div>
                              </div>
                              <div className="w-16">
                                <Progress value={mastery} className="h-2" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>

                  <div className="flex justify-between items-center mt-6 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      {selectedTopics.length} of {topics.length} topics selected
                    </div>
                    <Button
                      onClick={() => setStep('date')}
                      disabled={selectedTopics.length === 0}
                    >
                      Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 'date' && (
            <motion.div
              key="date"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Set Your Target Date</CardTitle>
                  <CardDescription>
                    By when do you want to be fully exam-ready?
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col lg:flex-row gap-8">
                    <div className="flex-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal h-14",
                              !targetDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-5 w-5" />
                            {targetDate ? format(targetDate, "MMMM d, yyyy") : "Select a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={targetDate}
                            onSelect={setTargetDate}
                            disabled={(date) => date < addWeeks(new Date(), 2)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>

                      <div className="mt-4 grid grid-cols-3 gap-2">
                        {[4, 8, 12].map(weeks => (
                          <Button
                            key={weeks}
                            variant="outline"
                            size="sm"
                            onClick={() => setTargetDate(addWeeks(new Date(), weeks))}
                            className={cn(
                              weeksUntilDeadline === weeks && "border-primary"
                            )}
                          >
                            {weeks} weeks
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Time Until Deadline</span>
                        </div>
                        <div className="text-2xl font-bold">
                          {daysUntilDeadline} days
                          <span className="text-sm font-normal text-muted-foreground ml-2">
                            ({weeksUntilDeadline} weeks)
                          </span>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Estimated Daily Practice</span>
                        </div>
                        <div className="text-2xl font-bold">
                          ~{estimatedMinutesPerDay()} min/day
                        </div>
                        <div className={cn("text-sm mt-1", pace.color)}>
                          {pace.message}
                        </div>
                      </div>

                      {daysUntilDeadline < 14 && (
                        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                          <div className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              Please select a date at least 2 weeks from now
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-6 pt-4 border-t">
                    <Button variant="ghost" onClick={() => setStep('topics')}>
                      Back
                    </Button>
                    <Button
                      onClick={() => setStep('review')}
                      disabled={!targetDate || daysUntilDeadline < 14}
                    >
                      Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Review Your Learning Goal</CardTitle>
                  <CardDescription>
                    Confirm your settings and generate your personalized learning path
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Target Date</div>
                        <div className="text-xl font-semibold">
                          {targetDate && format(targetDate, "MMMM d, yyyy")}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {daysUntilDeadline} days from now
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Topics to Master</div>
                        <div className="text-xl font-semibold">{selectedTopics.length} topics</div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Estimated Daily Practice</div>
                        <div className="text-xl font-semibold">~{estimatedMinutesPerDay()} minutes</div>
                        <div className={cn("text-sm", pace.color)}>{pace.message}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Selected Topics</div>
                      <ScrollArea className="h-[200px]">
                        <div className="space-y-2">
                          {topics
                            .filter(t => selectedTopics.includes(t.id))
                            .map(topic => (
                              <div key={topic.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                                <span className="text-sm">{topic.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {topicMastery.get(topic.id) || 0}% mastery
                                </span>
                              </div>
                            ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>

                  <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <div className="font-medium text-primary">AI-Powered Learning Path</div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Our AI will create a personalized schedule that prioritizes your weak areas,
                          respects prerequisite dependencies, and adapts as you progress.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-6 pt-4 border-t">
                    <Button variant="ghost" onClick={() => setStep('date')}>
                      Back
                    </Button>
                    <Button onClick={handleGeneratePath} disabled={isGenerating}>
                      {isGenerating ? (
                        <>Generating Path...</>
                      ) : (
                        <>Generate My Learning Path <Sparkles className="ml-2 h-4 w-4" /></>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
