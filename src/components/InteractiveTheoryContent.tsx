import { useState } from 'react';
import { motion } from 'framer-motion';
import MathRenderer from './MathRenderer';
import { createSegmentsFromSolution } from '@/lib/solutionSegments';
import { 
  Lightbulb, 
  Eye, 
  EyeOff, 
  HelpCircle,
  CheckCircle2,
  Zap,
  BookMarked,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InteractiveTheoryContentProps {
  content: string;
}

// Parse theory content with special markers like [HOOK], [VISUAL], [CONCEPT], etc.
function parseTheoryContent(content: string) {
  const sections: Array<{
    type: 'hook' | 'visual' | 'concept' | 'try_it' | 'example_box' | 'key_insight' | 'remember' | 'text';
    content: string;
    question?: string;
    answer?: string;
  }> = [];

  // Split by section markers
  const markers = /\[(HOOK|VISUAL|CONCEPT|TRY IT|EXAMPLE BOX|KEY INSIGHT|REMEMBER)\]/gi;
  const parts = content.split(markers);

  let currentType: string = 'text';
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;

    // Check if this part is a marker
    const markerMatch = part.match(/^(HOOK|VISUAL|CONCEPT|TRY IT|EXAMPLE BOX|KEY INSIGHT|REMEMBER)$/i);
    
    if (markerMatch) {
      currentType = markerMatch[1].toLowerCase().replace(' ', '_');
    } else {
      // Check for [TRY IT] inline format with Question/Answer
      if (currentType === 'try_it' || currentType === 'try it') {
        const questionMatch = part.match(/Question:\s*(.+?)(?:\n|$)/i);
        const answerMatch = part.match(/Answer:\s*(.+?)(?:\n|$)/i);
        const hintMatch = part.match(/Hint:\s*(.+?)(?:\n|$)/i);
        
        sections.push({
          type: 'try_it',
          content: hintMatch ? hintMatch[1] : '',
          question: questionMatch ? questionMatch[1].trim() : part,
          answer: answerMatch ? answerMatch[1].trim() : ''
        });
      } else {
        sections.push({
          type: currentType as any,
          content: part
        });
      }
      currentType = 'text';
    }
  }

  return sections;
}

// Component to render a "Try It" interactive mini exercise
function TryItSection({ question, hint, answer }: { question: string; hint?: string; answer: string }) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [showHint, setShowHint] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 rounded-xl bg-accent/10 border-2 border-accent/30 border-dashed"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
          <Zap className="w-4 h-4 text-accent" />
        </div>
        <span className="font-semibold text-accent text-sm">Quick Check</span>
      </div>
      
      <div className="text-foreground mb-4">
        <MathRenderer segments={createSegmentsFromSolution(question)} />
      </div>

      <div className="flex flex-wrap gap-2">
        {hint && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHint(!showHint)}
            className="text-muted-foreground hover:text-accent"
          >
            <HelpCircle className="w-4 h-4 mr-1" />
            {showHint ? 'Hide Hint' : 'Show Hint'}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAnswer(!showAnswer)}
          className="text-muted-foreground hover:text-primary"
        >
          {showAnswer ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
          {showAnswer ? 'Hide Answer' : 'Reveal Answer'}
        </Button>
      </div>

      {showHint && hint && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 p-3 rounded-lg bg-accent/5 border border-accent/20 text-sm text-muted-foreground"
        >
          💡 {hint}
        </motion.div>
      )}

      {showAnswer && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/30"
        >
          <div className="flex items-center gap-2 text-primary">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-semibold">
              <MathRenderer segments={createSegmentsFromSolution(answer)} />
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// Render code/visual block with proper formatting
function VisualBlock({ content }: { content: string }) {
  // Check if it contains ASCII art (code block)
  const codeMatch = content.match(/```([\s\S]*?)```/);
  
  if (codeMatch) {
    const beforeCode = content.slice(0, content.indexOf('```')).trim();
    const codeContent = codeMatch[1].trim();
    const afterCode = content.slice(content.lastIndexOf('```') + 3).trim();

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-xl bg-card border border-border/50"
      >
        {beforeCode && (
          <p className="text-sm text-muted-foreground mb-3">{beforeCode}</p>
        )}
        <pre className="font-mono text-sm text-primary bg-primary/5 p-4 rounded-lg overflow-x-auto leading-relaxed">
          {codeContent}
        </pre>
        {afterCode && (
          <p className="text-sm text-muted-foreground mt-3">{afterCode}</p>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-card/50 border border-primary/20"
    >
      <div className="flex items-center gap-2 mb-2">
        <Eye className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-primary">Visual</span>
      </div>
      <div className="text-foreground/90 text-sm">
        <MathRenderer segments={createSegmentsFromSolution(content)} />
      </div>
    </motion.div>
  );
}

export default function InteractiveTheoryContent({ content }: InteractiveTheoryContentProps) {
  const sections = parseTheoryContent(content);

  // If no special markers found, render as regular content with better formatting
  if (sections.length <= 1 && sections[0]?.type === 'text') {
    return (
      <div className="space-y-4">
        {content.split('\n\n').map((paragraph, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 * idx }}
          >
            {renderParagraph(paragraph)}
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {sections.map((section, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * idx }}
        >
          {section.type === 'hook' && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-primary mt-0.5" />
                <div className="text-foreground leading-relaxed">
                  <MathRenderer segments={createSegmentsFromSolution(section.content)} />
                </div>
              </div>
            </div>
          )}

          {section.type === 'visual' && (
            <VisualBlock content={section.content} />
          )}

          {section.type === 'concept' && (
            <div className="text-foreground/90 leading-relaxed">
              <MathRenderer segments={createSegmentsFromSolution(section.content)} />
            </div>
          )}

          {section.type === 'try_it' && section.question && (
            <TryItSection 
              question={section.question}
              hint={section.content}
              answer={section.answer || ''}
            />
          )}

          {section.type === 'example_box' && (
            <div className="p-4 rounded-xl bg-card border-2 border-primary/30">
              <div className="flex items-center gap-2 mb-3">
                <BookMarked className="w-4 h-4 text-primary" />
                <span className="font-semibold text-primary text-sm">Worked Example</span>
              </div>
              <div className="font-mono text-sm text-foreground/90 whitespace-pre-wrap">
                <MathRenderer segments={createSegmentsFromSolution(section.content)} />
              </div>
            </div>
          )}

          {section.type === 'key_insight' && (
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">Key Insight</span>
                  <div className="text-foreground mt-1">
                    <MathRenderer segments={createSegmentsFromSolution(section.content)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {section.type === 'remember' && (
            <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 flex items-center gap-3">
              <span className="text-lg">📝</span>
              <div className="text-sm text-foreground/90">
                <MathRenderer segments={createSegmentsFromSolution(section.content)} />
              </div>
            </div>
          )}

          {section.type === 'text' && section.content && (
            <div className="text-foreground/90 leading-relaxed">
              {renderParagraph(section.content)}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// Helper to render paragraphs with special formatting
function renderParagraph(paragraph: string) {
  // Bold text in boxes
  if (paragraph.startsWith('**')) {
    return (
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
        <MathRenderer segments={createSegmentsFromSolution(paragraph.replace(/\*\*/g, ''))} />
      </div>
    );
  }
  
  // Numbered lists
  if (paragraph.match(/^\d\./)) {
    return (
      <div className="pl-4 border-l-2 border-primary/30">
        <MathRenderer segments={createSegmentsFromSolution(paragraph)} />
      </div>
    );
  }
  
  // Bullet points
  if (paragraph.startsWith('•') || paragraph.startsWith('-')) {
    const items = paragraph.split('\n').filter(line => line.trim());
    return (
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/50 mt-2 flex-shrink-0" />
            <span className="text-foreground/90">
              <MathRenderer segments={createSegmentsFromSolution(item.replace(/^[•\-]\s*/, ''))} />
            </span>
          </li>
        ))}
      </ul>
    );
  }

  // Code blocks (ASCII diagrams)
  if (paragraph.includes('```')) {
    return <VisualBlock content={paragraph} />;
  }

  // Regular paragraph
  return <MathRenderer segments={createSegmentsFromSolution(paragraph)} />;
}