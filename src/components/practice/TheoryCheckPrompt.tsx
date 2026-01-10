import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Lightbulb, 
  CheckCircle2, 
  ArrowRight,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MathRenderer from '@/components/MathRenderer';
import { createSegmentsFromSolution } from '@/lib/solutionSegments';
import { LinkedTheoryBlock } from './types';

interface TheoryCheckPromptProps {
  question: string;
  subtopicName: string;
  linkedTheoryBlocks?: LinkedTheoryBlock[];
  onComplete: (response: string, skipped: boolean) => void;
  onOpenTheory: () => void;
}

const THEORY_PROMPTS = [
  "What theorem or property will you need to solve this?",
  "Which mathematical rule applies here?",
  "What definition or formula is relevant?",
  "What concept from theory should you use?",
];

export function TheoryCheckPrompt({
  question,
  subtopicName,
  linkedTheoryBlocks,
  onComplete,
  onOpenTheory
}: TheoryCheckPromptProps) {
  const [response, setResponse] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Pick a random prompt for variety
  const [prompt] = useState(() => 
    THEORY_PROMPTS[Math.floor(Math.random() * THEORY_PROMPTS.length)]
  );

  const handleSubmit = () => {
    if (response.trim()) {
      setIsSubmitted(true);
      // Brief animation before proceeding
      setTimeout(() => {
        onComplete(response, false);
      }, 800);
    }
  };

  const handleSkip = () => {
    onComplete('', true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && response.trim()) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Get primary theory blocks for hints
  const primaryTheory = linkedTheoryBlocks?.filter(b => b.relevance === 'primary') || [];

  return (
    <Card className="w-full max-w-2xl mx-auto border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary/10">
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-lg">Theory Check</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {subtopicName}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Question Preview */}
        <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-medium">
            Problem
          </p>
          <div className="text-base">
            <MathRenderer segments={createSegmentsFromSolution(question)} />
          </div>
        </div>

        {/* Theory Check Question */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-base font-medium text-foreground">
              {prompt}
            </p>
          </div>
          
          <Textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type the theorem, property, or concept you'll use..."
            className="min-h-[80px] resize-none"
            disabled={isSubmitted}
          />
          
          <p className="text-xs text-muted-foreground">
            This helps reinforce theory-first thinking. Press Enter to continue.
          </p>
        </div>

        {/* Hint Section */}
        <AnimatePresence>
          {showHint && primaryTheory.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    Hint: Relevant Theory
                  </span>
                </div>
                <div className="space-y-1">
                  {primaryTheory.map((block) => (
                    <div key={block.id} className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary" className="text-xs">
                        {block.blockNumber}
                      </Badge>
                      <span>{block.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success State */}
        <AnimatePresence>
          {isSubmitted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-2 py-4"
            >
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              <span className="text-green-600 font-medium">
                Great! Now let's solve it.
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        {!isSubmitted && (
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenTheory}
                className="gap-2 text-muted-foreground"
              >
                <BookOpen className="w-4 h-4" />
                Review Theory
              </Button>
              
              {primaryTheory.length > 0 && !showHint && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHint(true)}
                  className="gap-2 text-muted-foreground"
                >
                  <Lightbulb className="w-4 h-4" />
                  Show Hint
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-muted-foreground"
              >
                Skip
              </Button>
              
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!response.trim()}
                className="gap-2"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
