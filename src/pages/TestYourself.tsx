import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Shuffle, Loader2, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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

// Available topics matching the booklet curriculum
const AVAILABLE_TOPICS = [
  { id: 'linear-equations', name: 'Linear Equations', icon: '📐' },
  { id: 'quadratic-equations', name: 'Quadratic Equations', icon: '📈' },
  { id: 'biquadratic-equations', name: 'Biquadratic Equations', icon: '🔢' },
  { id: 'fractions', name: 'Algebraic Fractions', icon: '➗' },
  { id: 'radical-equations', name: 'Radical Equations', icon: '√' },
  { id: 'exponents', name: 'Exponents', icon: 'ⁿ' },
  { id: 'logarithms', name: 'Logarithms', icon: '📊' },
  { id: 'inequalities', name: 'Inequalities', icon: '≤' },
  { id: 'limits', name: 'Limits', icon: '∞' },
  { id: 'derivatives', name: 'Derivatives', icon: '∂' },
  { id: 'linear-functions', name: 'Linear Functions', icon: '📉' },
  { id: 'quadratic-functions', name: 'Quadratic Functions', icon: '⌒' },
];

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
  const [selectedTopics, setSelectedTopics] = useState<string[]>(
    AVAILABLE_TOPICS.map(t => t.id) // All selected by default
  );
  const [returnedTopics, setReturnedTopics] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Record<string, string>>>({});
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleTopic = (topicId: string) => {
    setSelectedTopics(prev => 
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const selectAllTopics = () => {
    setSelectedTopics(AVAILABLE_TOPICS.map(t => t.id));
  };

  const deselectAllTopics = () => {
    setSelectedTopics([]);
  };

  const generateExam = async () => {
    if (selectedTopics.length < 2) {
      toast.error('Please select at least 2 topics');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Map topic IDs to names for the API
      const topicNames = selectedTopics.map(id => 
        AVAILABLE_TOPICS.find(t => t.id === id)?.name || id
      );

      const { data, error: fnError } = await supabase.functions.invoke('generate-test-yourself', {
        body: { topics: topicNames }
      });

      if (fnError) throw fnError;
      
      if (!data?.success || !data?.exam) {
        throw new Error(data?.error || 'Failed to generate test');
      }

      setExam({
        ...data.exam,
        durationMinutes: data.exam.durationMinutes || 180
      });
      setReturnedTopics(data.selectedTopics || []);
      setStartTime(new Date());
      setCurrentQuestion(0);
      setAnswers({});
      setIsComplete(false);
      toast.success('Test generated with your selected topics!');
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

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Header Card */}
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Shuffle className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Practice Quiz - Mixed Topics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground space-y-2">
                  <p>Challenge yourself with questions from selected topics:</p>
                  <ul className="text-sm space-y-1">
                    <li>• 5 questions totaling 100 points</li>
                    <li>• Multi-part questions (a, b, c, d)</li>
                    <li>• 3 hour time limit</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Topic Selection Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Select Topics</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAllTopics}>
                      Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={deselectAllTopics}>
                      Clear All
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Choose at least 2 topics to include in your quiz
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {AVAILABLE_TOPICS.map(topic => (
                    <div
                      key={topic.id}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                        ${selectedTopics.includes(topic.id) 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-muted-foreground/50'
                        }
                      `}
                      onClick={() => toggleTopic(topic.id)}
                    >
                      <Checkbox
                        id={topic.id}
                        checked={selectedTopics.includes(topic.id)}
                        onCheckedChange={() => toggleTopic(topic.id)}
                      />
                      <Label 
                        htmlFor={topic.id} 
                        className="flex items-center gap-2 cursor-pointer flex-1"
                      >
                        <span className="text-lg">{topic.icon}</span>
                        <span className="text-sm">{topic.name}</span>
                      </Label>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <Badge variant="secondary">
                    {selectedTopics.length} of {AVAILABLE_TOPICS.length} topics selected
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {error && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive flex items-center gap-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <Button 
              size="lg" 
              onClick={generateExam} 
              className="w-full"
              disabled={selectedTopics.length < 2}
            >
              <Shuffle className="h-5 w-5 mr-2" />
              Generate Quiz ({selectedTopics.length} topics)
            </Button>
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
