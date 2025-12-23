import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MathRenderer from './MathRenderer';
import ImageUploader from './ImageUploader';
import FeedbackCard from './FeedbackCard';
import ToolPanel from './tools/ToolPanel';
import { ExerciseTutor } from './exercise/ExerciseTutor';
import { 
  Lightbulb, 
  ArrowRight, 
  RotateCcw, 
  CheckCircle2, 
  XCircle,
  Camera,
  Sparkles,
  HelpCircle,
  MessageCircle
} from 'lucide-react';

interface Exercise {
  id: string;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hints: string[] | null;
}

interface TutorFeedback {
  what_went_well: string;
  where_it_breaks: string;
  what_to_focus_on_next: string;
}

interface AIFeedback {
  what_went_well: string;
  where_it_breaks: string;
  what_to_focus_on_next: string;
  is_correct: boolean;
  suggested_difficulty: 'easy' | 'medium' | 'hard';
}

interface ExerciseViewProps {
  exercise: Exercise;
  subtopicName: string;
  currentDifficulty?: 'easy' | 'medium' | 'hard';
  currentSubLevel?: number;
  onSubmitAnswer: (answer: string) => Promise<{ isCorrect: boolean; explanation: string | null; correctAnswer?: string; tutorFeedback?: TutorFeedback | null }>;
  onSubmitImage: (file: File) => Promise<AIFeedback>;
  onNextExercise: (suggestedDifficulty?: 'easy' | 'medium' | 'hard') => void;
  onHintReveal?: () => void;
  onFinishPractice: () => void;
  isSubmitting: boolean;
  exercisesAttempted: number;
}

// Math symbol buttons for quick input
const mathSymbols = [
  { label: 'x²', value: '^2' },
  { label: '√', value: '√' },
  { label: '÷', value: '÷' },
  { label: 'π', value: 'π' },
  { label: '(', value: '(' },
  { label: ')', value: ')' },
];

// Difficulty level display config
const difficultyConfig = {
  easy: { label: '🌱 Foundation', color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' },
  medium: { label: '🌿 Growing', color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' },
  hard: { label: '🌳 Advanced', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
};

export default function ExerciseView({
  exercise,
  subtopicName,
  currentDifficulty,
  currentSubLevel,
  onSubmitAnswer,
  onSubmitImage,
  onNextExercise,
  onHintReveal,
  onFinishPractice,
  isSubmitting,
  exercisesAttempted,
}: ExerciseViewProps) {
  const [answer, setAnswer] = useState('');
  const [revealedHints, setRevealedHints] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [showTutor, setShowTutor] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'text' | 'ai';
    isCorrect: boolean;
    explanation?: string | null;
    correctAnswer?: string;
    aiFeedback?: AIFeedback;
    tutorFeedback?: TutorFeedback | null;
  } | null>(null);

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || isSubmitting) return;
    
    const result = await onSubmitAnswer(answer.trim());
    setFeedback({
      type: 'text',
      isCorrect: result.isCorrect,
      explanation: result.explanation,
      correctAnswer: result.correctAnswer,
      tutorFeedback: result.tutorFeedback,
    });
  };

  const handleImageSubmit = async (file: File) => {
    const result = await onSubmitImage(file);
    setFeedback({
      type: 'ai',
      isCorrect: result.is_correct,
      aiFeedback: result,
    });
  };

  const handleNext = () => {
    const suggestedDifficulty = feedback?.aiFeedback?.suggested_difficulty;
    onNextExercise(suggestedDifficulty);
    setAnswer('');
    setFeedback(null);
    setRevealedHints(0);
    setShowUpload(false);
  };

  const handleRetry = () => {
    setAnswer('');
    setFeedback(null);
    setShowTutor(false);
  };

  const handleShowSolution = () => {
    // Reveal all hints first, then show solution on next click
    if (exercise.hints && revealedHints < exercise.hints.length) {
      setRevealedHints(exercise.hints.length);
      onHintReveal?.();
    }
  };

  const insertSymbol = (symbol: string) => {
    setAnswer(prev => prev + symbol);
  };

  const displayDifficulty = currentDifficulty || exercise.difficulty;
  const config = difficultyConfig[displayDifficulty];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left: Question */}
      <div className="space-y-6">
        {/* Difficulty indicator */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Solve the problem
          </h2>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg} border ${config.border}`}>
            <span className={`text-sm font-medium ${config.color}`}>
              {config.label}
            </span>
            {currentSubLevel && (
              <div className="flex gap-0.5 ml-1">
                {[1, 2, 3].map((level) => (
                  <div
                    key={level}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      level <= currentSubLevel 
                        ? displayDifficulty === 'easy' ? 'bg-green-400' 
                        : displayDifficulty === 'medium' ? 'bg-amber-400' 
                        : 'bg-red-400'
                        : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Question Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 md:p-12 rounded-2xl bg-card border border-border/50 shadow-lg"
        >
          <div className="text-center">
            <div className="text-2xl md:text-4xl leading-relaxed">
              <MathRenderer latex={exercise.question} displayMode />
            </div>
          </div>
        </motion.div>

        {/* Hint Card */}
        {exercise.hints && exercise.hints.length > 0 && (
          <AnimatePresence>
            {revealedHints > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 rounded-xl bg-muted/30 border border-border/30"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-1">Concept Hint</p>
                    <div className="text-sm text-muted-foreground">
                      {exercise.hints.slice(0, revealedHints).map((hint, i) => (
                        <p key={i} className="mb-1">
                          <MathRenderer latex={hint} />
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Right: Answer Section */}
      <div className="space-y-6">
        {!feedback ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-card border border-border/50 shadow-lg space-y-6"
          >
            <h3 className="font-medium text-foreground">Your Solution</h3>

            {!showUpload ? (
              <form onSubmit={handleTextSubmit} className="space-y-4">
                {/* Input with prefix */}
                <div className="relative">
                  <div className="flex items-center gap-2 p-4 rounded-xl border-2 border-primary/30 bg-muted/20 focus-within:border-primary transition-colors">
                    <span className="text-muted-foreground font-mono">f(x) =</span>
                    <Input
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Enter simplified expression"
                      className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-lg font-mono"
                      disabled={isSubmitting}
                    />
                    <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">Enter</span>
                  </div>
                </div>

                {/* Math symbols */}
                <div className="flex flex-wrap gap-2">
                  {mathSymbols.map((symbol) => (
                    <button
                      key={symbol.label}
                      type="button"
                      onClick={() => insertSymbol(symbol.value)}
                      className="w-10 h-10 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors font-mono"
                    >
                      {symbol.label}
                    </button>
                  ))}
                </div>

                <div className="border-t border-border/50 pt-4">
                  <Button 
                    type="submit" 
                    disabled={!answer.trim() || isSubmitting}
                    className="w-full h-12 text-base gap-2"
                  >
                    Check Answer
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>

                <button
                  type="button"
                  onClick={handleShowSolution}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  I'm stuck, show solution
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <ImageUploader
                  onImageSelected={handleImageSubmit}
                  isUploading={isSubmitting}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={() => setShowUpload(false)}
                >
                  Back to text answer
                </Button>
              </div>
            )}

            {!showUpload && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border/50" />
                <span>or</span>
                <div className="h-px flex-1 bg-border/50" />
              </div>
            )}

            {!showUpload && (
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={() => setShowUpload(true)}
              >
                <Camera className="w-4 h-4" />
                Upload handwritten work
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            {feedback.type === 'ai' && feedback.aiFeedback ? (
              <FeedbackCard feedback={feedback.aiFeedback} />
            ) : feedback.type === 'text' && !feedback.isCorrect && feedback.tutorFeedback ? (
              /* Show tutor-style feedback for incorrect text answers */
              <FeedbackCard feedback={{
                ...feedback.tutorFeedback,
                is_correct: false,
                suggested_difficulty: currentDifficulty || exercise.difficulty,
              }} />
            ) : (
              <div className={`p-6 rounded-2xl border-2 ${
                feedback.isCorrect 
                  ? 'border-primary/50 bg-primary/5' 
                  : 'border-destructive/50 bg-destructive/5'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  {feedback.isCorrect ? (
                    <>
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-semibold text-xl text-foreground">Correct!</span>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                        <XCircle className="w-5 h-5 text-destructive" />
                      </div>
                      <span className="font-semibold text-xl text-foreground">Not quite right</span>
                    </>
                  )}
                </div>
                
                {feedback.explanation && (
                  <div className="text-sm text-muted-foreground pt-4 border-t border-border/50">
                    <MathRenderer latex={feedback.explanation} />
                  </div>
                )}

                {!feedback.isCorrect && feedback.correctAnswer && (
                  <p className="text-sm text-muted-foreground mt-3">
                    The correct answer is: <span className="font-mono text-foreground">{feedback.correctAnswer}</span>
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {!feedback.isCorrect && (
                <Button
                  variant="outline"
                  onClick={handleRetry}
                  className="flex-1 gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Try Again
                </Button>
              )}
              <Button
                onClick={handleNext}
                className={`gap-2 ${feedback.isCorrect ? 'flex-1' : ''}`}
              >
                Next Exercise
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {exercisesAttempted >= 3 && (
              <Button
                variant="ghost"
                onClick={onFinishPractice}
                className="w-full text-muted-foreground"
              >
                Finish Practice
              </Button>
            )}
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="lg:col-span-2 flex items-center justify-between pt-8 text-sm text-muted-foreground border-t border-border/30">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>Connected</span>
          <span className="text-muted-foreground/60">Session ID: #{Math.random().toString(36).substr(2, 5).toUpperCase()}</span>
        </div>
        <span className="text-xs opacity-60">Cmd + Enter to Submit</span>
      </div>

      {/* Interactive Tools Panel */}
      <ToolPanel subtopicName={subtopicName} />

      {/* Floating Tutor Button */}
      <AnimatePresence>
        {!showTutor && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-6 right-6 z-40"
          >
            <Button
              onClick={() => setShowTutor(true)}
              size="lg"
              className="rounded-full h-14 w-14 shadow-xl bg-primary hover:bg-primary/90"
            >
              <MessageCircle className="w-6 h-6" />
            </Button>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercise Tutor Modal */}
      <AnimatePresence>
        {showTutor && (
          <ExerciseTutor
            isOpen={showTutor}
            onClose={() => setShowTutor(false)}
            exerciseQuestion={exercise.question}
            subtopicName={subtopicName}
            currentAnswer={answer}
            difficulty={displayDifficulty}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
