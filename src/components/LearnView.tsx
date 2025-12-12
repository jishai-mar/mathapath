import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import MathRenderer from './MathRenderer';
import TutorChat from './TutorChat';
import AnimatedMathVideo, { generateAnimationSteps } from './AnimatedMathVideo';
import { 
  BookOpen, 
  ChevronDown, 
  PlayCircle, 
  MessageCircle,
  CheckCircle2,
  Lightbulb,
  Video
} from 'lucide-react';

interface WorkedExample {
  problem: string;
  steps: string[];
  answer: string;
}

interface LearnViewProps {
  subtopicName: string;
  theoryExplanation: string | null;
  workedExamples: WorkedExample[];
  onStartPractice: () => void;
}

export default function LearnView({
  subtopicName,
  theoryExplanation,
  workedExamples,
  onStartPractice,
}: LearnViewProps) {
  const [expandedExample, setExpandedExample] = useState<number | null>(0);
  const [showTutor, setShowTutor] = useState(false);
  const [showVideo, setShowVideo] = useState(true);

  const hasTheory = theoryExplanation && theoryExplanation.trim().length > 0;
  const hasExamples = workedExamples && workedExamples.length > 0;

  // Generate animation steps from theory content
  const animationSteps = useMemo(() => {
    if (!hasTheory) return [];
    return generateAnimationSteps(
      subtopicName,
      theoryExplanation || '',
      hasExamples ? workedExamples[0] : undefined
    );
  }, [subtopicName, theoryExplanation, workedExamples, hasTheory, hasExamples]);

  return (
    <div className="space-y-6 animate-fade-in">
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
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="w-5 h-5 text-primary" />
            Theory: {subtopicName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasTheory ? (
            <div className="prose prose-invert prose-sm max-w-none">
              <div className="text-foreground/90 leading-relaxed space-y-3">
                {theoryExplanation.split('\n\n').map((paragraph, idx) => (
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
            {workedExamples.map((example, idx) => (
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
            theoryContext={theoryExplanation || ''}
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
