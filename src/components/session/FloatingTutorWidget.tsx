import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, X, Clock, Play, Pause, CheckCircle2, 
  ChevronUp, ChevronDown, Target, Sparkles, ArrowRight,
  SkipForward, StopCircle, TrendingUp, TrendingDown, Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSession } from '@/contexts/SessionContext';
import { useTutor } from '@/contexts/TutorContext';
import { TutorAvatar } from '@/components/tutor/TutorAvatar';
import { useNavigate } from 'react-router-dom';

const PROACTIVE_TIPS = {
  time: [
    { threshold: 300, message: "5 minutes left! Let's finish strong with one more exercise." },
    { threshold: 600, message: "10 minutes remaining. Great pacing so far!" },
  ],
  progress: [
    { percent: 25, message: "Quarter of the way done! Keep the momentum going." },
    { percent: 50, message: "Halfway there! You're doing great." },
    { percent: 75, message: "Almost done! Just a few more to go." },
    { percent: 90, message: "Final stretch! You've got this." },
  ],
};

export function FloatingTutorWidget() {
  const navigate = useNavigate();
  const { 
    activeSession, 
    isSessionActive, 
    timeRemaining, 
    currentExercise,
    pauseSession,
    resumeSession,
    endSession,
    skipExercise,
    goToExercise,
    addTutorMessage,
    getAdaptedExercise,
  } = useSession();
  const { preferences: tutorPrefs } = useTutor();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPlanPanel, setShowPlanPanel] = useState(false);
  const [showNewTip, setShowNewTip] = useState(false);
  const shownTipsRef = useRef<Set<string>>(new Set());
  const lastMessageCountRef = useRef(0);

  // Proactive tip generation based on time and progress
  useEffect(() => {
    if (!activeSession || activeSession.isPaused) return;

    const progressPercent = activeSession.plan.exercises.length > 0
      ? (activeSession.exercisesCompleted / activeSession.plan.exercises.length) * 100
      : 0;

    // Check time-based tips
    for (const tip of PROACTIVE_TIPS.time) {
      const tipKey = `time-${tip.threshold}`;
      if (timeRemaining <= tip.threshold && timeRemaining > tip.threshold - 10 && !shownTipsRef.current.has(tipKey)) {
        shownTipsRef.current.add(tipKey);
        addTutorMessage(tip.message, 'tip');
        break;
      }
    }

    // Check progress-based tips
    for (const tip of PROACTIVE_TIPS.progress) {
      const tipKey = `progress-${tip.percent}`;
      if (progressPercent >= tip.percent && progressPercent < tip.percent + 5 && !shownTipsRef.current.has(tipKey)) {
        shownTipsRef.current.add(tipKey);
        addTutorMessage(tip.message, 'encouragement');
        break;
      }
    }
  }, [timeRemaining, activeSession, addTutorMessage]);

  // Flash indicator when new message arrives
  useEffect(() => {
    if (activeSession && activeSession.messages.length > lastMessageCountRef.current) {
      setShowNewTip(true);
      const timer = setTimeout(() => setShowNewTip(false), 3000);
      lastMessageCountRef.current = activeSession.messages.length;
      return () => clearTimeout(timer);
    }
  }, [activeSession?.messages.length]);

  if (!isSessionActive || !activeSession) return null;

  const adaptedExercise = getAdaptedExercise();
  const displayExercise = adaptedExercise || currentExercise;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = activeSession.plan.exercises.length > 0
    ? (activeSession.exercisesCompleted / activeSession.plan.exercises.length) * 100
    : 0;

  const handleGoToExercise = (index: number) => {
    const exercise = activeSession.plan.exercises[index];
    if (exercise) {
      goToExercise(index);
      navigate(`/practice-question/${exercise.subtopicId}?difficulty=${exercise.difficulty}`);
      setShowPlanPanel(false);
    }
  };

  const handleCurrentExercise = () => {
    if (currentExercise) {
      navigate(`/practice-question/${currentExercise.subtopicId}?difficulty=${currentExercise.difficulty}`);
    }
  };

  return (
    <>
      {/* Floating Widget */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              key="expanded"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-80 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TutorAvatar style={tutorPrefs.avatarStyle} mood="happy" size="sm" />
                    <span className="font-medium text-sm">{tutorPrefs.tutorName}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsExpanded(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Timer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className={`font-mono text-lg font-bold ${timeRemaining < 300 ? 'text-destructive' : 'text-foreground'}`}>
                      {formatTime(timeRemaining)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={activeSession.isPaused ? resumeSession : pauseSession}
                    >
                      {activeSession.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={endSession}
                    >
                      <StopCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Session Progress</span>
                  <span className="font-medium">
                    {activeSession.exercisesCompleted}/{activeSession.plan.exercises.length}
                  </span>
                </div>
                <Progress value={progressPercent} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                  <span>{activeSession.exercisesCorrect} correct</span>
                  <span>{activeSession.exercisesCompleted - activeSession.exercisesCorrect} to review</span>
                </div>
              </div>

              {/* Current Exercise */}
              {currentExercise && (
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-2 text-xs text-primary font-medium mb-2">
                    <Target className="w-3 h-3" />
                    CURRENT EXERCISE
                  </div>
                  <button 
                    onClick={handleCurrentExercise}
                    className="w-full text-left p-3 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
                  >
                    <p className="font-medium text-sm">{currentExercise.subtopicName}</p>
                    <p className="text-xs text-muted-foreground mt-1">{currentExercise.reason}</p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline" className="text-xs capitalize">
                        {currentExercise.difficulty}
                      </Badge>
                      <ArrowRight className="w-4 h-4 text-primary" />
                    </div>
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="p-4 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={skipExercise}>
                  <SkipForward className="w-3 h-3" />
                  Skip
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => setShowPlanPanel(true)}>
                  <Sparkles className="w-3 h-3" />
                  View Plan
                </Button>
              </div>

              {/* Latest Message */}
              {activeSession.messages.length > 0 && (
                <div className="p-4 bg-muted/30 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">{tutorPrefs.tutorName} says:</p>
                  <p className="text-sm italic">
                    "{activeSession.messages[activeSession.messages.length - 1].content}"
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.button
              key="collapsed"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={() => setIsExpanded(true)}
              className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-full shadow-lg hover:shadow-xl transition-shadow"
            >
              <TutorAvatar style={tutorPrefs.avatarStyle} mood="happy" size="sm" />
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className={`font-mono text-sm font-bold ${timeRemaining < 300 ? 'text-destructive' : 'text-foreground'}`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {activeSession.exercisesCompleted}/{activeSession.plan.exercises.length} done
                </p>
              </div>
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Plan Panel Overlay */}
      <AnimatePresence>
        {showPlanPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowPlanPanel(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border shadow-2xl"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-serif">Session Plan</h2>
                  <p className="text-sm text-muted-foreground">{activeSession.plan.planRationale}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowPlanPanel(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <ScrollArea className="h-[calc(100vh-100px)]">
                <div className="p-6 space-y-3">
                  {activeSession.plan.exercises.map((exercise, i) => {
                    const isCurrent = i === activeSession.currentExerciseIndex;
                    const isCompleted = exercise.completed;
                    
                    return (
                      <button
                        key={i}
                        onClick={() => handleGoToExercise(i)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          isCurrent 
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : isCompleted
                            ? 'border-border bg-muted/30'
                            : 'border-border bg-card hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            isCompleted 
                              ? exercise.wasCorrect 
                                ? 'bg-green-500/20 text-green-500'
                                : 'bg-amber-500/20 text-amber-500'
                              : isCurrent
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              i + 1
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`font-medium ${isCompleted ? 'text-muted-foreground' : ''}`}>
                                {exercise.subtopicName}
                              </p>
                              {isCurrent && (
                                <Badge className="text-xs">Current</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{exercise.topicName}</p>
                            <p className="text-xs text-muted-foreground/80 mt-1 italic">{exercise.reason}</p>
                          </div>
                          <Badge variant="outline" className="text-xs capitalize flex-shrink-0">
                            {exercise.difficulty}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
