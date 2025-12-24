import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MathRenderer from "@/components/MathRenderer";
import { X, Lightbulb, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MinimalExerciseViewProps {
  question: string;
  hints?: string[];
  onAnswer: (answer: string) => void;
  onDismiss: () => void;
}

export function MinimalExerciseView({
  question,
  hints = [],
  onAnswer,
  onDismiss,
}: MinimalExerciseViewProps) {
  const [answer, setAnswer] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);

  const handleSubmit = () => {
    if (!answer.trim()) return;
    onAnswer(answer.trim());
    setAnswer("");
  };

  const handleHint = () => {
    if (!showHint) {
      setShowHint(true);
    } else if (hintIndex < hints.length - 1) {
      setHintIndex((prev) => prev + 1);
    }
  };

  return (
    <motion.div
      layout
      className="bg-card rounded-2xl border border-border/50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
        <span className="text-sm font-medium text-muted-foreground">
          Practice Problem
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Question */}
      <div className="px-5 py-6">
        <div className="text-lg leading-relaxed">
          <MathRenderer latex={question} />
        </div>
      </div>

      {/* Hint */}
      <AnimatePresence>
        {showHint && hints.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 pb-4"
          >
            <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
              <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm">
                <MathRenderer latex={hints[hintIndex]} />
                {hintIndex < hints.length - 1 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {hints.length - hintIndex - 1} more hint
                    {hints.length - hintIndex - 1 > 1 ? "s" : ""} available
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Answer input */}
      <div className="px-5 pb-5">
        <div className="flex items-center gap-3">
          {hints.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleHint}
              className="shrink-0"
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              Hint
            </Button>
          )}

          <Input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Your answer..."
            className="flex-1 h-10"
          />

          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!answer.trim()}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
