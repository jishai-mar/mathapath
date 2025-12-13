import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import MathRenderer from './MathRenderer';
import TutorChat from './TutorChat';
import AnimatedMathVideo, { generateAnimationSteps } from './AnimatedMathVideo';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  BookOpen, 
  ChevronDown, 
  PlayCircle, 
  MessageCircle,
  CheckCircle2,
  Lightbulb,
  Video,
  AlertTriangle,
  Target,
  TrendingUp,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface WorkedExample {
  problem: string;
  steps: string[];
  answer: string;
}

interface CommonMistake {
  mistake: string;
  correction: string;
}

interface VisualDescription {
  type: 'graph' | 'diagram' | 'number_line' | 'coordinate_plane';
  description: string;
  key_points: string[];
}

interface EnhancedTheoryContent {
  theory_explanation: string;
  worked_examples: WorkedExample[];
  key_concepts: string[];
  common_mistakes: CommonMistake[];
  visual_description: VisualDescription | null;
}

interface LearnViewProps {
  subtopicName: string;
  topicName?: string;
  theoryExplanation: string | null;
  workedExamples: WorkedExample[];
  onStartPractice: () => void;
}

export default function LearnView({
  subtopicName,
  topicName = '',
  theoryExplanation,
  workedExamples,
  onStartPractice,
}: LearnViewProps) {
  const [expandedExample, setExpandedExample] = useState<number | null>(0);
  const [showTutor, setShowTutor] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const [showMistakes, setShowMistakes] = useState(false);
  
  // Enhanced content state
  const [enhancedContent, setEnhancedContent] = useState<EnhancedTheoryContent | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [hasGeneratedContent, setHasGeneratedContent] = useState(false);

  // Use enhanced content if available, otherwise fall back to props
  const displayTheory = enhancedContent?.theory_explanation || theoryExplanation;
  const displayExamples = enhancedContent?.worked_examples?.length ? enhancedContent.worked_examples : workedExamples;
  const keyConcepts = enhancedContent?.key_concepts || [];
  const commonMistakes = enhancedContent?.common_mistakes || [];
  const visualDescription = enhancedContent?.visual_description;

  const hasTheory = displayTheory && displayTheory.trim().length > 0;
  const hasExamples = displayExamples && displayExamples.length > 0;

  // Auto-generate content if none exists
  useEffect(() => {
    const shouldGenerate = !hasTheory && !hasExamples && !hasGeneratedContent && !isLoadingContent;
    if (shouldGenerate) {
      generateTheoryContent();
    }
  }, [subtopicName, hasTheory, hasExamples, hasGeneratedContent, isLoadingContent]);

  const generateTheoryContent = async () => {
    setIsLoadingContent(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-theory-content', {
        body: {
          subtopicName,
          topicName,
          existingTheory: theoryExplanation,
          existingExamples: workedExamples,
        }
      });

      if (error) throw error;
      if (data && !data.error) {
        setEnhancedContent(data);
        toast.success('Theory content loaded!');
      }
    } catch (error) {
      console.error('Error generating theory content:', error);
      toast.error('Could not load enhanced theory content.');
    } finally {
      setIsLoadingContent(false);
      setHasGeneratedContent(true);
    }
  };

  // Generate animation steps from theory content
  const animationSteps = useMemo(() => {
    if (!hasTheory) return [];
    return generateAnimationSteps(
      subtopicName,
      displayTheory || '',
      hasExamples ? displayExamples[0] : undefined
    );
  }, [subtopicName, displayTheory, displayExamples, hasTheory, hasExamples]);

  if (isLoadingContent && !hasTheory) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-3">
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-center gap-2 text-muted-foreground pt-4">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="text-sm">Generating personalized theory content...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Key Concepts Section */}
      {keyConcepts.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-primary" />
              Key Concepts to Master
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {keyConcepts.map((concept, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span className="text-foreground/90 text-sm">
                    <MathRenderer latex={concept} />
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Animated Video Section */}
      {animationSteps.length > 0 && (
        <Collapsible open={showVideo} onOpenChange={setShowVideo}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between border-primary/30 bg-primary/5 hover:bg-primary/10"
            >
              <span className="flex items-center gap-2">
                <Video className="w-4 h-4 text-primary" />
                <span className="font-medium">Watch: {subtopicName}</span>
              </span>
              <ChevronDown 
                className={`w-4 h-4 transition-transform ${showVideo ? 'rotate-180' : ''}`} 
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <AnimatedMathVideo
              title={subtopicName}
              steps={animationSteps}
            />
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Theory Section */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="w-5 h-5 text-primary" />
              Theory: {subtopicName}
            </CardTitle>
            {!enhancedContent && hasTheory && (
              <Button
                variant="ghost"
                size="sm"
                onClick={generateTheoryContent}
                disabled={isLoadingContent}
                className="text-muted-foreground"
              >
                {isLoadingContent ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-1" />
                    Enhance
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasTheory ? (
            <div className="prose prose-invert prose-sm max-w-none">
              <div className="text-foreground/90 leading-relaxed space-y-3">
                {displayTheory!.split('\n\n').map((paragraph, idx) => (
                  <div key={idx} className="theory-paragraph">
                    {paragraph.startsWith('**') ? (
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <MathRenderer latex={paragraph.replace(/\*\*/g, '')} />
                      </div>
                    ) : paragraph.match(/^\d\./) ? (
                      <div className="pl-4 border-l-2 border-primary/30">
                        <MathRenderer latex={paragraph} />
                      </div>
                    ) : (
                      <MathRenderer latex={paragraph} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Lightbulb className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>Theory content coming soon for this subtopic.</p>
              <p className="text-sm mt-1">You can start practicing right away!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visual Description Section */}
      {visualDescription && (
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-primary" />
              Visual Representation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg bg-secondary/20 border border-border/50">
              <p className="text-sm text-foreground/80 mb-3">{visualDescription.description}</p>
              <div className="space-y-1">
                {visualDescription.key_points.map((point, idx) => (
                  <p key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary/50" />
                    {point}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Worked Examples Section */}
      {hasExamples && (
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              Worked Examples
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Step-by-step solutions with explanations
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {displayExamples.map((example, idx) => (
              <Collapsible
                key={idx}
                open={expandedExample === idx}
                onOpenChange={() => setExpandedExample(expandedExample === idx ? null : idx)}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center font-medium">
                        {idx + 1}
                      </span>
                      <span className="text-left text-sm">
                        <MathRenderer latex={example.problem} />
                      </span>
                    </div>
                    <ChevronDown 
                      className={`w-4 h-4 text-muted-foreground transition-transform ${
                        expandedExample === idx ? 'rotate-180' : ''
                      }`} 
                    />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 ml-9 space-y-3 animate-fade-in">
                    {example.steps.map((step, stepIdx) => (
                      <div 
                        key={stepIdx}
                        className="flex items-start gap-3 text-sm p-3 rounded-lg bg-secondary/20 border-l-2 border-primary/30"
                        style={{ animationDelay: `${stepIdx * 100}ms` }}
                      >
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-mono text-xs flex items-center justify-center flex-shrink-0">
                          {stepIdx + 1}
                        </span>
                        <div className="text-foreground/80">
                          <MathRenderer latex={step} />
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="font-medium text-primary text-lg">
                        <MathRenderer latex={example.answer} />
                      </span>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Common Mistakes Section */}
      {commonMistakes.length > 0 && (
        <Collapsible open={showMistakes} onOpenChange={setShowMistakes}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between border-destructive/30 bg-destructive/5 hover:bg-destructive/10"
            >
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <span className="font-medium">Common Mistakes to Avoid</span>
              </span>
              <ChevronDown 
                className={`w-4 h-4 transition-transform ${showMistakes ? 'rotate-180' : ''}`} 
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="pt-4 space-y-4">
                {commonMistakes.map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-destructive font-medium text-sm">✗</span>
                      <p className="text-sm text-foreground/80">
                        <MathRenderer latex={item.mistake} />
                      </p>
                    </div>
                    <div className="flex items-start gap-2 ml-4">
                      <span className="text-primary font-medium text-sm">→</span>
                      <p className="text-sm text-muted-foreground">
                        <MathRenderer latex={item.correction} />
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Ask Tutor Section */}
      <Collapsible open={showTutor} onOpenChange={setShowTutor}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between border-border/50 hover:border-primary/30"
          >
            <span className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Ask the tutor about this topic
            </span>
            <ChevronDown 
              className={`w-4 h-4 transition-transform ${showTutor ? 'rotate-180' : ''}`} 
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <TutorChat 
            subtopicName={subtopicName}
            theoryContext={displayTheory || ''}
          />
        </CollapsibleContent>
      </Collapsible>

      {/* Start Practice Button */}
      <Button
        onClick={onStartPractice}
        size="lg"
        className="w-full py-6 text-lg font-semibold gap-3"
      >
        <PlayCircle className="w-6 h-6" />
        Start Practice
      </Button>
    </div>
  );
}
