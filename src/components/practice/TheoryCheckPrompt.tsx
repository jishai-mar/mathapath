import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Lightbulb, 
  CheckCircle2, 
  ArrowRight,
  HelpCircle,
  Sparkles,
  XCircle,
  RefreshCw
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

// Keywords that indicate understanding of common math concepts
const CONCEPT_KEYWORDS: Record<string, string[]> = {
  'cross multiply': ['cross multiply', 'kruislings', 'cross multiplication', 'kruisvermenigvuldigen'],
  'common denominator': ['common denominator', 'noemer', 'gemeenschappelijke noemer', 'lcd', 'lcm'],
  'fraction': ['fraction', 'breuk', 'breuken', 'fractional', 'rational'],
  'quadratic': ['quadratic', 'kwadratisch', 'abc', 'discriminant', 'vierkant'],
  'linear': ['linear', 'lineair', 'first degree', 'eerste graads'],
  'derivative': ['derivative', 'afgeleide', 'differentiate', 'differentiëren'],
  'integral': ['integral', 'integraal', 'integrate', 'integreren'],
  'power rule': ['power rule', 'machtsregel', 'exponent'],
  'product rule': ['product rule', 'productregel'],
  'chain rule': ['chain rule', 'kettingregel'],
  'pythagorean': ['pythagorean', 'pythagoras', 'a²+b²'],
  'trigonometry': ['trig', 'sin', 'cos', 'tan', 'sinus', 'cosinus', 'tangens'],
  'logarithm': ['log', 'logarithm', 'logaritme', 'ln'],
  'exponential': ['exponential', 'exponentieel', 'exponent'],
  'factoring': ['factor', 'ontbinden', 'factoriseren', 'factoring'],
  'substitution': ['substitution', 'substitutie', 'vervangen'],
  'elimination': ['elimination', 'eliminatie', 'wegwerken'],
  'isolate': ['isolate', 'isoleren', 'solve for', 'oplossen naar'],
};

function checkTheoryResponse(response: string, linkedTheory?: LinkedTheoryBlock[], subtopicName?: string): boolean {
  const lowerResponse = response.toLowerCase().trim();
  
  // If response is too short, it's likely not a valid answer
  if (lowerResponse.length < 3) {
    return false;
  }
  
  // Check against linked theory block titles
  if (linkedTheory && linkedTheory.length > 0) {
    for (const block of linkedTheory) {
      const blockTitle = block.title.toLowerCase();
      // Check if response contains any significant words from the theory block title
      const titleWords = blockTitle.split(/\s+/).filter(w => w.length > 3);
      for (const word of titleWords) {
        if (lowerResponse.includes(word)) {
          return true;
        }
      }
    }
  }
  
  // Check against subtopic name
  if (subtopicName) {
    const subtopicLower = subtopicName.toLowerCase();
    const subtopicWords = subtopicLower.split(/\s+/).filter(w => w.length > 3);
    for (const word of subtopicWords) {
      if (lowerResponse.includes(word)) {
        return true;
      }
    }
  }
  
  // Check against common math concept keywords
  for (const keywords of Object.values(CONCEPT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerResponse.includes(keyword.toLowerCase())) {
        return true;
      }
    }
  }
  
  // Check if response mentions any mathematical operation
  const mathOperations = [
    'solve', 'oplossen', 'simplify', 'vereenvoudigen', 'multiply', 'vermenigvuldigen',
    'divide', 'delen', 'add', 'optellen', 'subtract', 'aftrekken', 'equation', 'vergelijking',
    'formula', 'formule', 'rule', 'regel', 'theorem', 'stelling', 'property', 'eigenschap',
    'method', 'methode', 'approach', 'aanpak'
  ];
  
  for (const operation of mathOperations) {
    if (lowerResponse.includes(operation)) {
      return true;
    }
  }
  
  return false;
}

function getExpectedConcepts(linkedTheory?: LinkedTheoryBlock[], subtopicName?: string): string[] {
  const concepts: string[] = [];
  
  if (linkedTheory && linkedTheory.length > 0) {
    const primaryTheory = linkedTheory.filter(b => b.relevance === 'primary');
    if (primaryTheory.length > 0) {
      concepts.push(...primaryTheory.map(b => b.title));
    } else {
      concepts.push(linkedTheory[0].title);
    }
  }
  
  if (subtopicName && !concepts.some(c => c.toLowerCase().includes(subtopicName.toLowerCase()))) {
    concepts.push(subtopicName);
  }
  
  return concepts;
}

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
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);
  
  // Pick a random prompt for variety
  const [prompt] = useState(() => 
    THEORY_PROMPTS[Math.floor(Math.random() * THEORY_PROMPTS.length)]
  );
  
  const expectedConcepts = useMemo(() => 
    getExpectedConcepts(linkedTheoryBlocks, subtopicName),
    [linkedTheoryBlocks, subtopicName]
  );

  const handleSubmit = () => {
    if (response.trim()) {
      const correct = checkTheoryResponse(response, linkedTheoryBlocks, subtopicName);
      setIsCorrect(correct);
      setIsSubmitted(true);
      setAttempts(prev => prev + 1);
      
      if (correct) {
        // Brief animation before proceeding
        setTimeout(() => {
          onComplete(response, false);
        }, 1000);
      }
    }
  };
  
  const handleTryAgain = () => {
    setResponse('');
    setIsSubmitted(false);
    setIsCorrect(null);
    setShowHint(true); // Show hint after first wrong attempt
  };

  const handleSkip = () => {
    onComplete('', true);
  };
  
  const handleContinueAnyway = () => {
    onComplete(response, false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && response.trim() && !isSubmitted) {
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleContinueAnyway}
            className="text-xs"
          >
            Practice Exercise
          </Button>
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
            disabled={isSubmitted && isCorrect === true}
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
          
          {/* Show expected concepts hint if no linked theory blocks */}
          {showHint && primaryTheory.length === 0 && expectedConcepts.length > 0 && (
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
                    Hint: Think about...
                  </span>
                </div>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {expectedConcepts.join(', ')}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success State */}
        <AnimatePresence>
          {isSubmitted && isCorrect === true && (
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
          
          {/* Wrong Answer State */}
          {isSubmitted && isCorrect === false && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-center gap-2 py-2">
                <XCircle className="w-5 h-5 text-destructive" />
                <span className="text-destructive font-medium">
                  Not quite - try to be more specific about the method or rule.
                </span>
              </div>
              
              {expectedConcepts.length > 0 && attempts >= 2 && (
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-sm text-muted-foreground">
                    Consider: <span className="font-medium text-foreground">{expectedConcepts[0]}</span>
                  </p>
                </div>
              )}
              
              <div className="flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTryAgain}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleContinueAnyway}
                  className="text-muted-foreground"
                >
                  Continue Anyway
                </Button>
              </div>
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
              
              {(primaryTheory.length > 0 || expectedConcepts.length > 0) && !showHint && (
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
