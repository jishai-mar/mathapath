import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Target, Sparkles, Play, X, ChevronRight, BookOpen, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSession } from '@/contexts/SessionContext';
import { useTutor } from '@/contexts/TutorContext';
import { TutorAvatar } from '@/components/tutor/TutorAvatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SessionDuration, SessionPlan } from '@/types/session';

interface SessionStartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionStart: () => void;
}

interface TopicOption {
  id: string;
  name: string;
  masteryPercentage: number;
  isWeak: boolean;
}

type Step = 'greeting' | 'time' | 'topics' | 'planning' | 'review';

export function SessionStartModal({ open, onOpenChange, onSessionStart }: SessionStartModalProps) {
  const { user } = useAuth();
  const { startPlanning, startSession, isPlanning } = useSession();
  const { preferences: tutorPrefs } = useTutor();
  
  const [step, setStep] = useState<Step>('greeting');
  const [selectedDuration, setSelectedDuration] = useState<SessionDuration | null>(null);
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [plan, setPlan] = useState<SessionPlan | null>(null);
  const [loadingTopics, setLoadingTopics] = useState(false);

  const durations: { value: SessionDuration; label: string; description: string }[] = [
    { value: 15, label: '15 min', description: 'Quick practice' },
    { value: 30, label: '30 min', description: 'Focused session' },
    { value: 45, label: '45 min', description: 'Deep learning' },
    { value: 60, label: '60 min', description: 'Full mastery' },
  ];

  // Load topics with progress
  useEffect(() => {
    if (open && user) {
      loadTopics();
    }
  }, [open, user]);

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setStep('greeting');
      setSelectedDuration(null);
      setSelectedTopicIds([]);
      setPlan(null);
    }
  }, [open]);

  const loadTopics = async () => {
    if (!user) return;
    setLoadingTopics(true);
    
    try {
      const [{ data: topicsData }, { data: progressData }] = await Promise.all([
        supabase.from('topics').select('id, name').order('order_index'),
        supabase.from('user_topic_progress').select('topic_id, mastery_percentage').eq('user_id', user.id)
      ]);

      const progressMap = new Map((progressData || []).map(p => [p.topic_id, p.mastery_percentage]));
      
      const topicOptions: TopicOption[] = (topicsData || []).map(t => ({
        id: t.id,
        name: t.name,
        masteryPercentage: progressMap.get(t.id) || 0,
        isWeak: (progressMap.get(t.id) || 0) < 50
      }));

      setTopics(topicOptions);
    } catch (err) {
      console.error('Error loading topics:', err);
    } finally {
      setLoadingTopics(false);
    }
  };

  const handleTimeSelect = (duration: SessionDuration) => {
    setSelectedDuration(duration);
    setStep('topics');
  };

  const handleTopicToggle = (topicId: string) => {
    setSelectedTopicIds(prev => 
      prev.includes(topicId) 
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handlePlanSession = async () => {
    if (!selectedDuration) return;
    
    setStep('planning');
    const sessionPlan = await startPlanning(selectedDuration, selectedTopicIds);
    
    if (sessionPlan) {
      setPlan(sessionPlan);
      setStep('review');
    } else {
      setStep('topics'); // Go back on failure
    }
  };

  const handleStartSession = () => {
    if (plan) {
      startSession(plan);
      onSessionStart();
      onOpenChange(false);
    }
  };

  const tutorName = tutorPrefs.tutorName || 'Gilbert';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-background border-border">
        <AnimatePresence mode="wait">
          {/* Step 1: Greeting */}
          {step === 'greeting' && (
            <motion.div
              key="greeting"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              <div className="flex items-start gap-4 mb-6">
                <TutorAvatar style={tutorPrefs.avatarStyle} mood="happy" size="md" />
                <div className="flex-1">
                  <DialogHeader className="text-left">
                    <DialogTitle className="text-xl font-serif">
                      Hey there! 👋
                    </DialogTitle>
                  </DialogHeader>
                  <p className="text-muted-foreground mt-2">
                    I'm {tutorName}, your personal math tutor. Ready to learn together?
                  </p>
                </div>
              </div>
              
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 mb-6">
                <p className="text-sm">
                  <span className="font-medium text-primary">How it works:</span> Tell me how much time you have, and I'll create a personalized learning plan based on your progress and goals.
                </p>
              </div>

              <Button onClick={() => setStep('time')} className="w-full gap-2">
                Let's get started
                <ChevronRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {/* Step 2: Time Selection */}
          {step === 'time' && (
            <motion.div
              key="time"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              <DialogHeader>
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium uppercase tracking-wide">Session Duration</span>
                </div>
                <DialogTitle className="text-xl font-serif">
                  How much time do you have today?
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3 mt-6">
                {durations.map(({ value, label, description }) => (
                  <motion.button
                    key={value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleTimeSelect(value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedDuration === value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50 bg-card'
                    }`}
                  >
                    <div className="text-2xl font-bold text-foreground">{label}</div>
                    <div className="text-sm text-muted-foreground">{description}</div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3: Topic Selection */}
          {step === 'topics' && (
            <motion.div
              key="topics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              <DialogHeader>
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Target className="w-4 h-4" />
                  <span className="text-sm font-medium uppercase tracking-wide">Focus Areas (Optional)</span>
                </div>
                <DialogTitle className="text-xl font-serif">
                  Any topics you want to focus on?
                </DialogTitle>
              </DialogHeader>

              <p className="text-sm text-muted-foreground mt-2 mb-4">
                Select specific topics or let me choose based on your progress.
              </p>

              {loadingTopics ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {topics.map(topic => (
                    <button
                      key={topic.id}
                      onClick={() => handleTopicToggle(topic.id)}
                      className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition-all ${
                        selectedTopicIds.includes(topic.id)
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50 bg-card'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{topic.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {topic.isWeak && (
                          <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-500">
                            Needs work
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {topic.masteryPercentage}%
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setStep('time')} className="flex-1">
                  Back
                </Button>
                <Button onClick={handlePlanSession} className="flex-1 gap-2">
                  <Sparkles className="w-4 h-4" />
                  {selectedTopicIds.length > 0 ? 'Plan Session' : 'Let AI Choose'}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Planning (Loading) */}
          {step === 'planning' && (
            <motion.div
              key="planning"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 text-center"
            >
              <div className="py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 mx-auto mb-6"
                >
                  <Sparkles className="w-full h-full text-primary" />
                </motion.div>
                <h3 className="text-xl font-serif mb-2">Creating your personalized plan...</h3>
                <p className="text-muted-foreground">
                  Analyzing your progress and finding the best exercises
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 5: Review Plan */}
          {step === 'review' && plan && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              <DialogHeader>
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-medium uppercase tracking-wide">Your Session Plan</span>
                </div>
                <DialogTitle className="text-xl font-serif">
                  Ready for {plan.totalMinutes} minutes of learning!
                </DialogTitle>
              </DialogHeader>

              <p className="text-sm text-muted-foreground mt-2 mb-4">
                {plan.planRationale}
              </p>

              <div className="bg-muted/30 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Focus Areas</span>
                  <span className="text-xs text-muted-foreground">{plan.exercises.length} exercises</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {plan.focusAreas.map((area, i) => (
                    <Badge key={i} variant="secondary">{area}</Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {plan.exercises.slice(0, 5).map((exercise, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-card border border-border">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{exercise.subtopicName}</p>
                      <p className="text-xs text-muted-foreground">{exercise.reason}</p>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {exercise.difficulty}
                    </Badge>
                  </div>
                ))}
                {plan.exercises.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    +{plan.exercises.length - 5} more exercises
                  </p>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setStep('topics')} className="flex-1">
                  Adjust
                </Button>
                <Button onClick={handleStartSession} className="flex-1 gap-2">
                  <Play className="w-4 h-4" />
                  Start Session
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
