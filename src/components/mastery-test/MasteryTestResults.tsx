import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, CheckCircle2, AlertCircle, TrendingUp, Clock, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import MathRenderer from "@/components/MathRenderer";
import type { MasteryTestResult, MasteryTestQuestion, MasteryTestAnswer, TheoryBlockScore } from "@/types/topicMasteryTest";
import { useNavigate } from "react-router-dom";

interface MasteryTestResultsProps {
  topicId: string;
  topicName: string;
  results: MasteryTestResult;
  questions: MasteryTestQuestion[];
  answers: MasteryTestAnswer[];
  onBackToPath: () => void;
}

export function MasteryTestResults({
  topicId,
  topicName,
  results,
  questions,
  answers,
  onBackToPath
}: MasteryTestResultsProps) {
  const navigate = useNavigate();

  const statusColors = {
    strong: 'text-green-600 dark:text-green-400',
    'needs-review': 'text-amber-600 dark:text-amber-400',
    weak: 'text-red-600 dark:text-red-400'
  };

  const statusBg = {
    strong: 'bg-green-100 dark:bg-green-900/30',
    'needs-review': 'bg-amber-100 dark:bg-amber-900/30',
    weak: 'bg-red-100 dark:bg-red-900/30'
  };

  const statusIcons = {
    strong: <CheckCircle2 className="w-4 h-4" />,
    'needs-review': <AlertCircle className="w-4 h-4" />,
    weak: <AlertCircle className="w-4 h-4" />
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBackToPath}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold">Review Complete</h1>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-3.5rem)]">
        <main className="container max-w-3xl py-8 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Summary Header */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Topic Review Complete</h2>
              <p className="text-muted-foreground">
                Here's an overview of your understanding of {topicName}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Target className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-2xl font-bold">{results.correctCount}/{results.totalQuestions}</div>
                  <div className="text-xs text-muted-foreground">Correct</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-2xl font-bold">{results.overallPercentage}%</div>
                  <div className="text-xs text-muted-foreground">Score</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-2xl font-bold">{results.timeSpentMinutes}</div>
                  <div className="text-xs text-muted-foreground">Minutes</div>
                </CardContent>
              </Card>
            </div>

            {/* Theory Block Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Understanding by Concept
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {results.theoryBlockScores.map((block) => (
                  <div
                    key={block.blockId}
                    className={`flex items-center justify-between p-3 rounded-lg ${statusBg[block.status]}`}
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-mono">
                        {block.blockNumber}
                      </Badge>
                      <div>
                        <div className="font-medium text-sm">{block.title}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {block.blockType}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-1 ${statusColors[block.status]}`}>
                        {statusIcons[block.status]}
                        <span className="font-medium">{block.correct}/{block.total}</span>
                      </div>
                      {block.status !== 'strong' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/theory/${topicId}#${block.blockNumber}`)}
                        >
                          Review
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Weak Areas */}
            {results.weakBlocks.length > 0 && (
              <Card className="border-amber-200 dark:border-amber-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <AlertCircle className="w-5 h-5" />
                    Areas to Revisit
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {results.weakBlocks.map((block) => (
                    <div key={block.blockId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono">
                          {block.blockNumber}
                        </Badge>
                        <span className="text-sm">{block.title}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/theory/${topicId}#${block.blockNumber}`)}
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Open Theory
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Subtopic Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance by Subtopic</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {results.subtopicBreakdown.map((subtopic) => {
                  const percentage = Math.round((subtopic.correct / subtopic.total) * 100);
                  return (
                    <div key={subtopic.subtopicId} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{subtopic.subtopicName}</span>
                        <span className="text-muted-foreground">
                          {subtopic.correct}/{subtopic.total}
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Question Review */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Question Review</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="space-y-2">
                  {questions.map((question, index) => {
                    const answer = answers.find(a => a.questionId === question.id);
                    const isCorrect = answer?.isCorrect;
                    
                    return (
                      <AccordionItem
                        key={question.id}
                        value={question.id}
                        className={`border rounded-lg px-4 ${
                          isCorrect 
                            ? 'border-green-200 dark:border-green-800' 
                            : 'border-red-200 dark:border-red-800'
                        }`}
                      >
                        <AccordionTrigger className="hover:no-underline py-4">
                          <div className="flex items-center gap-3 text-left">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              isCorrect 
                                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                                : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            </div>
                            <span className="text-sm">Question {index + 1}</span>
                            <Badge variant="outline" className="text-xs">
                              {question.difficulty}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-4 space-y-4">
                          {/* Question */}
                          <div className="p-4 rounded-lg bg-muted">
                            <MathRenderer latex={question.question} />
                          </div>
                          
                          {/* Answers */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground mb-1">Your answer:</div>
                              <div className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                                {answer?.userAnswer || '(no answer)'}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground mb-1">Correct answer:</div>
                              <div className="font-medium">{question.correctAnswer}</div>
                            </div>
                          </div>
                          
                          {/* Solution */}
                          <div className="border-t pt-4">
                            <div className="text-sm font-medium mb-2">Solution</div>
                            <div className="space-y-3">
                              {question.solution.map((step) => (
                                <div key={step.stepNumber} className="flex gap-3 text-sm">
                                  <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-xs font-medium">
                                    {step.stepNumber}
                                  </span>
                                  <div className="space-y-1">
                                    <div>{step.action}</div>
                                    {step.calculation && (
                                      <div className="p-2 rounded bg-muted">
                                        <MathRenderer latex={step.calculation} />
                                      </div>
                                    )}
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                      <BookOpen className="w-3 h-3" />
                                      {step.theoryCitation}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button variant="outline" className="flex-1" onClick={onBackToPath}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Learning Path
              </Button>
              <Button className="flex-1" onClick={() => navigate(`/theory/${topicId}`)}>
                <BookOpen className="w-4 h-4 mr-2" />
                Review Theory
              </Button>
            </div>
          </motion.div>
        </main>
      </ScrollArea>
    </div>
  );
}
