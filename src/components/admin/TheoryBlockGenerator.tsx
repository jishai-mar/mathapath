import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Play, CheckCircle2, XCircle, AlertTriangle, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

interface TopicWithBlocks {
  id: string;
  name: string;
  order_index: number;
  blockCount: number;
  blockTypes: Record<string, number>;
}

interface GenerationResult {
  success: boolean;
  topic?: string;
  blocksRequested?: Record<string, number>;
  blocksGenerated?: number;
  blocksInserted?: number;
  validationErrors?: Array<{ block: string; errors: string[] }>;
  error?: string;
  message?: string;
}

const BLOCK_TYPE_LABELS: Record<string, string> = {
  definition: 'Definitions (D#)',
  theorem: 'Theorems (T#)',
  property: 'Properties (P#)',
  method: 'Methods (M#)',
  visual: 'Visuals (V#)',
  'worked-example': 'Worked Examples (E#)',
  'common-mistake': 'Common Mistakes (C#)',
  'deep-dive': 'Deep Dives (X#)',
};

const REQUIRED_COUNTS: Record<string, number> = {
  definition: 2,
  theorem: 2,
  property: 1,
  method: 2,
  visual: 1,
  'worked-example': 3,
  'common-mistake': 2,
  'deep-dive': 2,
};

export function TheoryBlockGenerator() {
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [selectedBlockTypes, setSelectedBlockTypes] = useState<string[]>([]);
  const [regenerate, setRegenerate] = useState(false);
  const [results, setResults] = useState<GenerationResult[]>([]);
  
  const queryClient = useQueryClient();

  // Fetch all topics with their block counts
  const { data: topics, isLoading: loadingTopics } = useQuery({
    queryKey: ['admin-topics-with-blocks'],
    queryFn: async () => {
      const { data: topicsData, error: topicsError } = await supabase
        .from('topics')
        .select('id, name, order_index')
        .order('order_index');

      if (topicsError) throw topicsError;

      // Fetch block counts for each topic
      const topicsWithBlocks: TopicWithBlocks[] = await Promise.all(
        topicsData.map(async (topic) => {
          const { data: blocks } = await supabase
            .from('theory_blocks')
            .select('block_type')
            .eq('topic_id', topic.id);

          const blockTypes: Record<string, number> = {};
          blocks?.forEach(b => {
            blockTypes[b.block_type] = (blockTypes[b.block_type] || 0) + 1;
          });

          return {
            ...topic,
            blockCount: blocks?.length || 0,
            blockTypes,
          };
        })
      );

      return topicsWithBlocks;
    },
  });

  // Generation mutation
  const generateMutation = useMutation({
    mutationFn: async (topicId: string) => {
      const { data, error } = await supabase.functions.invoke('generate-theory-blocks', {
        body: {
          topicId,
          blockTypes: selectedBlockTypes.length > 0 ? selectedBlockTypes : undefined,
          regenerate,
        },
      });

      if (error) throw error;
      return data as GenerationResult;
    },
    onSuccess: (result) => {
      setResults(prev => [...prev, result]);
      
      if (result.success) {
        if (result.blocksInserted && result.blocksInserted > 0) {
          toast.success(`Generated ${result.blocksInserted} blocks for ${result.topic}`);
        } else {
          toast.info(result.message || 'No new blocks needed');
        }
      } else {
        toast.error(result.error || 'Generation failed');
      }
      
      queryClient.invalidateQueries({ queryKey: ['admin-topics-with-blocks'] });
    },
    onError: (error) => {
      toast.error(`Generation failed: ${error.message}`);
      setResults(prev => [...prev, { success: false, error: error.message }]);
    },
  });

  const handleGenerate = () => {
    if (!selectedTopicId) {
      toast.error('Please select a topic');
      return;
    }
    generateMutation.mutate(selectedTopicId);
  };

  const handleGenerateAll = async () => {
    if (!topics) return;
    
    setResults([]);
    for (const topic of topics) {
      if (topic.id === '11111111-1111-1111-1111-111111111100') continue; // Skip Foundations
      await generateMutation.mutateAsync(topic.id);
    }
    toast.success('Completed generating blocks for all topics');
  };

  const selectedTopic = topics?.find(t => t.id === selectedTopicId);

  const getStatusBadge = (topic: TopicWithBlocks) => {
    const totalRequired = Object.values(REQUIRED_COUNTS).reduce((a, b) => a + b, 0);
    const percentage = Math.round((topic.blockCount / totalRequired) * 100);
    
    if (percentage >= 100) {
      return <Badge variant="default" className="bg-green-600">Complete</Badge>;
    } else if (percentage > 50) {
      return <Badge variant="secondary" className="bg-yellow-600">{percentage}%</Badge>;
    } else if (percentage > 0) {
      return <Badge variant="destructive">{percentage}%</Badge>;
    }
    return <Badge variant="outline">Empty</Badge>;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Theory Block Generator
          </CardTitle>
          <CardDescription>
            Generate rigorous theory blocks for Math Path topics using AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Topic Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Topic</label>
            <Select value={selectedTopicId} onValueChange={setSelectedTopicId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a topic..." />
              </SelectTrigger>
              <SelectContent>
                {topics?.map((topic) => (
                  <SelectItem key={topic.id} value={topic.id}>
                    <div className="flex items-center justify-between gap-4 w-full">
                      <span>{topic.name}</span>
                      {getStatusBadge(topic)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Topic Status */}
          {selectedTopic && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <h4 className="font-medium mb-3">Current Block Status</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(REQUIRED_COUNTS).map(([type, required]) => {
                    const current = selectedTopic.blockTypes[type] || 0;
                    const isComplete = current >= required;
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-muted-foreground">{BLOCK_TYPE_LABELS[type]}</span>
                        <span className={isComplete ? 'text-green-600' : 'text-amber-600'}>
                          {current}/{required}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Block Type Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Block Types to Generate (optional)</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(BLOCK_TYPE_LABELS).map(([type, label]) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={type}
                    checked={selectedBlockTypes.includes(type)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedBlockTypes([...selectedBlockTypes, type]);
                      } else {
                        setSelectedBlockTypes(selectedBlockTypes.filter(t => t !== type));
                      }
                    }}
                  />
                  <label htmlFor={type} className="text-sm">{label}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Regenerate Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="regenerate"
              checked={regenerate}
              onCheckedChange={(checked) => setRegenerate(!!checked)}
            />
            <label htmlFor="regenerate" className="text-sm">
              Regenerate even if blocks exist (will add duplicates)
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleGenerate}
              disabled={!selectedTopicId || generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Generate for Selected Topic
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleGenerateAll}
              disabled={generateMutation.isPending}
            >
              Generate for All Topics
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Log */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generation Results</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      result.success 
                        ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900' 
                        : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {result.success ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">
                          {result.topic || 'Unknown topic'}
                        </div>
                        {result.success ? (
                          <div className="text-sm text-muted-foreground">
                            {result.blocksInserted 
                              ? `Inserted ${result.blocksInserted} of ${result.blocksGenerated} generated blocks`
                              : result.message
                            }
                          </div>
                        ) : (
                          <div className="text-sm text-red-600">
                            {result.error}
                          </div>
                        )}
                        {result.validationErrors && result.validationErrors.length > 0 && (
                          <div className="mt-2 text-sm">
                            <div className="flex items-center gap-1 text-amber-600">
                              <AlertTriangle className="h-4 w-4" />
                              Validation issues:
                            </div>
                            <ul className="list-disc list-inside text-muted-foreground">
                              {result.validationErrors.slice(0, 3).map((ve, i) => (
                                <li key={i}>{ve.block}: {ve.errors.join(', ')}</li>
                              ))}
                              {result.validationErrors.length > 3 && (
                                <li>...and {result.validationErrors.length - 3} more</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
