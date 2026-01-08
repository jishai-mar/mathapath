import { AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MathRenderer from '@/components/MathRenderer';

interface CommonMistakeBlockProps {
  block: {
    id: string;
    blockNumber: string;
    title: string;
    content: {
      mistakeTitle: string;
      incorrectReasoning: string;
      whyWrong: string;
      correction: string;
      miniExample?: {
        wrong: string;
        right: string;
      };
    };
  };
  showBlockNumber?: boolean;
}

export function CommonMistakeBlock({ block, showBlockNumber = true }: CommonMistakeBlockProps) {
  const { content } = block;

  return (
    <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            {showBlockNumber && (
              <span className="text-xs font-mono text-amber-600 dark:text-amber-400">
                {block.blockNumber}
              </span>
            )}
            <CardTitle className="text-lg leading-tight">
              {block.title}
            </CardTitle>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              {content.mistakeTitle}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Incorrect Reasoning */}
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-medium text-sm mb-2">
            <XCircle className="h-4 w-4" />
            What students incorrectly do:
          </div>
          <div className="text-sm text-red-800 dark:text-red-200">
            <MathRenderer latex={content.incorrectReasoning} />
          </div>
        </div>

        {/* Why It's Wrong */}
        <div>
          <h4 className="font-medium text-sm text-amber-800 dark:text-amber-200 mb-2">
            Why this is wrong:
          </h4>
          <div className="text-sm text-muted-foreground">
            <MathRenderer latex={content.whyWrong} />
          </div>
        </div>

        {/* Correct Approach */}
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium text-sm mb-2">
            <CheckCircle2 className="h-4 w-4" />
            The correct approach:
          </div>
          <div className="text-sm text-green-800 dark:text-green-200">
            <MathRenderer latex={content.correction} />
          </div>
        </div>

        {/* Mini Example */}
        {content.miniExample && (
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-3 rounded-lg bg-red-100/50 dark:bg-red-900/20">
              <div className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
                ✗ Wrong
              </div>
              <div className="text-sm">
                <MathRenderer latex={content.miniExample.wrong} />
              </div>
            </div>
            <div className="p-3 rounded-lg bg-green-100/50 dark:bg-green-900/20">
              <div className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">
                ✓ Correct
              </div>
              <div className="text-sm">
                <MathRenderer latex={content.miniExample.right} />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
