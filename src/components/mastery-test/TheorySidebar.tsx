import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, FileText, Lightbulb, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import MathRenderer from "@/components/MathRenderer";
import type { TheoryBlockForTest } from "@/types/topicMasteryTest";

interface TheorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  theoryBlocks: TheoryBlockForTest[];
  highlightedBlockNumbers?: string[];
}

export function TheorySidebar({
  isOpen,
  onClose,
  theoryBlocks,
  highlightedBlockNumbers = []
}: TheorySidebarProps) {
  // Group blocks by type
  const groupedBlocks = {
    definitions: theoryBlocks.filter(b => b.blockType === 'definition'),
    theorems: theoryBlocks.filter(b => ['theorem', 'property'].includes(b.blockType)),
    methods: theoryBlocks.filter(b => b.blockType === 'method'),
    visuals: theoryBlocks.filter(b => b.blockType === 'visual')
  };

  const blockTypeIcons: Record<string, React.ReactNode> = {
    definition: <FileText className="w-4 h-4" />,
    theorem: <Lightbulb className="w-4 h-4" />,
    property: <Lightbulb className="w-4 h-4" />,
    method: <Calculator className="w-4 h-4" />,
    visual: <BookOpen className="w-4 h-4" />
  };

  const isHighlighted = (blockNumber: string) => 
    highlightedBlockNumbers.includes(blockNumber);

  const renderBlock = (block: TheoryBlockForTest) => {
    const highlighted = isHighlighted(block.blockNumber);
    const content = block.content as any;

    return (
      <AccordionItem
        key={block.id}
        value={block.id}
        className={`border rounded-lg px-3 mb-2 ${
          highlighted 
            ? 'border-primary bg-primary/5' 
            : 'border-border'
        }`}
      >
        <AccordionTrigger className="text-sm py-3 hover:no-underline">
          <div className="flex items-center gap-2 text-left">
            <Badge variant={highlighted ? "default" : "outline"} className="text-xs">
              {block.blockNumber}
            </Badge>
            <span className={highlighted ? 'font-medium' : ''}>{block.title}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-4">
          <div className="space-y-3 text-sm">
            {/* Definition content */}
            {block.blockType === 'definition' && content && (
              <>
                {content.formalStatement && (
                  <div className="p-3 rounded-lg bg-muted">
                    <MathRenderer content={content.formalStatement} />
                  </div>
                )}
                {content.intuition && (
                  <p className="text-muted-foreground">{content.intuition}</p>
                )}
              </>
            )}
            
            {/* Theorem content */}
            {(block.blockType === 'theorem' || block.blockType === 'property') && content && (
              <>
                {content.formalStatement && (
                  <div className="p-3 rounded-lg bg-muted">
                    <MathRenderer content={content.formalStatement} />
                  </div>
                )}
                {content.intuition && (
                  <p className="text-muted-foreground">{content.intuition}</p>
                )}
              </>
            )}
            
            {/* Method content */}
            {block.blockType === 'method' && content && (
              <>
                {content.applicableWhen && (
                  <p className="text-muted-foreground">
                    <strong>Use when:</strong> {content.applicableWhen}
                  </p>
                )}
                {content.steps && Array.isArray(content.steps) && (
                  <ol className="space-y-2 ml-4">
                    {content.steps.map((step: any, i: number) => (
                      <li key={i} className="list-decimal">
                        <span className="font-medium">{step.action}</span>
                        {step.justifiedBy && (
                          <span className="text-muted-foreground text-xs ml-2">
                            ({step.justifiedBy})
                          </span>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </>
            )}
            
            {/* Fallback: show latex content or raw content */}
            {block.latexContent && !content && (
              <div className="p-3 rounded-lg bg-muted">
                <MathRenderer content={block.latexContent} />
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ x: 320 }}
          animate={{ x: 0 }}
          exit={{ x: 320 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed right-0 top-14 bottom-0 w-80 border-l bg-background z-40"
        >
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Theory Reference</h3>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="p-4 space-y-6">
              {highlightedBlockNumbers.length > 0 && (
                <div className="text-xs text-muted-foreground pb-2 border-b">
                  Blocks for current question are highlighted
                </div>
              )}
              
              {/* Definitions */}
              {groupedBlocks.definitions.length > 0 && (
                <section>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FileText className="w-3 h-3" />
                    Definitions
                  </h4>
                  <Accordion type="multiple" className="space-y-0">
                    {groupedBlocks.definitions.map(renderBlock)}
                  </Accordion>
                </section>
              )}
              
              {/* Theorems */}
              {groupedBlocks.theorems.length > 0 && (
                <section>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Lightbulb className="w-3 h-3" />
                    Theorems & Properties
                  </h4>
                  <Accordion type="multiple" className="space-y-0">
                    {groupedBlocks.theorems.map(renderBlock)}
                  </Accordion>
                </section>
              )}
              
              {/* Methods */}
              {groupedBlocks.methods.length > 0 && (
                <section>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Calculator className="w-3 h-3" />
                    Methods
                  </h4>
                  <Accordion type="multiple" className="space-y-0">
                    {groupedBlocks.methods.map(renderBlock)}
                  </Accordion>
                </section>
              )}
              
              {/* Empty state */}
              {theoryBlocks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No theory blocks available</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
