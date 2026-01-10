import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { usePracticeExercise } from '@/hooks/usePracticeExercise';
import {
  PracticeQuestionCard,
  TheoryPanel,
  SolutionPanel,
  TheoryCheckPrompt
} from '@/components/practice';

export default function PracticeQuestion() {
  const { subtopicId } = useParams<{ subtopicId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const exerciseContext = useExerciseContext();

  // For demo purposes, using hardcoded values - in production, fetch from DB
  const subtopicName = "Practice Exercise";
  const topicName = "Mathematics";

  const practice = usePracticeExercise({
    subtopicId: subtopicId || '',
    subtopicName,
    topicName,
    initialDifficulty: 'easy'
  });

  // Set current screen in ExerciseContext for tutor awareness
  // Use stable references to avoid infinite re-render loop
  const setCurrentScreen = exerciseContext?.setCurrentScreen;
  const currentScreen = exerciseContext?.currentScreen;
  
  useEffect(() => {
    if (setCurrentScreen && currentScreen !== 'PracticeQuestion') {
      setCurrentScreen('PracticeQuestion');
    }
  }, [setCurrentScreen, currentScreen]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Load first exercise on mount
  useEffect(() => {
    if (user && subtopicId && !practice.currentExercise && !practice.isLoading) {
      practice.loadNextExercise();
    }
  }, [user, subtopicId]);

  const handleNextExercise = () => {
    practice.loadNextExercise();
  };

  return (
    <div className="min-h-screen bg-gradient-warm">
      {/* Header */}
      <header className="p-4 border-b border-border/20">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-lg font-semibold">{topicName}</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
          >
            <Home className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-6">
        <AnimatePresence mode="wait">
          {/* Theory Check Prompt - shown before exercise */}
          {practice.currentExercise && practice.showTheoryCheck && !practice.isLoading && (
            <motion.div
              key="theory-check"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <TheoryCheckPrompt
                question={practice.currentExercise.question}
                subtopicName={subtopicName}
                linkedTheoryBlocks={practice.exerciseDetails?.linkedTheory}
                onComplete={practice.completeTheoryCheck}
                onOpenTheory={practice.openTheory}
              />
            </motion.div>
          )}

          {/* Practice Question Card - shown after theory check */}
          {practice.currentExercise && !practice.showTheoryCheck && (
            <motion.div
              key="question"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <PracticeQuestionCard
                exercise={practice.currentExercise}
                exerciseDetails={practice.exerciseDetails}
                studentAnswer={practice.studentAnswer}
                onAnswerChange={practice.setStudentAnswer}
                onSubmit={practice.submitAnswer}
                onOpenTheory={practice.openTheory}
                onOpenSolution={practice.openSolution}
                onRevealHint={practice.revealNextStep}
                onNextExercise={handleNextExercise}
                onStartWalkthrough={practice.startWalkthrough}
                onSaveToNotebook={practice.saveToNotebook}
                revealedStepCount={practice.revealedStepCount}
                isCorrect={practice.isCorrect}
                feedbackMessage={practice.feedbackMessage}
                tutorFeedback={practice.tutorFeedback}
                correctAnswer={practice.correctAnswer}
                isSubmitting={practice.isSubmitting}
                isLoading={practice.isLoading}
                isSavedToNotebook={practice.isSavedToNotebook}
                isSavingToNotebook={practice.isSavingToNotebook}
                mode={practice.mode}
                exerciseCount={practice.exerciseCount}
                correctCount={practice.correctCount}
              />
            </motion.div>
          )}

          {/* Loading state */}
          {practice.isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Panels */}
      <TheoryPanel
        isOpen={practice.isTheoryOpen}
        onClose={practice.closeTheory}
        theory={practice.exerciseDetails?.theory || null}
        topicName={topicName}
      />

      <SolutionPanel
        isOpen={practice.isSolutionOpen}
        onClose={practice.closeSolution}
        steps={practice.exerciseDetails?.solutionSteps || null}
        finalAnswer={practice.exerciseDetails?.finalAnswer || null}
        tip={practice.exerciseDetails?.tip || null}
        question={practice.currentExercise?.question}
      />
    </div>
  );
}
