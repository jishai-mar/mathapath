import { Lightbulb, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MathRenderer from '@/components/MathRenderer';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface DeepDiveBlockProps {
  block: {
    id: string;
    blockNumber: string;
    title: string;
    content: {
      question: string;
      answerExplanation: string;
      boundaryCases?: string[];
      extension?: string;
    };
  };
  showBlockNumber?: boolean;
}

export function DeepDiveBlock({ block, showBlockNumber = true }: DeepDiveBlockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { content } = block;

  return (
    <Card className="border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
            <Lightbulb className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            {showBlockNumber && (
              <span className="text-xs font-mono text-purple-600 dark:text-purple-400">
                {block.blockNumber}
              </span>
            )}
            <CardTitle className="text-lg leading-tight">
              {block.title}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Question */}
        <div className="p-4 rounded-lg bg-purple-100/50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800">
          <div className="text-purple-800 dark:text-purple-200 font-medium">
            <MathRenderer latex={content.question} />
          </div>
        </div>

        {/* Collapsible Answer */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              {isOpen ? 'Hide explanation' : 'Show explanation'}
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-4">
            {/* Answer Explanation */}
            <div>
              <h4 className="font-medium text-sm text-purple-700 dark:text-purple-300 mb-2">
                Explanation:
              </h4>
              <div className="text-sm text-muted-foreground leading-relaxed">
                <MathRenderer latex={content.answerExplanation} />
              </div>
            </div>

            {/* Boundary Cases */}
            {content.boundaryCases && content.boundaryCases.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-purple-700 dark:text-purple-300 mb-2">
                  Edge cases to consider:
                </h4>
                <ul className="space-y-2">
                  {content.boundaryCases.map((bc, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-purple-500">•</span>
                      <MathRenderer latex={bc} />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Extension */}
            {content.extension && (
              <div className="p-3 rounded-lg bg-gradient-to-r from-purple-100/50 to-indigo-100/50 dark:from-purple-900/30 dark:to-indigo-900/30 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-medium text-sm mb-2">
                  <ArrowRight className="h-4 w-4" />
                  Further exploration:
                </div>
                <div className="text-sm text-muted-foreground">
                  <MathRenderer latex={content.extension} />
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
