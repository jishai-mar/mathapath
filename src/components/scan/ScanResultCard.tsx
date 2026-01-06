import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Lightbulb, Target, BookOpen, RefreshCw, Dumbbell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MathRenderer from '@/components/MathRenderer';
import StepAnalysis from './StepAnalysis';
import { cn } from '@/lib/utils';

interface SolutionStep {
  step: number;
  content: string;
  status: 'correct' | 'error';
  expected?: string;
}

interface MiniExercise {
  question: string;
  hint: string;
}

export interface ScanResult {
  identified_problem: string;
  is_correct: boolean | null;
  solution_analysis: SolutionStep[];
  mistake_step: number | null;
  mistake_type: string | null;
  mistake_explanation: string | null;
  how_to_fix: string | null;
  encouragement: string;
  mini_exercise: MiniExercise | null;
  topic_detected: string;
  difficulty_estimate: 'easy' | 'medium' | 'hard';
}

interface ScanResultCardProps {
  result: ScanResult;
  onScanAgain: () => void;
}

const mistakeTypeLabels: Record<string, string> = {
  sign_error: 'Sign Error',
  calculation_error: 'Calculation Error',
  distribution_error: 'Distribution Error',
  order_of_operations: 'Order of Operations',
  fraction_error: 'Fraction Error',
  algebraic_error: 'Algebraic Error',
  conceptual_error: 'Conceptual Error',
  other: 'Error'
};

export default function ScanResultCard({ result, onScanAgain }: ScanResultCardProps) {
  const navigate = useNavigate();

  const handlePracticeTopic = () => {
    navigate(`/practice?topic=${encodeURIComponent(result.topic_detected)}`);
  };

  return (
    <div className="space-y-4">
      {/* Main Result Banner */}
      <Card className={cn(
        "border-2",
        result.is_correct === true
          ? "border-green-500/50 bg-green-500/5"
          : result.is_correct === false
          ? "border-destructive/50 bg-destructive/5"
          : "border-muted"
      )}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0",
              result.is_correct === true
                ? "bg-green-500/20"
                : result.is_correct === false
                ? "bg-destructive/20"
                : "bg-muted"
            )}>
              {result.is_correct === true ? (
                <Check className="w-8 h-8 text-green-600" />
              ) : result.is_correct === false ? (
                <X className="w-8 h-8 text-destructive" />
              ) : (
                <Lightbulb className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <h3 className={cn(
                "text-xl font-semibold",
                result.is_correct === true
                  ? "text-green-600"
                  : result.is_correct === false
                  ? "text-destructive"
                  : "text-foreground"
              )}>
                {result.is_correct === true
                  ? "Great work! ✨"
                  : result.is_correct === false
                  ? "Not quite right"
                  : "Let me help you"}
              </h3>
              <p className="text-muted-foreground mt-1">{result.encouragement}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Problem Identified */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4" />
              Problem Identified
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline">{result.topic_detected}</Badge>
              <Badge variant="secondary">{result.difficulty_estimate}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-lg">
            <MathRenderer latex={result.identified_problem} />
          </div>
        </CardContent>
      </Card>

      {/* Step Analysis */}
      {result.solution_analysis && result.solution_analysis.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <StepAnalysis 
              steps={result.solution_analysis} 
              mistakeStep={result.mistake_step} 
            />
          </CardContent>
        </Card>
      )}

      {/* Mistake Explanation */}
      {result.is_correct === false && result.mistake_explanation && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-600">
              <Lightbulb className="w-4 h-4" />
              What Went Wrong
              {result.mistake_type && (
                <Badge variant="outline" className="ml-2 text-amber-600 border-amber-500/30">
                  {mistakeTypeLabels[result.mistake_type] || result.mistake_type}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">{result.mistake_explanation}</p>
            
            {result.how_to_fix && (
              <div className="bg-background/50 rounded-lg p-4 border border-amber-500/20">
                <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  How to Fix It
                </h5>
                <p className="text-sm text-muted-foreground">{result.how_to_fix}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mini Exercise */}
      {result.mini_exercise && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-primary">
              <Dumbbell className="w-4 h-4" />
              Try This Practice Problem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-lg">
              <MathRenderer latex={result.mini_exercise.question} />
            </div>
            <div className="bg-background/50 rounded-lg p-3 border border-primary/20">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">💡 Hint: </span>
                {result.mini_exercise.hint}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={onScanAgain}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Scan Another
        </Button>
        <Button 
          className="flex-1"
          onClick={handlePracticeTopic}
        >
          <Dumbbell className="w-4 h-4 mr-2" />
          Practice {result.topic_detected}
        </Button>
      </div>
    </div>
  );
}
