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
  GraduationCap,
  Lightbulb,
  AlertTriangle,
  ArrowRight,
  Play
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { TOPIC_DATABASE_IDS, DATABASE_ID_TO_SLUG } from '@/data/topicDatabaseMapping';

interface TopicData {
  id: string;
  name: string;
  description: string | null;
  icon: string;
}

interface SubtopicData {
  id: string;
  name: string;
  order_index: number;
  theory_explanation: string | null;
}

interface TheoryBlock {
  id: string;
  title: string;
  block_type: string;
  block_number: string | null;
  content: Record<string, unknown>;
  order_index: number;
}

/**
 * TopicTheoryScreen - Displays comprehensive theory for an entire topic (e.g., Fractions)
 * Shows an overview covering all subtopics with links to detailed lesson theory.
 * Route: /theory/:topicSlug (e.g., /theory/fractions)
 */
export default function TopicTheoryScreen() {
  const { topicSlug } = useParams<{ topicSlug: string }>();
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
        .select('id, name, description, icon')
        .eq('id', topicId)
        .single();
      if (error) throw error;
      return data as TopicData;
    },
    enabled: !!topicId,
  });

  // Fetch all subtopics for this topic
  const { data: subtopics, isLoading: loadingSubtopics } = useQuery({
    queryKey: ['subtopics', topicId],
    queryFn: async () => {
      if (!topicId) return [];
      const { data, error } = await supabase
        .from('subtopics')
        .select('id, name, order_index, theory_explanation')
        .eq('topic_id', topicId)
        .order('order_index');
      if (error) throw error;
      return (data || []) as SubtopicData[];
    },
    enabled: !!topicId,
  });

  // Fetch theory blocks for the topic overview
  const { data: theoryBlocks, isLoading: loadingBlocks } = useQuery({
    queryKey: ['theory-blocks', topicId],
    queryFn: async () => {
      if (!topicId) return [];
      const { data, error } = await supabase
        .from('theory_blocks')
        .select('id, title, block_type, block_number, content, order_index')
        .eq('topic_id', topicId)
        .order('order_index');
      if (error) throw error;
      return (data || []) as TheoryBlock[];
    },
    enabled: !!topicId,
  });

  const isLoading = loadingTopic || loadingSubtopics || loadingBlocks;

  // Group theory blocks by type
  const overviewBlocks = theoryBlocks?.filter(b => b.block_type === 'topic-overview') || [];
  const definitionBlocks = theoryBlocks?.filter(b => b.block_type === 'definition') || [];
  const methodBlocks = theoryBlocks?.filter(b => b.block_type === 'method') || [];
  const exampleBlocks = theoryBlocks?.filter(b => b.block_type === 'worked-example') || [];
  const mistakeBlocks = theoryBlocks?.filter(b => b.block_type === 'common-mistake') || [];

  if (!topicSlug || !topicId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Topic not found</h2>
          <p className="text-muted-foreground mb-4">The topic "{topicSlug}" could not be found.</p>
          <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Topic not found</h2>
          <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/learning-path/${topicId}`)}
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
                  to={`/learning-path/${topicId}`} 
                  className="hover:text-foreground transition-colors"
                >
                  {topic.name}
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-foreground">Theory</span>
              </div>
              <h1 className="text-xl font-semibold text-foreground truncate">
                {topic.name} — Complete Theory
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-10">
        {/* Topic Overview */}
        {topic.description && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-primary/5 rounded-xl border border-primary/20"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-2">Overview</h2>
                <p className="text-muted-foreground leading-relaxed">{topic.description}</p>
              </div>
            </div>
          </motion.section>
        )}

        {/* Key Definitions Section */}
        {definitionBlocks.length > 0 && (
          <Section title="Key Definitions" icon={BookOpen} iconColor="text-blue-500">
            <div className="space-y-4">
              {definitionBlocks.slice(0, 3).map((block) => (
                <TheoryBlockCard key={block.id} block={block} type="definition" />
              ))}
            </div>
          </Section>
        )}

        {/* Core Methods Section */}
        {methodBlocks.length > 0 && (
          <Section title="Methods" icon={Lightbulb} iconColor="text-green-500">
            <div className="space-y-4">
              {methodBlocks.slice(0, 3).map((block) => (
                <TheoryBlockCard key={block.id} block={block} type="method" />
              ))}
            </div>
          </Section>
        )}

        {/* Subtopics - Links to Lesson Theory */}
        {subtopics && subtopics.length > 0 && (
          <Section title="Lessons in This Topic" icon={BookOpen} iconColor="text-primary">
            <div className="grid gap-3">
              {subtopics.map((subtopic, idx) => (
                <motion.button
                  key={subtopic.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => navigate(`/theory/${topicSlug}/${subtopic.id}`)}
                  className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/50 hover:shadow-md transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {subtopic.name}
                    </h4>
                    {subtopic.theory_explanation && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                        {subtopic.theory_explanation.slice(0, 80)}...
                      </p>
                    )}
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </motion.button>
              ))}
            </div>
          </Section>
        )}

        {/* Worked Examples Preview */}
        {exampleBlocks.length > 0 && (
          <Section title="Worked Examples" icon={Play} iconColor="text-orange-500">
            <div className="space-y-4">
              {exampleBlocks.slice(0, 2).map((block) => (
                <TheoryBlockCard key={block.id} block={block} type="example" />
              ))}
            </div>
          </Section>
        )}

        {/* Common Mistakes */}
        {mistakeBlocks.length > 0 && (
          <Section title="Common Mistakes" icon={AlertTriangle} iconColor="text-red-500">
            <div className="space-y-4">
              {mistakeBlocks.slice(0, 3).map((block) => (
                <TheoryBlockCard key={block.id} block={block} type="mistake" />
              ))}
            </div>
          </Section>
        )}

        {/* CTA */}
        <div className="pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-primary/5 rounded-xl border border-primary/20">
            <div>
              <h3 className="font-semibold text-foreground">Ready to practice?</h3>
              <p className="text-sm text-muted-foreground">
                Apply what you've learned with guided exercises.
              </p>
            </div>
            <Button onClick={() => navigate(`/learning-path/${topicId}`)}>
              Go to Learning Path
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

// ============ Helper Components ============

interface SectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  children: React.ReactNode;
}

function Section({ title, icon: Icon, iconColor, children }: SectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </motion.section>
  );
}

interface TheoryBlockCardProps {
  block: TheoryBlock;
  type: 'definition' | 'method' | 'example' | 'mistake';
}

function TheoryBlockCard({ block, type }: TheoryBlockCardProps) {
  const colorMap = {
    definition: { border: 'border-l-blue-500', bg: 'bg-blue-500/5' },
    method: { border: 'border-l-green-500', bg: 'bg-green-500/5' },
    example: { border: 'border-l-orange-500', bg: 'bg-orange-500/5' },
    mistake: { border: 'border-l-red-500', bg: 'bg-red-500/5' },
  };
  const colors = colorMap[type];
  
  // Extract text content from block
  const content = block.content as Record<string, unknown>;
  const displayText = 
    (content.formalStatement as string) || 
    (content.problem as string) || 
    (content.mistake as string) ||
    (content.description as string) ||
    (content.text as string) ||
    '';

  return (
    <Card className={cn("border-l-4 overflow-hidden", colors.border)}>
      <CardHeader className={cn("py-3 px-4", colors.bg)}>
        <div className="flex items-center gap-2">
          {block.block_number && (
            <Badge variant="secondary" className="font-mono text-xs">
              {block.block_number}
            </Badge>
          )}
          <CardTitle className="text-sm font-medium">{block.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <MathContentRenderer 
          content={displayText} 
          className="text-sm text-foreground leading-relaxed"
        />
      </CardContent>
    </Card>
  );
}
