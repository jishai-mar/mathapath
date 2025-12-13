import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MathRenderer from './MathRenderer';
import ImageUploader from './ImageUploader';
import FeedbackCard from './FeedbackCard';
import { 
  Lightbulb, 
  Send, 
  ArrowRight, 
  RotateCcw, 
  CheckCircle2, 
  XCircle,
  ChevronDown,
  Camera
} from 'lucide-react';

interface Exercise {
  id: string;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hints: string[] | null;
  // Note: correct_answer is NOT included - answers are checked server-side
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
  onSubmitAnswer: (answer: string) => Promise<{ isCorrect: boolean; explanation: string | null; correctAnswer?: string }>;
  onSubmitImage: (file: File) => Promise<AIFeedback>;
  onNextExercise: (suggestedDifficulty?: 'easy' | 'medium' | 'hard') => void;
  onHintReveal?: () => void;
  isSubmitting: boolean;
}

const difficultyColors = {
  easy: 'bg-primary/20 text-primary border-primary/30',
  medium: 'bg-warning/20 text-[hsl(var(--warning))] border-warning/30',
  hard: 'bg-destructive/20 text-destructive border-destructive/30',
};

export default function ExerciseView({
  exercise,
  onSubmitAnswer,
  onSubmitImage,
  onNextExercise,
  onHintReveal,
  isSubmitting,
}: ExerciseViewProps) {
  const [answer, setAnswer] = useState('');
  const [showHints, setShowHints] = useState(false);
  const [revealedHints, setRevealedHints] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'text' | 'ai';
    isCorrect: boolean;
    explanation?: string | null;
    correctAnswer?: string;
    aiFeedback?: AIFeedback;
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
    setShowHints(false);
    setRevealedHints(0);
    setShowUpload(false);
  };

  const handleRetry = () => {
    setAnswer('');
    setFeedback(null);
  };

  const revealNextHint = () => {
    if (exercise.hints && revealedHints < exercise.hints.length) {
      setRevealedHints(prev => prev + 1);
      // Notify parent about hint reveal for tracking
      onHintReveal?.();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Question Card */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Badge 
              variant="outline" 
              className={`capitalize ${difficultyColors[exercise.difficulty]}`}
            >
              {exercise.difficulty}
            </Badge>
            {exercise.hints && exercise.hints.length > 0 && !feedback && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHints(!showHints)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Lightbulb className="w-4 h-4 mr-1" />
                Hints ({revealedHints}/{exercise.hints.length})
                <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showHints ? 'rotate-180' : ''}`} />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Question */}
          <div className="text-lg sm:text-xl leading-relaxed py-4">
            <MathRenderer latex={exercise.question} displayMode />
          </div>

          {/* Hints */}
          {showHints && exercise.hints && (
            <div className="space-y-2 pt-2 border-t border-border/50">
              {exercise.hints.slice(0, revealedHints).map((hint, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-2 text-sm text-muted-foreground bg-secondary/30 rounded-lg p-3 animate-fade-in"
                >
                  <Lightbulb className="w-4 h-4 mt-0.5 text-[hsl(var(--warning))] flex-shrink-0" />
                  <MathRenderer latex={hint} />
                </div>
              ))}
              {revealedHints < exercise.hints.length && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={revealNextHint}
                  className="text-muted-foreground"
                >
                  Show next hint
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Answer Section */}
      {!feedback && (
        <div className="space-y-4">
          {/* Text Answer */}
          {!showUpload && (
            <form onSubmit={handleTextSubmit} className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Enter your answer..."
                  className="flex-1 bg-secondary/30 border-border/50 focus:border-primary/50"
                  disabled={isSubmitting}
                />
                <Button type="submit" disabled={!answer.trim() || isSubmitting}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border/50" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border/50" />
              </div>
              
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowUpload(true)}
              >
                <Camera className="w-4 h-4 mr-2" />
                Upload handwritten work
              </Button>
            </form>
          )}

          {/* Image Upload */}
          {showUpload && (
            <div className="space-y-3">
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
        </div>
      )}

      {/* Feedback Section */}
      {feedback && (
        <div className="space-y-4">
          {feedback.type === 'ai' && feedback.aiFeedback ? (
            <FeedbackCard feedback={feedback.aiFeedback} />
          ) : (
            <Card className={`border-2 ${feedback.isCorrect ? 'border-primary/50 bg-primary/5' : 'border-destructive/50 bg-destructive/5'}`}>
              <CardContent className="py-4 space-y-3">
                <div className="flex items-center gap-3">
                  {feedback.isCorrect ? (
                    <>
                      <CheckCircle2 className="w-6 h-6 text-primary" />
                      <span className="font-semibold text-lg">Correct! 🎉</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-6 h-6 text-destructive" />
                      <span className="font-semibold text-lg">Not quite right</span>
                    </>
                  )}
                </div>
                
                {feedback.explanation && (
                  <div className="text-sm text-muted-foreground pt-2 border-t border-border/50">
                    <MathRenderer latex={feedback.explanation} />
                  </div>
                )}

                {!feedback.isCorrect && feedback.correctAnswer && (
                  <p className="text-sm text-muted-foreground">
                    The correct answer is: <span className="font-mono text-foreground">{feedback.correctAnswer}</span>
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!feedback.isCorrect && (
              <Button
                variant="outline"
                onClick={handleRetry}
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
            <Button
              onClick={handleNext}
              className={feedback.isCorrect ? 'w-full' : 'flex-1'}
            >
              Next Exercise
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
