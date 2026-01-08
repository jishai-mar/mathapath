import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import MathRenderer from '@/components/MathRenderer';
import { createSegmentsFromSolution } from '@/lib/solutionSegments';
import { BookOpen, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [theoryContent, setTheoryContent] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTheory();
    }
  }, [isOpen, lessonId]);

  const fetchTheory = async () => {
    setIsLoading(true);

    try {
      // First check if there's stored theory in the subtopics table
      const { data: subtopicData } = await supabase
        .from('subtopics')
        .select('theory_explanation')
        .eq('id', lessonId)
        .single();

      if (subtopicData?.theory_explanation) {
        setTheoryContent(subtopicData.theory_explanation);
        setIsLoading(false);
        return;
      }

      // Otherwise, generate theory content for this specific node
      setIsGenerating(true);
      const { data, error: fnError } = await supabase.functions.invoke('generate-theory-content', {
        body: { 
          subtopicName: lessonName, 
          subtopicId: lessonId,
          lessonIndex,
          topicName,
          nodeSpecific: true // Flag to generate node-specific content
        },
      });

      if (fnError) throw fnError;

      if (data?.content) {
        setTheoryContent(data.content);
      } else {
        // Generate fallback content
        setTheoryContent(generateFallbackTheory(lessonName, lessonIndex));
      }
    } catch (err) {
      console.error('Error fetching theory:', err);
      // Always provide content, never show error state
      setTheoryContent(generateFallbackTheory(lessonName, lessonIndex));
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="left" className="w-full sm:max-w-xl">
        <SheetHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-lg">{lessonName}</SheetTitle>
              <p className="text-sm text-muted-foreground">Lesson {lessonIndex + 1} Theory</p>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] mt-6 pr-4">
          {isLoading ? (
            <div className="space-y-4">
              {isGenerating && (
                <Alert className="mb-4 bg-primary/5 border-primary/20">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-sm">
                    Generating personalized theory content for this lesson...
                  </AlertDescription>
                </Alert>
              )}
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-24 w-full mt-4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ) : theoryContent ? (
            <div className="prose prose-sm dark:prose-invert max-w-none space-y-4">
              <MathRenderer segments={createSegmentsFromSolution(theoryContent)} />
            </div>
          ) : null}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function generateFallbackTheory(lessonName: string, lessonIndex: number): string {
  return `# ${lessonName}

## What You'll Learn

This lesson covers the essential concepts of **${lessonName}**. By the end of this lesson, you'll be able to:

- Understand the core principles
- Apply the concepts to solve problems
- Recognize patterns and common approaches

## Key Concepts

${lessonName} is a fundamental building block in mathematics. Let's break it down step by step.

### Getting Started

Before diving in, make sure you're comfortable with the concepts from earlier lessons in this topic. Each lesson builds on what you've learned before.

### Core Idea

The main idea behind ${lessonName} involves understanding relationships and applying logical reasoning to find solutions.

## Practice Tips

1. **Start with simple examples** - Don't rush to complex problems
2. **Work through each step** - Understanding the process is key
3. **Check your answers** - Verification builds confidence

Ready to practice? Try the Easy exercises first to build your foundation.`;
}
