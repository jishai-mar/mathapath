import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface TopicWithBlocks {
  id: string;
  name: string;
  description: string | null;
  order_index: number;
  blockCount: number;
}

interface GenerationLog {
  topicId: string;
  topicName: string;
  status: 'pending' | 'generating' | 'complete' | 'failed';
  message: string;
  timestamp: Date;
  details?: any;
}

// Generation order based on prerequisites
const GENERATION_ORDER = [
  'First-Degree Equations',
  'Fractions',
  'Exponents',
  'Quadratic Equations',
  'Higher Degree Equations',
  'Inequalities',
  'Logarithms',
  'Logarithmic Equations',
  'Linear Functions',
  'Quadratic Functions',
  'Rational Functions',
  'Limits',
  'Derivatives Basics',
  'Derivative Applications',
  'Chain Rule',
];

const REQUIRED_BLOCKS = 15;

export default function AdminTheoryGenerator() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [generatingTopicId, setGeneratingTopicId] = useState<string | null>(null);
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [logs, setLogs] = useState<GenerationLog[]>([]);

  // Fetch all topics with their block counts
  const { data: topics, isLoading, refetch } = useQuery({
    queryKey: ['admin-topics-blocks'],
    queryFn: async () => {
      const { data: allTopics, error: topicsError } = await supabase
        .from('topics')
        .select('id, name, description, order_index')
        .order('order_index');

      if (topicsError) throw topicsError;

      // Get block counts for each topic
      const topicsWithBlocks: TopicWithBlocks[] = await Promise.all(
        (allTopics || []).map(async (topic) => {
          const { count } = await supabase
            .from('theory_blocks')
            .select('*', { count: 'exact', head: true })
            .eq('topic_id', topic.id);

          return {
            ...topic,
            blockCount: count || 0,
          };
        })
      );

      return topicsWithBlocks;
    },
  });

  const addLog = (log: Omit<GenerationLog, 'timestamp'>) => {
    setLogs(prev => [{ ...log, timestamp: new Date() }, ...prev].slice(0, 50));
  };

  // Generate blocks for a single topic
  const generateMutation = useMutation({
    mutationFn: async ({ topicId, regenerate = false }: { topicId: string; regenerate?: boolean }) => {
      const response = await supabase.functions.invoke('generate-theory-blocks', {
        body: { topicId, regenerate, mode: 'generate' }
      });
      
      if (response.error) throw response.error;
      return response.data;
    },
    onMutate: ({ topicId }) => {
      setGeneratingTopicId(topicId);
      const topic = topics?.find(t => t.id === topicId);
      addLog({
        topicId,
        topicName: topic?.name || topicId,
        status: 'generating',
        message: 'Starting generation...'
      });
    },
    onSuccess: (data, { topicId }) => {
      const topic = topics?.find(t => t.id === topicId);
      addLog({
        topicId,
        topicName: topic?.name || topicId,
        status: data.success ? 'complete' : 'failed',
        message: data.success 
          ? `Generated ${data.blocksInserted} blocks (${data.repairAttempts} repair passes)`
          : `Failed: ${data.error}`,
        details: data
      });
      
      if (data.success) {
        toast.success(`Generated ${data.blocksInserted} blocks for ${topic?.name}`);
      } else {
        toast.error(`Generation failed for ${topic?.name}`);
      }
      
      queryClient.invalidateQueries({ queryKey: ['admin-topics-blocks'] });
    },
    onError: (error, { topicId }) => {
      const topic = topics?.find(t => t.id === topicId);
      addLog({
        topicId,
        topicName: topic?.name || topicId,
        status: 'failed',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      toast.error(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
    onSettled: () => {
      setGeneratingTopicId(null);
    }
  });

  // Batch generate for all missing topics
  const handleBatchGenerate = async () => {
    if (!topics) return;

    // Get topics that need generation, in the correct order
    const missingTopics = GENERATION_ORDER
      .map(name => topics.find(t => t.name === name))
      .filter((t): t is TopicWithBlocks => t !== undefined && t.blockCount < REQUIRED_BLOCKS);

    if (missingTopics.length === 0) {
      toast.info('All topics already have complete theory blocks');
      return;
    }

    setBatchGenerating(true);
    setBatchProgress({ current: 0, total: missingTopics.length });

    for (let i = 0; i < missingTopics.length; i++) {
      const topic = missingTopics[i];
      setBatchProgress({ current: i + 1, total: missingTopics.length });
      
      addLog({
        topicId: topic.id,
        topicName: topic.name,
        status: 'generating',
        message: `Starting generation (${i + 1}/${missingTopics.length})...`
      });

      try {
        const response = await supabase.functions.invoke('generate-theory-blocks', {
          body: { topicId: topic.id, regenerate: topic.blockCount > 0, mode: 'generate' }
        });

        if (response.error) throw response.error;

        const data = response.data;
        addLog({
          topicId: topic.id,
          topicName: topic.name,
          status: data.success ? 'complete' : 'failed',
          message: data.success 
            ? `✓ Generated ${data.blocksInserted} blocks`
            : `✗ Failed: ${data.error}`,
          details: data
        });

        // Small delay between topics to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        addLog({
          topicId: topic.id,
          topicName: topic.name,
          status: 'failed',
          message: `✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }

      // Refresh data after each topic
      await refetch();
    }

    setBatchGenerating(false);
    toast.success('Batch generation complete!');
  };

  const getStatusBadge = (blockCount: number) => {
    if (blockCount >= REQUIRED_BLOCKS) {
      return <Badge variant="default" className="bg-green-600">Complete</Badge>;
    } else if (blockCount > 0) {
      return <Badge variant="secondary" className="bg-amber-600">Partial ({blockCount}/{REQUIRED_BLOCKS})</Badge>;
    } else {
      return <Badge variant="outline" className="text-muted-foreground">Missing</Badge>;
    }
  };

  const completedCount = topics?.filter(t => t.blockCount >= REQUIRED_BLOCKS).length || 0;
  const totalTopics = topics?.length || 0;
  const overallProgress = totalTopics > 0 ? (completedCount / totalTopics) * 100 : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Theory Block Generator</h1>
          </div>
          <p className="text-muted-foreground">
            Generate rigorous, validated theory blocks for Math Path topics
          </p>
        </div>

        {/* Overall Progress */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Overall Progress</CardTitle>
            <CardDescription>
              {completedCount} of {totalTopics} topics have complete theory blocks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={overallProgress} className="h-3" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{completedCount} complete</span>
                <span>{totalTopics - completedCount} remaining</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Topic List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Topics</CardTitle>
                  <CardDescription>
                    Each topic requires {REQUIRED_BLOCKS} theory blocks
                  </CardDescription>
                </div>
                <Button 
                  onClick={handleBatchGenerate}
                  disabled={batchGenerating || generatingTopicId !== null}
                  className="gap-2"
                >
                  {batchGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating {batchProgress.current}/{batchProgress.total}
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Generate All Missing
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-2">
                    {topics?.map((topic, idx) => (
                      <div 
                        key={topic.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground w-6">
                            {idx + 1}.
                          </span>
                          <div>
                            <div className="font-medium">{topic.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {topic.blockCount} / {REQUIRED_BLOCKS} blocks
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getStatusBadge(topic.blockCount)}
                          
                          {topic.blockCount > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/topic-theory/${topic.id}`)}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button
                            variant={topic.blockCount >= REQUIRED_BLOCKS ? "outline" : "default"}
                            size="sm"
                            onClick={() => generateMutation.mutate({ 
                              topicId: topic.id, 
                              regenerate: topic.blockCount > 0 
                            })}
                            disabled={generatingTopicId !== null || batchGenerating}
                          >
                            {generatingTopicId === topic.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : topic.blockCount >= REQUIRED_BLOCKS ? (
                              <RefreshCw className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Generation Log */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Generation Log</CardTitle>
                <CardDescription>
                  Real-time generation status and results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[550px]">
                  {logs.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No generation activity yet
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {logs.map((log, idx) => (
                        <div key={idx} className="text-sm">
                          <div className="flex items-start gap-2">
                            {log.status === 'generating' && (
                              <Loader2 className="h-4 w-4 animate-spin text-blue-500 mt-0.5" />
                            )}
                            {log.status === 'complete' && (
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                            )}
                            {log.status === 'failed' && (
                              <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                            )}
                            {log.status === 'pending' && (
                              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{log.topicName}</div>
                              <div className="text-muted-foreground">{log.message}</div>
                              <div className="text-xs text-muted-foreground">
                                {log.timestamp.toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                          {idx < logs.length - 1 && <Separator className="mt-3" />}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Back button */}
        <div className="mt-6">
          <Button variant="outline" onClick={() => navigate('/')}>
            ← Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
