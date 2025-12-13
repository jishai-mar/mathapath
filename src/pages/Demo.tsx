import { useState } from 'react';
import { TopicCard } from '@/components/TopicCard';
import { StatsBar } from '@/components/StatsBar';
import PerformanceCard from '@/components/PerformanceCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, BookOpen, Play, Eye } from 'lucide-react';
import MathRenderer from '@/components/MathRenderer';

// Mock data for testing
const mockTopics = [
  { id: '1', name: 'Linear Equations', description: 'Solve equations of the form ax + b = c', icon: 'calculator', order_index: 1 },
  { id: '2', name: 'Quadratic Equations', description: 'Master the quadratic formula and factoring', icon: 'calculator', order_index: 2 },
  { id: '3', name: 'Fractions & Algebraic Expressions', description: 'Simplify and manipulate algebraic fractions', icon: 'calculator', order_index: 3 },
  { id: '4', name: 'Logarithms', description: 'Understand logarithmic functions and equations', icon: 'calculator', order_index: 4 },
  { id: '5', name: 'Derivatives', description: 'Learn differentiation rules and applications', icon: 'calculator', order_index: 5 },
  { id: '6', name: 'Limits', description: 'Explore the concept of limits and continuity', icon: 'calculator', order_index: 6 },
];

const mockProgress = [
  { topic_id: '1', mastery_percentage: 85, exercises_completed: 24 },
  { topic_id: '2', mastery_percentage: 62, exercises_completed: 18 },
  { topic_id: '3', mastery_percentage: 45, exercises_completed: 12 },
  { topic_id: '4', mastery_percentage: 30, exercises_completed: 8 },
  { topic_id: '5', mastery_percentage: 0, exercises_completed: 0 },
  { topic_id: '6', mastery_percentage: 0, exercises_completed: 0 },
];

const mockSubtopicProgress = [
  { subtopic_id: '1a', subtopic_name: 'One-step equations', mastery_percentage: 95, exercises_completed: 10, exercises_correct: 9, hints_used: 2 },
  { subtopic_id: '1b', subtopic_name: 'Two-step equations', mastery_percentage: 80, exercises_completed: 8, exercises_correct: 6, hints_used: 4 },
  { subtopic_id: '1c', subtopic_name: 'Multi-step equations', mastery_percentage: 70, exercises_completed: 6, exercises_correct: 4, hints_used: 3 },
  { subtopic_id: '2a', subtopic_name: 'Factoring quadratics', mastery_percentage: 75, exercises_completed: 10, exercises_correct: 7, hints_used: 5 },
  { subtopic_id: '2b', subtopic_name: 'Quadratic formula', mastery_percentage: 50, exercises_completed: 8, exercises_correct: 4, hints_used: 6 },
  { subtopic_id: '3a', subtopic_name: 'Simplifying fractions', mastery_percentage: 45, exercises_completed: 12, exercises_correct: 5, hints_used: 8 },
];

const mockExercises = [
  { question: 'Solve for $x$: $2x + 5 = 15$', answer: 'x = 5', difficulty: 'easy' },
  { question: 'Find all solutions: $x^2 - 4x + 3 = 0$', answer: 'x = 1 or x = 3', difficulty: 'medium' },
  { question: 'Simplify: $\\frac{x^2 - 9}{x + 3}$', answer: 'x - 3', difficulty: 'medium' },
  { question: 'Calculate: $\\lim_{x \\to 2} \\frac{x^2 - 4}{x - 2}$', answer: '4', difficulty: 'hard' },
  { question: 'Find $\\frac{dy}{dx}$ if $y = 3x^4 - 2x^2 + 5$', answer: '12x³ - 4x', difficulty: 'medium' },
];

export default function Demo() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'exercise' | 'math'>('dashboard');

  const getTopicProgress = (topicId: string) => {
    const topicProgress = mockProgress.find(p => p.topic_id === topicId);
    return {
      masteryPercentage: topicProgress?.mastery_percentage || 0,
      exercisesCompleted: topicProgress?.exercises_completed || 0,
    };
  };

  const overallMastery = Math.round(
    mockProgress.reduce((sum, p) => sum + p.mastery_percentage, 0) / mockProgress.length
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold gradient-text">MathPath Demo</span>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
              size="sm" 
              onClick={() => setActiveTab('dashboard')}
            >
              <Eye className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button 
              variant={activeTab === 'exercise' ? 'default' : 'ghost'}
              size="sm" 
              onClick={() => setActiveTab('exercise')}
            >
              <Play className="w-4 h-4 mr-2" />
              Exercises
            </Button>
            <Button 
              variant={activeTab === 'math' ? 'default' : 'ghost'}
              size="sm" 
              onClick={() => setActiveTab('math')}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Math Rendering
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {activeTab === 'dashboard' && (
          <>
            {/* Welcome section */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Welcome back, <span className="gradient-text">Demo Student</span>
              </h1>
              <p className="text-muted-foreground">
                This is a demo view with mock data to test the UI components.
              </p>
            </div>

            {/* Stats */}
            <StatsBar 
              totalXp={2450}
              currentStreak={7}
              longestStreak={14}
            />

            {/* Performance Insights */}
            <PerformanceCard 
              subtopicProgress={mockSubtopicProgress}
              overallMastery={overallMastery}
            />

            {/* Topics grid */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Topics</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mockTopics.map((topic, index) => {
                  const { masteryPercentage, exercisesCompleted } = getTopicProgress(topic.id);
                  return (
                    <div 
                      key={topic.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TopicCard
                        name={topic.name}
                        description={topic.description}
                        icon={topic.icon}
                        masteryPercentage={masteryPercentage}
                        exercisesCompleted={exercisesCompleted}
                        onClick={() => alert(`Would navigate to ${topic.name}`)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {activeTab === 'exercise' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Sample Exercises</h1>
            <p className="text-muted-foreground">Testing math rendering in exercise context</p>
            
            {mockExercises.map((exercise, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      exercise.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                      exercise.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {exercise.difficulty}
                    </span>
                    <span className="text-sm text-muted-foreground">Exercise {index + 1}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-lg">
                    <MathRenderer latex={exercise.question} />
                  </div>
                  <div className="pt-2 border-t border-border/50">
                    <span className="text-sm text-muted-foreground">Answer: </span>
                    <MathRenderer latex={exercise.answer} className="text-primary" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'math' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Math Rendering Tests</h1>
            <p className="text-muted-foreground">Testing various LaTeX expressions</p>
            
            <Card>
              <CardHeader>
                <CardTitle>Mixed Text and Math</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <MathRenderer latex="Consider the parametric equations $x = t + 2$ and $y = t^2 - 1$. Find the Cartesian equation by eliminating the parameter $t$." />
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <MathRenderer latex="Solve for $x$: The equation $2x + 5 = 15$ can be solved by subtracting 5 from both sides." />
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <MathRenderer latex="If $f(x) = x^2 + 3x - 4$, find $f(2)$." />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pure Math Expressions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg text-center">
                  <MathRenderer latex="$$\frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$" displayMode />
                </div>
                <div className="p-4 bg-muted/30 rounded-lg text-center">
                  <MathRenderer latex="$$\int_0^{\infty} e^{-x^2} dx = \frac{\sqrt{\pi}}{2}$$" displayMode />
                </div>
                <div className="p-4 bg-muted/30 rounded-lg text-center">
                  <MathRenderer latex="$$\lim_{n \to \infty} \left(1 + \frac{1}{n}\right)^n = e$$" displayMode />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Common Symbols</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm text-muted-foreground">Fractions: </span>
                  <MathRenderer latex="$\frac{3}{4}$" />
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm text-muted-foreground">Square root: </span>
                  <MathRenderer latex="$\sqrt{16} = 4$" />
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm text-muted-foreground">Exponents: </span>
                  <MathRenderer latex="$x^2 + y^3$" />
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm text-muted-foreground">Plus-minus: </span>
                  <MathRenderer latex="$x = \pm 5$" />
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm text-muted-foreground">Inequalities: </span>
                  <MathRenderer latex="$x \leq 5$ and $y \geq 3$" />
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm text-muted-foreground">Greek letters: </span>
                  <MathRenderer latex="$\alpha, \beta, \gamma, \pi$" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
