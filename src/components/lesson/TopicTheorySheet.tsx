import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, CheckCircle2 } from 'lucide-react';
import MathRenderer from '@/components/MathRenderer';

interface TopicTheorySheetProps {
  isOpen: boolean;
  onClose: () => void;
  topicId: string;
  topicName: string;
}

export function TopicTheorySheet({ 
  isOpen, 
  onClose, 
  topicId, 
  topicName 
}: TopicTheorySheetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [theoryContent, setTheoryContent] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && topicId) {
      fetchTheory();
    }
  }, [isOpen, topicId]);

  const fetchTheory = async () => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('topics')
        .select('theory_content')
        .eq('id', topicId)
        .single();

      if (error) {
        console.error('Error fetching topic theory:', error);
        setTheoryContent(null);
        return;
      }

      setTheoryContent(data?.theory_content || null);
    } catch (err) {
      console.error('Error fetching topic theory:', err);
      setTheoryContent(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="left" className="w-full sm:max-w-2xl">
        <SheetHeader className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-lg font-semibold">{topicName}</SheetTitle>
              <p className="text-sm text-muted-foreground">Complete Theory Guide</p>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] mt-6 pr-4">
          {isLoading ? (
            <TheoryLoadingSkeleton />
          ) : theoryContent ? (
            <div className="space-y-6">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <MathRenderer latex={theoryContent} className="whitespace-pre-line text-foreground leading-relaxed" />
              </div>

              {/* Ready to Practice Note */}
              <div className="p-4 rounded-xl bg-muted/50 border border-border/50 mt-8">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Ready to Practice</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Review the concepts above, then work through the lesson exercises. 
                      Start with Easy difficulty to build confidence before moving to harder problems.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <EmptyTheoryMessage topicName={topicName} />
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function TheoryLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

function EmptyTheoryMessage({ topicName }: { topicName: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 rounded-full bg-muted mb-4">
        <BookOpen className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg mb-2">Theory Coming Soon</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        The complete theory guide for "{topicName}" is being prepared.
      </p>
    </div>
  );
}