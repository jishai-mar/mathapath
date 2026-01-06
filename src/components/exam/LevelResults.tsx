import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Target, 
  Clock, 
  CheckCircle, 
  XCircle,
  BookOpen,
  RotateCcw,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Star,
  Dumbbell
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

interface Topic {
  id: string;
  name: string;
  icon: string;
}

interface LevelResultsProps {
  exam: {
    examTitle: string;
    totalPoints: number;
    questions: ExamQuestion[];
  };
  answers: Record<number, Record<string, string>>;
  timeSpentMinutes: number;
  onRetry: () => void;
  onNewExam: () => void;
  availableTopics: Topic[];
}

interface TopicScore {
  topicName: string;
  icon: string;
  totalParts: number;
  answeredParts: number;
  correctParts: number; // Simulated as answered parts for now
  percentage: number;
  category: 'strong' | 'needs-practice' | 'needs-attention';
  questions: ExamQuestion[];
}

// Improvement suggestions per category
const IMPROVEMENT_SUGGESTIONS: Record<string, string[]> = {
  'Linear Equations': [
    'Review the basic techniques for isolating variables',
    'Practice problems with distribution and combining like terms',
    'Focus on equations with nested brackets'
  ],
  'Quadratic Equations': [
    'Master the quadratic formula and when to apply it',
    'Practice factoring techniques for different coefficient patterns',
    'Review completing the square method'
  ],
  'Biquadratic Equations': [
    'Practice the substitution technique (t = x²)',
    'Review how to handle four solutions from biquadratic equations',
    'Focus on recognizing when an equation is biquadratic'
  ],
  'Algebraic Fractions': [
    'Review finding the Least Common Denominator (LCD)',
    'Practice simplifying complex fraction expressions',
    'Focus on domain restrictions when denominators equal zero'
  ],
  'Radical Equations': [
    'Practice isolating radicals before squaring',
    'Always check solutions for extraneous roots',
    'Review squaring binomials with radicals'
  ],
  'Exponents': [
    'Master the laws of exponents (product, quotient, power rules)',
    'Practice equations where you match bases on both sides',
    'Focus on negative and fractional exponents'
  ],
  'Logarithms': [
    'Review logarithm properties (product, quotient, power rules)',
    'Practice converting between exponential and logarithmic forms',
    'Focus on solving equations with logs on both sides'
  ],
  'Inequalities': [
    'Remember to flip the inequality when multiplying/dividing by negatives',
    'Practice graphing solutions on a number line',
    'Review quadratic and rational inequality techniques'
  ],
  'Limits': [
    'Practice factoring to cancel common terms',
    'Review direct substitution and when it fails',
    'Focus on limits at infinity and horizontal asymptotes'
  ],
  'Derivatives': [
    'Master the power rule for polynomials',
    'Practice finding slopes of tangent lines at specific points',
    'Review the connection between derivatives and rates of change'
  ],
  'Linear Functions': [
    'Review slope formula and slope-intercept form',
    'Practice finding equations of parallel and perpendicular lines',
    'Focus on graphing and interpreting linear functions'
  ],
  'Quadratic Functions': [
    'Master finding the vertex using the formula',
    'Practice finding x-intercepts using factoring or the quadratic formula',
    'Review vertex form and how to convert from standard form'
  ]
};

export function LevelResults({
  exam,
  answers,
  timeSpentMinutes,
  onRetry,
  onNewExam,
  availableTopics
}: LevelResultsProps) {
  const navigate = useNavigate();

  const handleFocusPractice = (topicName: string) => {
    // Find the topic ID from availableTopics
    const topic = availableTopics.find(t => 
      t.name.toLowerCase() === topicName.toLowerCase() ||
      topicName.toLowerCase().includes(t.name.toLowerCase()) ||
      t.name.toLowerCase().includes(topicName.toLowerCase())
    );
    
    if (topic?.id) {
      navigate(`/practice?topic=${topic.id}`);
    } else {
      // Fallback to practice page
      navigate('/practice');
    }
  };
  // Calculate per-topic scores
  const topicScores = useMemo(() => {
    const scoresByTopic: Record<string, TopicScore> = {};
    
    exam.questions.forEach(question => {
      const topicName = question.topic;
      const topic = availableTopics.find(t => 
        t.name.toLowerCase() === topicName.toLowerCase() ||
        topicName.toLowerCase().includes(t.name.toLowerCase()) ||
        t.name.toLowerCase().includes(topicName.toLowerCase())
      );
      
      if (!scoresByTopic[topicName]) {
        scoresByTopic[topicName] = {
          topicName,
          icon: topic?.icon || '📚',
          totalParts: 0,
          answeredParts: 0,
          correctParts: 0,
          percentage: 0,
          category: 'needs-attention',
          questions: []
        };
      }
      
      scoresByTopic[topicName].questions.push(question);
      scoresByTopic[topicName].totalParts += question.parts.length;
      
      // Count answered parts (we'll simulate "correct" as answered for now)
      const questionAnswers = answers[question.questionNumber] || {};
      const answeredCount = Object.values(questionAnswers).filter(a => a.trim().length > 0).length;
      scoresByTopic[topicName].answeredParts += answeredCount;
      scoresByTopic[topicName].correctParts += answeredCount; // Simulated
    });
    
    // Calculate percentages and categories
    Object.values(scoresByTopic).forEach(score => {
      score.percentage = score.totalParts > 0 
        ? Math.round((score.correctParts / score.totalParts) * 100)
        : 0;
      
      if (score.percentage >= 80) {
        score.category = 'strong';
      } else if (score.percentage >= 50) {
        score.category = 'needs-practice';
      } else {
        score.category = 'needs-attention';
      }
    });
    
    return Object.values(scoresByTopic).sort((a, b) => b.percentage - a.percentage);
  }, [exam, answers, availableTopics]);

  // Overall stats
  const totalParts = exam.questions.reduce((sum, q) => sum + q.parts.length, 0);
  const answeredParts = Object.values(answers).reduce((sum, qAnswers) => 
    sum + Object.values(qAnswers).filter(a => a.trim().length > 0).length, 0
  );
  const overallPercentage = Math.round((answeredParts / totalParts) * 100);

  const strongTopics = topicScores.filter(t => t.category === 'strong');
  const needsPracticeTopics = topicScores.filter(t => t.category === 'needs-practice');
  const needsAttentionTopics = topicScores.filter(t => t.category === 'needs-attention');

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} minutes`;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'strong': return 'text-green-600 bg-green-500/10 border-green-500/30';
      case 'needs-practice': return 'text-yellow-600 bg-yellow-500/10 border-yellow-500/30';
      case 'needs-attention': return 'text-red-600 bg-red-500/10 border-red-500/30';
      default: return '';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'strong': return 'Strong (80-100%)';
      case 'needs-practice': return 'Needs Practice (50-79%)';
      case 'needs-attention': return 'Needs Attention (<50%)';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Trophy className="h-6 w-6 text-primary" />
            Your Level Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted">
              <Target className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-3xl font-bold">{overallPercentage}%</div>
              <div className="text-sm text-muted-foreground">Overall Score</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-3xl font-bold">{answeredParts}/{totalParts}</div>
              <div className="text-sm text-muted-foreground">Parts Completed</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <Clock className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-3xl font-bold">{formatDuration(timeSpentMinutes)}</div>
              <div className="text-sm text-muted-foreground">Time Spent</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <BookOpen className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <div className="text-3xl font-bold">{topicScores.length}</div>
              <div className="text-sm text-muted-foreground">Topics Assessed</div>
            </div>
          </div>

          <div className="mt-6 flex gap-3 justify-center">
            <Button onClick={onRetry} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={onNewExam}>
              New Assessment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Topic Scores Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance by Topic
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {topicScores.map((topic) => (
            <div key={topic.topicName} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{topic.icon}</span>
                  <span className="font-medium">{topic.topicName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getCategoryColor(topic.category)}>
                    {topic.percentage}%
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    ({topic.correctParts}/{topic.totalParts} parts)
                  </span>
                </div>
              </div>
              <Progress 
                value={topic.percentage} 
                className={`h-2 ${
                  topic.category === 'strong' ? '[&>div]:bg-green-500' :
                  topic.category === 'needs-practice' ? '[&>div]:bg-yellow-500' :
                  '[&>div]:bg-red-500'
                }`}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Strengths */}
      {strongTopics.length > 0 && (
        <Card className="border-green-500/30">
          <CardHeader className="bg-green-500/5">
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <Star className="h-5 w-5" />
              Your Strengths
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-muted-foreground mb-4">
              Great job! You're performing well in these topics:
            </p>
            <div className="flex flex-wrap gap-2">
              {strongTopics.map(topic => (
                <Badge key={topic.topicName} variant="outline" className="text-green-600 border-green-500/50 bg-green-500/10 py-2 px-3">
                  <span className="mr-2">{topic.icon}</span>
                  {topic.topicName} ({topic.percentage}%)
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Needs Practice */}
      {needsPracticeTopics.length > 0 && (
        <Card className="border-yellow-500/30">
          <CardHeader className="bg-yellow-500/5">
            <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <Lightbulb className="h-5 w-5" />
              Needs Some Practice
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <p className="text-muted-foreground">
              You're making progress in these topics. A bit more practice will help you master them:
            </p>
            {needsPracticeTopics.map(topic => (
              <div key={topic.topicName} className="p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{topic.icon}</span>
                  <span className="font-medium">{topic.topicName}</span>
                  <Badge variant="outline" className="ml-auto">{topic.percentage}%</Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Suggestions:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {(IMPROVEMENT_SUGGESTIONS[topic.topicName] || [
                      'Review the key concepts and formulas',
                      'Practice step-by-step problem solving',
                      'Focus on understanding why each step is taken'
                    ]).slice(0, 2).map((suggestion, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-yellow-600">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button 
                  onClick={() => handleFocusPractice(topic.topicName)}
                  className="mt-3 bg-yellow-600 hover:bg-yellow-700"
                  size="sm"
                >
                  <Dumbbell className="h-4 w-4 mr-2" />
                  Focus Practice
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Needs Attention */}
      {needsAttentionTopics.length > 0 && (
        <Card className="border-red-500/30">
          <CardHeader className="bg-red-500/5">
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Needs More Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <p className="text-muted-foreground">
              These topics need more focus. Don't worry - with practice, you'll improve!
            </p>
            {needsAttentionTopics.map(topic => (
              <div key={topic.topicName} className="p-4 rounded-lg border border-red-500/30 bg-red-500/5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{topic.icon}</span>
                  <span className="font-medium">{topic.topicName}</span>
                  <Badge variant="outline" className="ml-auto text-red-600">{topic.percentage}%</Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">Recommended actions:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {(IMPROVEMENT_SUGGESTIONS[topic.topicName] || [
                      'Start with the basic theory and definitions',
                      'Work through simple examples before harder problems',
                      'Review common mistakes and why they happen'
                    ]).map((suggestion, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-red-600">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button 
                  onClick={() => handleFocusPractice(topic.topicName)}
                  className="mt-3 bg-red-600 hover:bg-red-700"
                  size="sm"
                >
                  <Dumbbell className="h-4 w-4 mr-2" />
                  Focus Practice
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

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
                        <span className="font-semibold">Part ({part.partLabel})</span>
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
