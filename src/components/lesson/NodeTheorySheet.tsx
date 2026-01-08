import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import MathRenderer from '@/components/MathRenderer';
import { createSegmentsFromSolution } from '@/lib/solutionSegments';
import { BookOpen, Lightbulb, CheckCircle2, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkedExample {
  title?: string;
  problem: string;
  solution: string;
}

interface TheoryData {
  explanation: string | null;
  workedExamples: WorkedExample[];
}

interface NodeTheorySheetProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string;
  lessonName: string;
  lessonIndex: number;
  topicName?: string;
}

export function NodeTheorySheet({ 
  isOpen, 
  onClose, 
  lessonId, 
  lessonName,
  lessonIndex,
  topicName 
}: NodeTheorySheetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [theoryData, setTheoryData] = useState<TheoryData | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchTheory();
    }
  }, [isOpen, lessonId]);

  // Convert AI response format to storage format
  const convertAIResponseToStorageFormat = (aiContent: {
    definition?: string;
    key_rule?: string;
    formula?: string;
    when_to_use?: string;
    worked_example?: { problem: string; steps: string[]; answer: string };
    additional_examples?: { problem: string; steps: string[]; answer: string }[];
    common_mistake?: { wrong: string; right: string };
  }) => {
    // Build comprehensive explanation from AI response
    const explanationParts: string[] = [];
    
    if (aiContent.definition) {
      explanationParts.push(`**Definition:** ${aiContent.definition}`);
    }
    if (aiContent.key_rule) {
      explanationParts.push(`**Key Rule:** ${aiContent.key_rule}`);
    }
    if (aiContent.formula) {
      explanationParts.push(`**Formula:** $${aiContent.formula}$`);
    }
    if (aiContent.when_to_use) {
      explanationParts.push(`**When to use:** ${aiContent.when_to_use}`);
    }
    if (aiContent.common_mistake?.wrong && aiContent.common_mistake?.right) {
      explanationParts.push(`\n**Common Mistake:**\n- ❌ ${aiContent.common_mistake.wrong}\n- ✓ ${aiContent.common_mistake.right}`);
    }

    const explanation = explanationParts.join('\n\n');

    // Convert worked examples to storage format
    const workedExamples: WorkedExample[] = [];
    
    if (aiContent.worked_example?.problem) {
      const stepsText = aiContent.worked_example.steps?.join('\n') || '';
      workedExamples.push({
        title: 'Primary Example',
        problem: aiContent.worked_example.problem,
        solution: `${stepsText}\n\n**Answer:** ${aiContent.worked_example.answer || ''}`
      });
    }

    if (aiContent.additional_examples) {
      aiContent.additional_examples.forEach((ex, idx) => {
        if (ex.problem) {
          const stepsText = ex.steps?.join('\n') || '';
          workedExamples.push({
            title: `Example ${idx + 2}`,
            problem: ex.problem,
            solution: `${stepsText}\n\n**Answer:** ${ex.answer || ''}`
          });
        }
      });
    }

    return { explanation, workedExamples };
  };

  const generateAndSaveTheory = async () => {
    setIsGenerating(true);
    
    try {
      // Call edge function to generate theory content
      const { data: aiContent, error: genError } = await supabase.functions.invoke(
        'generate-theory-content',
        {
          body: { subtopicName: lessonName, topicName: topicName || '' }
        }
      );

      if (genError || !aiContent || aiContent.fallback) {
        console.error('Failed to generate theory:', genError);
        return;
      }

      const { explanation, workedExamples } = convertAIResponseToStorageFormat(aiContent);

      // Save to database for future use (precomputed, static content)
      const { error: updateError } = await supabase
        .from('subtopics')
        .update({
          theory_explanation: explanation,
          worked_examples: workedExamples as unknown as import('@/integrations/supabase/types').Json
        })
        .eq('id', lessonId);

      if (updateError) {
        console.error('Failed to save theory to database:', updateError);
        // Still show the generated content even if save fails
      } else {
        console.log('Theory content saved to database for subtopic:', lessonId);
      }

      // Update local state with generated content
      setTheoryData({ explanation, workedExamples });
    } catch (err) {
      console.error('Error generating theory:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const fetchTheory = async () => {
    setIsLoading(true);

    try {
      // Fetch static theory content from the database
      const { data: subtopicData, error } = await supabase
        .from('subtopics')
        .select('theory_explanation, worked_examples')
        .eq('id', lessonId)
        .single();

      if (error) {
        console.error('Error fetching theory:', error);
        setTheoryData(null);
        return;
      }

      // Parse worked examples (stored as JSON)
      let workedExamples: WorkedExample[] = [];
      if (subtopicData?.worked_examples) {
        try {
          const parsed = subtopicData.worked_examples;
          if (Array.isArray(parsed)) {
            workedExamples = parsed.map((item: unknown) => {
              const example = item as { title?: string; problem?: string; solution?: string };
              return {
                title: example.title,
                problem: example.problem || '',
                solution: example.solution || '',
              };
            }).filter(ex => ex.problem && ex.solution);
          }
        } catch (e) {
          console.error('Error parsing worked examples:', e);
        }
      }

      const hasExistingContent = subtopicData?.theory_explanation || workedExamples.length > 0;

      // If no content exists, automatically generate it in the background
      if (!hasExistingContent) {
        setTheoryData({ explanation: null, workedExamples: [] });
        setIsLoading(false);
        // Trigger automatic generation
        generateAndSaveTheory();
        return;
      }

      setTheoryData({
        explanation: subtopicData?.theory_explanation || null,
        workedExamples,
      });
    } catch (err) {
      console.error('Error fetching theory:', err);
      setTheoryData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const hasContent = theoryData?.explanation || (theoryData?.workedExamples && theoryData.workedExamples.length > 0);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="left" className="w-full sm:max-w-xl">
        <SheetHeader className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-lg font-semibold">{lessonName}</SheetTitle>
              <p className="text-sm text-muted-foreground">
                {topicName && `${topicName} · `}Lesson {lessonIndex + 1}
              </p>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] mt-6 pr-4">
          {isLoading ? (
            <TheoryLoadingSkeleton />
          ) : hasContent ? (
            <div className="space-y-6">
              {/* Main Explanation */}
              {theoryData?.explanation && (
                <TheorySection
                  icon={<Lightbulb className="w-4 h-4" />}
                  title="Concept Explanation"
                  accentColor="primary"
                >
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <MathRenderer segments={createSegmentsFromSolution(theoryData.explanation)} />
                  </div>
                </TheorySection>
              )}

              {/* Worked Examples */}
              {theoryData?.workedExamples && theoryData.workedExamples.length > 0 && (
                <TheorySection
                  icon={<Calculator className="w-4 h-4" />}
                  title="Worked Examples"
                  accentColor="emerald"
                >
                  <div className="space-y-4">
                    {theoryData.workedExamples.map((example, index) => (
                      <WorkedExampleCard 
                        key={index} 
                        example={example} 
                        number={index + 1}
                      />
                    ))}
                  </div>
                </TheorySection>
              )}

              {/* Ready to Practice Note */}
              <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Ready to Practice</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Review the concepts above, then try the exercises. Start with Easy 
                      difficulty to build confidence before moving to harder problems.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : isGenerating ? (
            <GeneratingMessage lessonName={lessonName} />
          ) : (
            <TheoryLoadingSkeleton />
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// Section component for consistent styling
interface TheorySectionProps {
  icon: React.ReactNode;
  title: string;
  accentColor: 'primary' | 'emerald' | 'amber' | 'blue';
  children: React.ReactNode;
}

function TheorySection({ icon, title, accentColor, children }: TheorySectionProps) {
  const colorStyles = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className={cn("p-1.5 rounded-lg", colorStyles[accentColor])}>
          {icon}
        </div>
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <div className="pl-1">{children}</div>
    </div>
  );
}

// Worked example card
interface WorkedExampleCardProps {
  example: WorkedExample;
  number: number;
}

function WorkedExampleCard({ example, number }: WorkedExampleCardProps) {
  return (
    <div className="rounded-xl border border-border/60 overflow-hidden">
      {/* Problem */}
      <div className="p-4 bg-muted/30">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            Example {number}
          </span>
          {example.title && (
            <span className="text-xs text-muted-foreground">{example.title}</span>
          )}
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <MathRenderer segments={createSegmentsFromSolution(example.problem)} />
        </div>
      </div>
      
      {/* Solution */}
      <div className="p-4 border-t border-border/40">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Solution
          </span>
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <MathRenderer segments={createSegmentsFromSolution(example.solution)} />
        </div>
      </div>
    </div>
  );
}

// Loading skeleton
function TheoryLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-5 w-36" />
        </div>
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    </div>
  );
}

// Generating message shown during automatic background generation
interface GeneratingMessageProps {
  lessonName: string;
}

function GeneratingMessage({ lessonName }: GeneratingMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 rounded-full bg-primary/10 mb-4">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
      <h3 className="font-semibold text-lg mb-2">Preparing Theory Content</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Creating comprehensive theory for "{lessonName}". This only happens once and will be available for all students.
      </p>
    </div>
  );
}
