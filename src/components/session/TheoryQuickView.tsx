import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import MathRenderer from '@/components/MathRenderer';
import { createSegmentsFromSolution } from '@/lib/solutionSegments';
import { BookOpen } from 'lucide-react';

interface TheoryQuickViewProps {
  isOpen: boolean;
  onClose: () => void;
  subtopicId: string;
  subtopicName: string;
}

export function TheoryQuickView({ isOpen, onClose, subtopicId, subtopicName }: TheoryQuickViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [theoryContent, setTheoryContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !theoryContent) {
      fetchTheory();
    }
  }, [isOpen]);

  const fetchTheory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First check if there's stored theory in the subtopics table
      const { data: subtopicData } = await supabase
        .from('subtopics')
        .select('theory_explanation')
        .eq('id', subtopicId)
        .single();

      if (subtopicData?.theory_explanation) {
        setTheoryContent(subtopicData.theory_explanation);
        setIsLoading(false);
        return;
      }

      // Otherwise, generate theory content
      const { data, error: fnError } = await supabase.functions.invoke('generate-theory-content', {
        body: { subtopicName, subtopicId },
      });

      if (fnError) throw fnError;

      if (data?.content) {
        setTheoryContent(data.content);
      } else {
        setError('Could not load theory content.');
      }
    } catch (err) {
      console.error('Error fetching theory:', err);
      setError('Failed to load theory. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="left" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            {subtopicName}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] mt-4 pr-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-20 w-full mt-4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>{error}</p>
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
