import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTopicTheoryBlocks } from '@/hooks/useTheoryBlocks';
import { TheoryBlockRenderer } from '@/components/theory/TheoryBlockRenderer';
import { parseTheoryBlock, TheoryBlockRow } from '@/components/theory/types/blocks';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  BookOpen, 
  Lightbulb, 
  Calculator, 
  Eye, 
  FileText,
  AlertTriangle,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GroupedBlocks {
  definitions: TheoryBlockRow[];
  theorems: TheoryBlockRow[];
  methods: TheoryBlockRow[];
  visuals: TheoryBlockRow[];
  examples: TheoryBlockRow[];
  commonMistakes: TheoryBlockRow[];
  deepDives: TheoryBlockRow[];
}

const SECTION_CONFIG = [
  { key: 'definitions', label: 'Definitions', icon: BookOpen, color: 'text-blue-500' },
  { key: 'theorems', label: 'Theorems & Properties', icon: Lightbulb, color: 'text-amber-500' },
  { key: 'methods', label: 'Methods', icon: Calculator, color: 'text-green-500' },
  { key: 'visuals', label: 'Visuals', icon: Eye, color: 'text-purple-500' },
  { key: 'examples', label: 'Worked Examples', icon: FileText, color: 'text-indigo-500' },
  { key: 'commonMistakes', label: 'Common Mistakes', icon: AlertTriangle, color: 'text-red-500' },
  { key: 'deepDives', label: 'Deep Dives', icon: Sparkles, color: 'text-cyan-500' },
] as const;

export default function TopicTheoryBlocks() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();

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
      return data;
    },
    enabled: !!topicId,
  });

  // Fetch all theory blocks for this topic
  const { data: blocks, isLoading: loadingBlocks } = useTopicTheoryBlocks(topicId);

  // Group blocks by type
  const groupedBlocks: GroupedBlocks = {
    definitions: blocks?.filter(b => b.block_type === 'definition') || [],
    theorems: blocks?.filter(b => b.block_type === 'theorem' || b.block_type === 'property') || [],
    methods: blocks?.filter(b => b.block_type === 'method') || [],
    visuals: blocks?.filter(b => b.block_type === 'visual') || [],
    examples: blocks?.filter(b => b.block_type === 'worked-example') || [],
    commonMistakes: blocks?.filter(b => b.block_type === 'common-mistake') || [],
    deepDives: blocks?.filter(b => b.block_type === 'deep-dive') || [],
  };

  const isLoading = loadingTopic || loadingBlocks;
  const totalBlocks = blocks?.length || 0;

  const scrollToSection = (sectionKey: string) => {
    const element = document.getElementById(`section-${sectionKey}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-3">
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="col-span-9 space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Topic not found</h2>
          <Button onClick={() => navigate('/')}>Go back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Link to="/" className="hover:text-foreground transition-colors">
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
            <Badge variant="secondary" className="shrink-0">
              {totalBlocks} blocks
            </Badge>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Sticky sidebar navigation */}
          <aside className="col-span-3 hidden lg:block">
            <div className="sticky top-24">
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  Jump to Section
                </h3>
                <nav className="space-y-1">
                  {SECTION_CONFIG.map(({ key, label, icon: Icon, color }) => {
                    const count = groupedBlocks[key as keyof GroupedBlocks].length;
                    if (count === 0) return null;
                    
                    return (
                      <button
                        key={key}
                        onClick={() => scrollToSection(key)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                      >
                        <Icon className={cn("w-4 h-4", color)} />
                        <span className="flex-1">{label}</span>
                        <Badge variant="outline" className="text-xs">
                          {count}
                        </Badge>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Topic description */}
              {topic.description && (
                <div className="mt-4 p-4 bg-muted/30 rounded-xl border border-border">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {topic.description}
                  </p>
                </div>
              )}
            </div>
          </aside>

          {/* Main content area */}
          <main className="col-span-12 lg:col-span-9 space-y-12">
            {totalBlocks === 0 ? (
              <div className="text-center py-16 bg-muted/30 rounded-xl border border-border">
                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No theory blocks yet</h3>
                <p className="text-muted-foreground">
                  Theory content for this topic is being prepared.
                </p>
              </div>
            ) : (
              <>
                {SECTION_CONFIG.map(({ key, label, icon: Icon, color }) => {
                  const sectionBlocks = groupedBlocks[key as keyof GroupedBlocks];
                  if (sectionBlocks.length === 0) return null;

                  return (
                    <section
                      key={key}
                      id={`section-${key}`}
                      className="scroll-mt-24"
                    >
                      {/* Section header */}
                      <div className="flex items-center gap-3 mb-6">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          "bg-muted"
                        )}>
                          <Icon className={cn("w-5 h-5", color)} />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-foreground">
                            {label}
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            {sectionBlocks.length} {sectionBlocks.length === 1 ? 'block' : 'blocks'}
                          </p>
                        </div>
                      </div>

                      {/* Section blocks */}
                      <div className="space-y-6">
                        {sectionBlocks.map((block) => (
                          <TheoryBlockRenderer
                            key={block.id}
                            block={parseTheoryBlock(block)}
                            showBlockNumber={true}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </>
            )}

            {/* Back to learning path CTA */}
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
      </div>
    </div>
  );
}
