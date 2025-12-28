import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDown, ChevronUp, CheckCircle, Circle, BookOpen } from 'lucide-react';
import MathRenderer from '@/components/MathRenderer';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ExamPart {
  partLabel: string;
  points: number;
  prompt: string;
  solution?: {
    steps: string[];
    answer: string;
  };
}

interface ExamQuestionProps {
  questionNumber: number;
  totalPoints: number;
  topic: string;
  context: string;
  parts: ExamPart[];
  answers: Record<string, string>;
  onAnswerChange: (partLabel: string, answer: string) => void;
  showSolutions?: boolean;
  completedParts?: string[];
}

export function ExamQuestion({
  questionNumber,
  totalPoints,
  topic,
  context,
  parts,
  answers,
  onAnswerChange,
  showSolutions = false,
  completedParts = []
}: ExamQuestionProps) {
  const [expandedParts, setExpandedParts] = useState<string[]>(parts.map(p => p.partLabel));

  const togglePart = (partLabel: string) => {
    setExpandedParts(prev => 
      prev.includes(partLabel) 
        ? prev.filter(p => p !== partLabel)
        : [...prev, partLabel]
    );
  };

  const isPartCompleted = (partLabel: string) => completedParts.includes(partLabel);

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
              {questionNumber}
            </div>
            <div>
              <CardTitle className="text-xl">Question {questionNumber}</CardTitle>
              <p className="text-sm text-muted-foreground">{topic}</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-base px-3 py-1">
            {totalPoints} points
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Question Context */}
        <div className="p-4 rounded-lg bg-muted/50 border">
          <div className="flex items-start gap-2">
            <BookOpen className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <MathRenderer latex={context} />
            </div>
          </div>
        </div>

        {/* Question Parts */}
        <div className="space-y-4">
          {parts.map((part) => (
            <Collapsible 
              key={part.partLabel}
              open={expandedParts.includes(part.partLabel)}
              onOpenChange={() => togglePart(part.partLabel)}
            >
              <div className={cn(
                "border rounded-lg overflow-hidden transition-colors",
                isPartCompleted(part.partLabel) && "border-green-500/50 bg-green-500/5"
              )}>
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {isPartCompleted(part.partLabel) ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span className="font-semibold text-lg">
                        Part {part.partLabel.toUpperCase()}
                      </span>
                      <Badge variant="outline" className="ml-2">
                        {part.points} pts
                      </Badge>
                    </div>
                    {expandedParts.includes(part.partLabel) ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-4">
                    {/* Part Prompt */}
                    <div className="pl-8">
                      <MathRenderer latex={part.prompt} />
                    </div>
                    
                    {/* Answer Input */}
                    <div className="pl-8">
                      <Textarea
                        placeholder={`Enter your answer for part ${part.partLabel.toUpperCase()}...`}
                        value={answers[part.partLabel] || ''}
                        onChange={(e) => onAnswerChange(part.partLabel, e.target.value)}
                        className="min-h-[100px] font-mono"
                        disabled={showSolutions}
                      />
                    </div>

                    {/* Solution (if revealed) */}
                    {showSolutions && part.solution && (
                      <div className="pl-8 mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                        <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">
                          Solution:
                        </h4>
                        <div className="space-y-2">
                          {part.solution.steps.map((step, idx) => (
                            <div key={idx} className="text-sm">
                              <MathRenderer latex={`${idx + 1}. ${step}`} />
                            </div>
                          ))}
                          <div className="mt-3 pt-3 border-t border-green-500/30">
                            <span className="font-semibold">Answer: </span>
                            <MathRenderer latex={part.solution.answer} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
