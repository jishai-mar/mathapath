import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Sparkles } from "lucide-react";
import MathRenderer from "@/components/MathRenderer";
import type { MasteryTestQuestion as QuestionType } from "@/types/topicMasteryTest";

interface MasteryTestQuestionProps {
  question: QuestionType;
  answer: string;
  onAnswerChange: (answer: string) => void;
  questionNumber: number;
  totalQuestions: number;
  onOpenTheory: () => void;
}

export function MasteryTestQuestion({
  question,
  answer,
  onAnswerChange,
  questionNumber,
  totalQuestions,
  onOpenTheory
}: MasteryTestQuestionProps) {
  const difficultyColors = {
    easy: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    hard: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="border-2">
        <CardContent className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Question {questionNumber}
                </span>
                <Badge variant="outline" className={difficultyColors[question.difficulty]}>
                  {question.difficulty}
                </Badge>
                {question.isCombinationQuestion && (
                  <Badge variant="outline" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Combined concepts
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {question.subtopicName}
              </p>
            </div>
          </div>
          
          {/* Concepts Tested */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Required theory:</span>
            {question.conceptsTested.map(concept => (
              <Badge 
                key={concept} 
                variant="secondary" 
                className="text-xs cursor-pointer hover:bg-secondary/80"
                onClick={onOpenTheory}
              >
                <BookOpen className="w-3 h-3 mr-1" />
                {concept}
              </Badge>
            ))}
          </div>
          
          {/* Question */}
          <div className="py-4 px-6 rounded-xl bg-muted/50">
            <MathRenderer latex={question.question} />
          </div>
          
          {/* Answer Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Answer</label>
            <Input
              value={answer}
              onChange={(e) => onAnswerChange(e.target.value)}
              placeholder="Enter your answer..."
              className="text-lg h-12"
            />
            <p className="text-xs text-muted-foreground">
              Use standard notation. For fractions use a/b, for exponents use ^
            </p>
          </div>
          
          {/* Theory Reference Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenTheory}
            className="text-muted-foreground"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Open Theory Reference
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
