import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Shuffle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { ExamTimer } from '@/components/exam/ExamTimer';
import { ExamQuestion } from '@/components/exam/ExamQuestion';
import { ExamResults } from '@/components/exam/ExamResults';

interface ExamPart {
  partLabel: string;
  points: number;
  prompt: string;
  solution?: {
    steps: string[];
    answer: string;
  };
}

interface ExamQuestionData {
  questionNumber: number;
  totalPoints: number;
  topic: string;
  context: string;
  parts: ExamPart[];
}

interface Exam {
  examTitle: string;
  totalPoints: number;
  durationMinutes: number;
  questions: ExamQuestionData[];
}

export default function PracticeQuiz() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [exam, setExam] = useState<Exam | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Record<string, string>>>({});
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateExam = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-test-yourself', {
        body: {}
      });

      if (fnError) throw fnError;
      
      if (!data?.success || !data?.exam) {
        throw new Error(data?.error || 'Failed to generate test');
      }

      setExam({
        ...data.exam,
        durationMinutes: data.exam.durationMinutes || 180
      });
      setSelectedTopics(data.selectedTopics || []);
      setStartTime(new Date());
      setCurrentQuestion(0);
      setAnswers({});
      setIsComplete(false);
      toast.success('Test generated with mixed topics!');
    } catch (err) {
      console.error('Error generating test:', err);
      const message = err instanceof Error ? err.message : 'Failed to generate test';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionNum: number, partLabel: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionNum]: {
        ...prev[questionNum],
        [partLabel]: answer
      }
    }));
  };

  const handleTimeUp = useCallback(() => {
    toast.warning('Time is up! Submitting your test...');
    setIsComplete(true);
  }, []);

  const handleSubmit = () => {
    setShowSubmitDialog(true);
  };

  const confirmSubmit = () => {
    setIsComplete(true);
    setShowSubmitDialog(false);
    toast.success('Test submitted!');
  };

  const handleRetry = () => {
    setIsComplete(false);
    setCurrentQuestion(0);
    setAnswers({});
    setStartTime(new Date());
  };

  const handleNewExam = () => {
    setExam(null);
    generateExam();
  };

  const getTimeSpentMinutes = () => {
    if (!startTime) return 0;
    return Math.round((new Date().getTime() - startTime.getTime()) / 60000);
  };

  const getCompletedParts = (questionNum: number): string[] => {
    const questionAnswers = answers[questionNum] || {};
    return Object.entries(questionAnswers)
      .filter(([_, answer]) => answer.trim().length > 0)
      .map(([partLabel]) => partLabel);
  };

  // Landing state - no exam generated yet
  if (!exam && !isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Practice Quiz</h1>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Shuffle className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Practice Quiz - Mixed Topics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-muted-foreground space-y-2">
                  <p>Challenge yourself with questions from ALL topics in the curriculum:</p>
                  <ul className="text-sm space-y-1">
                    <li>• 5 questions totaling 100 points</li>
                    <li>• Multi-part questions (a, b, c, d)</li>
                    <li>• 3 hour time limit</li>
                    <li>• Random mix of topics for comprehensive practice</li>
                  </ul>
                </div>

                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge variant="secondary">Equations</Badge>
                  <Badge variant="secondary">Functions</Badge>
                  <Badge variant="secondary">Derivatives</Badge>
                  <Badge variant="secondary">Logarithms</Badge>
                  <Badge variant="secondary">& More</Badge>
                </div>

                {error && (
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <Button size="lg" onClick={generateExam} className="w-full">
                  Generate Mixed Test
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Generating Your Test</h2>
            <p className="text-muted-foreground">Creating 5 mixed-topic questions...</p>
          </div>
        </div>
      </div>
    );
  }

  // Results state
  if (isComplete && exam) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Test Results</h1>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <ExamResults
            exam={exam}
            answers={answers}
            timeSpentMinutes={getTimeSpentMinutes()}
            onRetry={handleRetry}
            onNewExam={handleNewExam}
          />
        </main>
      </div>
    );
  }

  // Active exam state
  const currentQ = exam?.questions[currentQuestion];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-bold">{exam?.examTitle}</h1>
              <p className="text-sm text-muted-foreground">
                Question {currentQuestion + 1} of {exam?.questions.length}
                {currentQ?.topic && <span className="ml-2">• {currentQ.topic}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ExamTimer
              durationMinutes={exam?.durationMinutes || 180}
              onTimeUp={handleTimeUp}
              isPaused={isPaused}
              onPauseToggle={() => setIsPaused(!isPaused)}
            />
            <Button onClick={handleSubmit}>
              Submit Test
            </Button>
          </div>
        </div>
      </header>

      {/* Question Navigation */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-2 flex gap-2 overflow-x-auto">
          {exam?.questions.map((q, idx) => {
            const completedParts = getCompletedParts(q.questionNumber);
            const isPartiallyComplete = completedParts.length > 0;
            const isFullyComplete = completedParts.length === q.parts.length;

            return (
              <Button
                key={q.questionNumber}
                variant={currentQuestion === idx ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentQuestion(idx)}
                className={
                  isFullyComplete 
                    ? "border-green-500 bg-green-500/10" 
                    : isPartiallyComplete 
                    ? "border-yellow-500 bg-yellow-500/10"
                    : ""
                }
              >
                Q{q.questionNumber}
                <span className="ml-1 text-xs opacity-70">({q.totalPoints}pts)</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {currentQ && (
          <ExamQuestion
            questionNumber={currentQ.questionNumber}
            totalPoints={currentQ.totalPoints}
            topic={currentQ.topic}
            context={currentQ.context}
            parts={currentQ.parts}
            answers={answers[currentQ.questionNumber] || {}}
            onAnswerChange={(partLabel, answer) => 
              handleAnswerChange(currentQ.questionNumber, partLabel, answer)
            }
            completedParts={getCompletedParts(currentQ.questionNumber)}
          />
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
          >
            Previous Question
          </Button>
          <Button
            onClick={() => setCurrentQuestion(Math.min((exam?.questions.length || 1) - 1, currentQuestion + 1))}
            disabled={currentQuestion === (exam?.questions.length || 1) - 1}
          >
            Next Question
          </Button>
        </div>
      </main>

      {/* Submit Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Test?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit your test? You will be able to see the solutions after submitting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Working</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmit}>
              Submit Test
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
