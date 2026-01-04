import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Target, 
  Clock, 
  CheckCircle, 
  XCircle,
  BookOpen,
  RotateCcw
} from 'lucide-react';
import MathRenderer from '@/components/MathRenderer';
import { createSegmentsFromSolution } from '@/lib/solutionSegments';

interface ExamQuestion {
  questionNumber: number;
  totalPoints: number;
  topic: string;
  context: string;
  parts: {
    partLabel: string;
    points: number;
    prompt: string;
    solution?: {
      steps: string[];
      answer: string;
    };
  }[];
}

interface ExamResultsProps {
  exam: {
    examTitle: string;
    totalPoints: number;
    questions: ExamQuestion[];
  };
  answers: Record<number, Record<string, string>>;
  timeSpentMinutes: number;
  onRetry: () => void;
  onNewExam: () => void;
}

export function ExamResults({
  exam,
  answers,
  timeSpentMinutes,
  onRetry,
  onNewExam
}: ExamResultsProps) {
  // Calculate completion stats
  const totalParts = exam.questions.reduce((sum, q) => sum + q.parts.length, 0);
  const answeredParts = Object.values(answers).reduce((sum, qAnswers) => 
    sum + Object.values(qAnswers).filter(a => a.trim().length > 0).length, 0
  );
  const completionPercent = Math.round((answeredParts / totalParts) * 100);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} minutes`;
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Trophy className="h-6 w-6 text-primary" />
            Exam Complete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-lg bg-muted">
              <Target className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-3xl font-bold">{completionPercent}%</div>
              <div className="text-sm text-muted-foreground">Completion Rate</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-3xl font-bold">{answeredParts}/{totalParts}</div>
              <div className="text-sm text-muted-foreground">Parts Answered</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <Clock className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-3xl font-bold">{formatDuration(timeSpentMinutes)}</div>
              <div className="text-sm text-muted-foreground">Time Spent</div>
            </div>
          </div>

          <div className="mt-6 flex gap-3 justify-center">
            <Button onClick={onRetry} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={onNewExam}>
              Generate New Exam
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Solutions */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Solutions & Explanations
        </h2>

        {exam.questions.map((question) => (
          <Card key={question.questionNumber} className="overflow-hidden">
            <CardHeader className="bg-muted/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Question {question.questionNumber}: {question.topic}
                </CardTitle>
                <Badge>{question.totalPoints} points</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Context */}
              <div className="p-3 rounded-lg bg-muted/30 border">
                <MathRenderer segments={createSegmentsFromSolution(question.context)} />
              </div>

              {/* Parts with solutions */}
              {question.parts.map((part) => {
                const userAnswer = answers[question.questionNumber]?.[part.partLabel] || '';
                const hasAnswer = userAnswer.trim().length > 0;

                return (
                  <div key={part.partLabel} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {hasAnswer ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-muted-foreground" />
                        )}
                        <span className="font-semibold">Part {part.partLabel.toUpperCase()}</span>
                        <Badge variant="outline">{part.points} pts</Badge>
                      </div>
                    </div>

                    <div className="text-muted-foreground">
                      <MathRenderer segments={createSegmentsFromSolution(part.prompt)} />
                    </div>

                    {/* User's answer */}
                    {hasAnswer && (
                      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                        <div className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">
                          Your Answer:
                        </div>
                        <div className="font-mono text-sm">{userAnswer}</div>
                      </div>
                    )}

                    {/* Solution */}
                    {part.solution && (
                      <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                        <div className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">
                          Solution:
                        </div>
                        <div className="space-y-2">
                          {part.solution.steps.map((step, idx) => (
                            <div key={idx} className="text-sm pl-4">
                              <MathRenderer segments={createSegmentsFromSolution(`${idx + 1}. ${step}`)} />
                            </div>
                          ))}
                          <div className="mt-2 pt-2 border-t border-green-500/30 font-semibold">
                            <span>Answer: </span>
                            <MathRenderer segments={createSegmentsFromSolution(part.solution.answer)} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
