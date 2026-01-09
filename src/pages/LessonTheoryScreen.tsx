import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MathContentRenderer } from '@/components/math/MathContentRenderer';
import { 
  ArrowLeft, 
  BookOpen, 
  ChevronRight,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Play,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { TOPIC_DATABASE_IDS } from '@/data/topicDatabaseMapping';

interface TopicData {
  id: string;
  name: string;
}

interface SubtopicData {
  id: string;
  name: string;
  theory_explanation: string | null;
  worked_examples: unknown[] | null;
  topic_id: string;
}

/**
 * LessonTheoryScreen - Displays focused theory for a specific lesson/subtopic
 * (e.g., Multiplying Fractions within the Fractions topic)
 * 
 * Route: /theory/:topicSlug/:lessonId (e.g., /theory/fractions/uuid-here)
 */
export default function LessonTheoryScreen() {
  const { topicSlug, lessonId } = useParams<{ topicSlug: string; lessonId: string }>();
  const navigate = useNavigate();

  // Get database topic ID from slug
  const topicId = topicSlug ? TOPIC_DATABASE_IDS[topicSlug] : undefined;

  // Fetch topic info
  const { data: topic, isLoading: loadingTopic } = useQuery({
    queryKey: ['topic', topicId],
    queryFn: async () => {
      if (!topicId) return null;
      const { data, error } = await supabase
        .from('topics')
        .select('id, name')
        .eq('id', topicId)
        .single();
      if (error) throw error;
      return data as TopicData;
    },
    enabled: !!topicId,
  });

  // Fetch the specific subtopic (lesson)
  const { data: lesson, isLoading: loadingLesson } = useQuery({
    queryKey: ['subtopic', lessonId],
    queryFn: async () => {
      if (!lessonId) return null;
      const { data, error } = await supabase
        .from('subtopics')
        .select('id, name, theory_explanation, worked_examples, topic_id')
        .eq('id', lessonId)
        .single();
      if (error) throw error;
      return {
        ...data,
        worked_examples: Array.isArray(data.worked_examples) ? data.worked_examples : []
      } as SubtopicData;
    },
    enabled: !!lessonId,
  });

  // Fetch all subtopics for navigation (prev/next)
  const { data: allSubtopics } = useQuery({
    queryKey: ['subtopics', topicId],
    queryFn: async () => {
      if (!topicId) return [];
      const { data, error } = await supabase
        .from('subtopics')
        .select('id, name, order_index')
        .eq('topic_id', topicId)
        .order('order_index');
      if (error) throw error;
      return data || [];
    },
    enabled: !!topicId,
  });

  const isLoading = loadingTopic || loadingLesson;

  // Find current, prev, next lessons
  const currentIndex = allSubtopics?.findIndex(s => s.id === lessonId) ?? -1;
  const prevLesson = currentIndex > 0 ? allSubtopics?.[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < (allSubtopics?.length || 0) - 1 
    ? allSubtopics?.[currentIndex + 1] 
    : null;

  // Parse worked examples
  const workedExamples = lesson?.worked_examples || [];

  if (!topicSlug || !topicId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Topic not found</h2>
          <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Lesson not found</h2>
          <Button onClick={() => navigate(`/theory/${topicSlug}`)}>
            Go to {topic?.name || 'Topic'} Theory
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/theory/${topicSlug}`)}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Link to="/dashboard" className="hover:text-foreground transition-colors">
                  Dashboard
                </Link>
                <ChevronRight className="w-4 h-4" />
                <Link 
                  to={`/theory/${topicSlug}`} 
                  className="hover:text-foreground transition-colors"
                >
                  {topic?.name}
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-foreground truncate">{lesson.name}</span>
              </div>
              <h1 className="text-xl font-semibold text-foreground truncate">
                {lesson.name}
              </h1>
            </div>
            <Badge variant="secondary" className="shrink-0">
              Lesson {currentIndex + 1}/{allSubtopics?.length || 1}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-10">
        {/* Theory Explanation */}
        {lesson.theory_explanation && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-500" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Explanation</h2>
            </div>
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <MathContentRenderer 
                  content={lesson.theory_explanation}
                  className="text-foreground leading-relaxed prose prose-sm max-w-none"
                />
              </CardContent>
            </Card>
          </motion.section>
        )}

        {/* Key Points / Method */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-green-500" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Key Points</h2>
          </div>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-foreground">Understand the core concept before applying formulas</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-foreground">Practice step-by-step to build confidence</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-foreground">Check your work by verifying the answer</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </motion.section>

        {/* Worked Examples */}
        {workedExamples.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Play className="w-5 h-5 text-orange-500" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Worked Examples</h2>
            </div>
            <div className="space-y-4">
              {workedExamples.map((example: any, idx: number) => (
                <Card key={idx} className="border-l-4 border-l-orange-500">
                  <CardHeader className="py-3 px-4 bg-orange-500/5">
                    <CardTitle className="text-sm font-medium">
                      Example {idx + 1}
                      {example.title && `: ${example.title}`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {example.problem && (
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Problem</h4>
                        <MathContentRenderer 
                          content={example.problem}
                          className="text-foreground"
                        />
                      </div>
                    )}
                    {example.solution && (
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Solution</h4>
                        <MathContentRenderer 
                          content={example.solution}
                          className="text-foreground"
                        />
                      </div>
                    )}
                    {example.steps && Array.isArray(example.steps) && (
                      <div className="space-y-2">
                        {example.steps.map((step: string, stepIdx: number) => (
                          <div key={stepIdx} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                            <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center shrink-0">
                              {stepIdx + 1}
                            </span>
                            <MathContentRenderer 
                              content={step}
                              className="text-foreground text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.section>
        )}

        {/* Common Mistakes */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Common Mistakes</h2>
          </div>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-red-500 font-bold shrink-0">✗</span>
                  <span className="text-foreground">Forgetting to simplify your final answer</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 font-bold shrink-0">✗</span>
                  <span className="text-foreground">Mixing up the order of operations</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 font-bold shrink-0">✗</span>
                  <span className="text-foreground">Not checking if your answer makes sense</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </motion.section>

        {/* Navigation: Prev/Next Lesson */}
        <div className="flex items-center justify-between pt-8 border-t border-border gap-4">
          {prevLesson ? (
            <Button
              variant="outline"
              onClick={() => navigate(`/theory/${topicSlug}/${prevLesson.id}`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{prevLesson.name}</span>
              <span className="sm:hidden">Previous</span>
            </Button>
          ) : (
            <div />
          )}
          
          {nextLesson ? (
            <Button
              onClick={() => navigate(`/theory/${topicSlug}/${nextLesson.id}`)}
              className="flex items-center gap-2"
            >
              <span className="hidden sm:inline">{nextLesson.name}</span>
              <span className="sm:hidden">Next</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={() => navigate(`/learning-path/${topicId}`)}
              className="flex items-center gap-2"
            >
              Start Practice
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
