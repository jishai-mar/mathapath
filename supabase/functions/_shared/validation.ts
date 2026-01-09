import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

// ============================================
// COMMON VALIDATION SCHEMAS
// ============================================

// UUID validation
export const uuidSchema = z.string().uuid({ message: "Invalid UUID format" });

// User ID (always a UUID)
export const userIdSchema = z.string().uuid({ message: "Invalid user ID format" });

// Short strings (names, titles, etc.)
export const shortStringSchema = z.string()
  .min(1, { message: "String cannot be empty" })
  .max(255, { message: "String must be less than 255 characters" });

// Medium text (descriptions, messages)
export const mediumTextSchema = z.string()
  .max(2000, { message: "Text must be less than 2000 characters" });

// Long text (theory content, explanations)
export const longTextSchema = z.string()
  .max(10000, { message: "Text must be less than 10000 characters" });

// Very long text (for AI responses, full content)
export const veryLongTextSchema = z.string()
  .max(50000, { message: "Text must be less than 50000 characters" });

// Difficulty level
export const difficultySchema = z.enum(["easy", "medium", "hard"], {
  errorMap: () => ({ message: "Difficulty must be 'easy', 'medium', or 'hard'" })
});

// Positive integer (counts, scores)
export const positiveIntSchema = z.number()
  .int({ message: "Must be an integer" })
  .min(0, { message: "Must be non-negative" });

// Positive integer with max (for things like hints used)
export const smallPositiveIntSchema = z.number()
  .int({ message: "Must be an integer" })
  .min(0, { message: "Must be non-negative" })
  .max(100, { message: "Value too large" });

// Time spent in seconds
export const timeSpentSecondsSchema = z.number()
  .int({ message: "Must be an integer" })
  .min(0, { message: "Must be non-negative" })
  .max(86400, { message: "Time cannot exceed 24 hours" }); // Max 24 hours

// Boolean
export const booleanSchema = z.boolean();

// Optional string that can be null or undefined
export const optionalStringSchema = z.string().max(5000).optional().nullable();

// Base64 encoded image data (for image uploads)
export const base64ImageSchema = z.string()
  .max(10_000_000, { message: "Image data too large (max 10MB)" })
  .optional();

// ============================================
// CONVERSATION HISTORY
// ============================================

export const messageRoleSchema = z.enum(["user", "assistant", "system"]);

export const conversationMessageSchema = z.object({
  role: messageRoleSchema,
  content: z.string().max(20000, { message: "Message too long" })
});

export const conversationHistorySchema = z.array(conversationMessageSchema)
  .max(100, { message: "Conversation history too long" });

// ============================================
// PERSONALITY AND EMOTIONAL STATE
// ============================================

export const personalitySchema = z.enum(["patient", "encouraging", "challenging", "humorous"]).optional();
export const emotionalStateSchema = z.enum(["neutral", "engaged", "struggling", "frustrated", "confident", "anxious"]).optional();
export const sessionPhaseSchema = z.enum(["greeting", "goal-setting", "learning", "wrap-up"]).optional();
export const tutoringModeSchema = z.enum(["hint", "solution", "quick-check"]).optional();

// ============================================
// SPECIFIC ENDPOINT SCHEMAS
// ============================================

// Check exercise answer
export const checkExerciseAnswerSchema = z.object({
  exerciseId: uuidSchema,
  userAnswer: z.string().max(1000, { message: "Answer too long" }).optional().nullable(),
  userId: uuidSchema.optional(),
  hintsUsed: smallPositiveIntSchema.optional().default(0),
  timeSpentSeconds: timeSpentSecondsSchema.optional(),
  currentSubLevel: z.string().max(50).optional(),
  subtopicName: shortStringSchema.optional()
});

// Generate exercise
export const generateExerciseSchema = z.object({
  subtopicId: uuidSchema,
  difficulty: difficultySchema,
  existingExercises: z.array(z.object({
    question: z.string().max(2000)
  })).max(20).optional(),
  userId: uuidSchema.optional(),
  performanceData: z.any().optional(),
  subLevel: z.string().max(50).optional()
});

// Ask tutor
export const askTutorSchema = z.object({
  question: z.string().max(5000, { message: "Question too long" }).default(""),
  subtopicName: shortStringSchema.default("General"),
  theoryContext: longTextSchema.optional().default(""),
  conversationHistory: conversationHistorySchema.optional().default([]),
  tutorName: z.string().max(50).optional().default("Alex"),
  personality: personalitySchema.optional().default("patient"),
  sessionPhase: sessionPhaseSchema.optional().default("learning"),
  sessionGoal: mediumTextSchema.optional(),
  studentName: z.string().max(100).optional(),
  detectedEmotionalState: emotionalStateSchema.optional().default("neutral"),
  userId: uuidSchema.optional(),
  tutoringMode: tutoringModeSchema.optional().default("hint"),
  imageData: base64ImageSchema.optional()
});

// Generate theory content
export const generateTheoryContentSchema = z.object({
  subtopicId: uuidSchema.optional(),
  subtopicName: shortStringSchema,
  topicName: shortStringSchema.optional()
});

// Generate diagnostic
export const generateDiagnosticSchema = z.object({
  topicId: uuidSchema,
  userId: uuidSchema
});

// Analyze diagnostic
export const analyzeDiagnosticSchema = z.object({
  diagnosticTestId: uuidSchema,
  userId: uuidSchema.optional()
});

// Generate practice exam
export const generatePracticeExamSchema = z.object({
  topicId: uuidSchema.optional(),
  subtopicId: uuidSchema.optional(),
  difficulty: difficultySchema.optional(),
  questionCount: z.number().int().min(1).max(50).optional().default(10),
  userId: uuidSchema.optional()
});

// Grade exam answer
export const gradeExamAnswerSchema = z.object({
  questionId: z.string().max(100),
  userAnswer: z.string().max(2000),
  correctAnswer: z.string().max(2000),
  question: z.string().max(5000),
  subtopicName: shortStringSchema.optional()
});

// Generate topic exam
export const generateTopicExamSchema = z.object({
  topicId: uuidSchema,
  userId: uuidSchema.optional(),
  questionCount: z.number().int().min(5).max(30).optional().default(12)
});

// Generate topic mastery test
export const generateTopicMasteryTestSchema = z.object({
  topicId: uuidSchema,
  userId: uuidSchema.optional()
});

// Grade mastery test
export const gradeMasteryTestSchema = z.object({
  testId: uuidSchema,
  answers: z.record(z.string().max(2000)),
  userId: uuidSchema.optional()
});

// Analyze handwritten work
export const analyzeHandwrittenWorkSchema = z.object({
  imageData: z.string().max(10_000_000, { message: "Image too large" }),
  subtopicName: shortStringSchema.optional(),
  exerciseContext: mediumTextSchema.optional()
});

// Analyze general work
export const analyzeGeneralWorkSchema = z.object({
  imageData: z.string().max(10_000_000, { message: "Image too large" }),
  question: mediumTextSchema.optional(),
  context: mediumTextSchema.optional()
});

// Notebook tutor
export const notebookTutorSchema = z.object({
  question: z.string().max(5000),
  notebookContext: z.array(z.object({
    id: z.string(),
    content: z.string().max(5000),
    note_type: z.string().max(50),
    subtopic_name: z.string().max(255).optional().nullable()
  })).max(50).optional(),
  conversationHistory: conversationHistorySchema.optional().default([]),
  userId: uuidSchema.optional()
});

// Solve exercise
export const solveExerciseSchema = z.object({
  exerciseId: uuidSchema.optional(),
  question: z.string().max(5000),
  correctAnswer: z.string().max(2000).optional(),
  subtopicName: shortStringSchema.optional(),
  userId: uuidSchema.optional()
});

// Generate exercise details
export const generateExerciseDetailsSchema = z.object({
  exerciseId: uuidSchema,
  includeHints: booleanSchema.optional().default(true),
  includeExplanation: booleanSchema.optional().default(true)
});

// Session greeting/wrapup
export const sessionContextSchema = z.object({
  userId: uuidSchema,
  studentName: z.string().max(100).optional(),
  tutorName: z.string().max(50).optional().default("Alex"),
  personality: personalitySchema.optional().default("patient")
});

// Generate session summary
export const generateSessionSummarySchema = z.object({
  sessionId: uuidSchema,
  userId: uuidSchema.optional()
});

// Generate learning path
export const generateLearningPathSchema = z.object({
  userId: uuidSchema,
  goalId: uuidSchema.optional(),
  topicsToMaster: z.array(uuidSchema).max(20).optional(),
  targetDate: z.string().max(50).optional()
});

// Update learning path
export const updateLearningPathSchema = z.object({
  userId: uuidSchema,
  nodeId: uuidSchema,
  status: z.enum(["pending", "in_progress", "completed", "skipped"]).optional(),
  completed: booleanSchema.optional()
});

// Generate practice plan
export const generatePracticePlanSchema = z.object({
  userId: uuidSchema,
  topicId: uuidSchema.optional(),
  durationMinutes: z.number().int().min(5).max(180).optional().default(30)
});

// Generate daily insights
export const generateDailyInsightsSchema = z.object({
  userId: uuidSchema
});

// Check diagnostic answer
export const checkDiagnosticAnswerSchema = z.object({
  questionId: uuidSchema,
  userAnswer: z.string().max(2000),
  correctAnswer: z.string().max(2000),
  userId: uuidSchema.optional()
});

// Exponential tutor
export const exponentialTutorSchema = z.object({
  messages: conversationHistorySchema,
  currentNode: z.object({
    id: z.string().max(100),
    title: z.string().max(255),
    type: z.string().max(50)
  }).optional(),
  studentContext: z.object({
    masteryLevel: z.number().min(0).max(100).optional(),
    recentPerformance: z.string().max(1000).optional()
  }).optional(),
  userId: uuidSchema.optional()
});

// Generate conversational theory
export const generateConversationalTheorySchema = z.object({
  subtopicId: uuidSchema.optional(),
  subtopicName: shortStringSchema,
  currentStep: positiveIntSchema.optional(),
  studentResponses: z.array(z.string().max(2000)).max(50).optional()
});

// Generate test yourself
export const generateTestYourselfSchema = z.object({
  topicId: uuidSchema.optional(),
  subtopicIds: z.array(uuidSchema).max(20).optional(),
  questionCount: z.number().int().min(1).max(20).optional().default(5),
  difficulty: difficultySchema.optional()
});

// Generate theory blocks
export const generateTheoryBlocksSchema = z.object({
  topicId: uuidSchema,
  subtopicId: uuidSchema.optional(),
  blockTypes: z.array(z.string().max(50)).max(10).optional()
});

// Generate theory media
export const generateTheoryMediaSchema = z.object({
  theoryBlockId: uuidSchema,
  mediaType: z.enum(["audio", "video", "diagram"]).optional()
});

// Analyze practice exam
export const analyzePracticeExamSchema = z.object({
  examId: uuidSchema.optional(),
  answers: z.record(z.string().max(2000)),
  questions: z.array(z.object({
    id: z.string().max(100),
    question: z.string().max(5000),
    correctAnswer: z.string().max(2000)
  })).max(50),
  userId: uuidSchema.optional()
});

// TTS request - full schema
export const tutorTtsFullSchema = z.object({
  text: z.string().min(1, { message: "Text is required" }).max(5000, { message: "Text too long for TTS" }),
  voiceId: z.string().max(100).optional(),
  personality: z.enum(["patient", "encouraging", "strict", "friendly"]).optional(),
  context: z.enum(["explaining", "encouraging", "correcting", "celebrating", "thinking", "default"]).optional(),
  stream: z.boolean().optional()
});

// STT token request (minimal)
export const tutorSttTokenSchema = z.object({
  sessionId: z.string().max(100).optional()
});

// Music/SFX request
export const tutorMediaSchema = z.object({
  type: z.string().max(50).optional(),
  mood: z.string().max(50).optional(),
  action: z.string().max(50).optional()
});

// Notebook tutor schema
export const notebookTutorFullSchema = z.object({
  message: z.string().max(5000, { message: "Message too long" }),
  selectedEntry: z.object({
    id: z.string().max(100).optional(),
    note_type: z.string().max(50),
    content: z.string().max(5000),
    subtopic_name: z.string().max(255).optional().nullable()
  }).optional().nullable(),
  allEntries: z.array(z.object({
    id: z.string().max(100).optional(),
    note_type: z.string().max(50),
    content: z.string().max(5000),
    subtopic_name: z.string().max(255).optional().nullable()
  })).max(100).optional(),
  conversationHistory: conversationHistorySchema.optional().default([])
});

// Solve exercise schema
export const solveExerciseFullSchema = z.object({
  question: z.string().min(1, { message: "Question is required" }).max(5000),
  subtopicName: shortStringSchema.optional(),
  correctAnswer: z.string().max(2000).optional(),
  exerciseId: uuidSchema.optional(),
  diagnosticQuestionId: uuidSchema.optional()
});

// ElevenLabs conversation token
export const elevenlabsConversationTokenSchema = z.object({
  agentId: z.string().max(100).optional(),
  mode: z.enum(["token", "signed_url"]).optional()
});

// Generate comprehensive diagnostic
export const generateComprehensiveDiagnosticSchema = z.object({
  userId: uuidSchema,
  topicIds: z.array(uuidSchema).max(20).optional()
});

// Analyze comprehensive diagnostic
export const analyzeComprehensiveDiagnosticSchema = z.object({
  diagnosticId: uuidSchema,
  answers: z.record(z.string().max(2000)),
  userId: uuidSchema.optional()
});

// Generate prerequisite check
export const generatePrerequisiteCheckSchema = z.object({
  prerequisites: z.array(z.object({
    id: uuidSchema,
    name: z.string().max(255)
  })).max(20),
  targetTopicName: z.string().min(1).max(255)
});

// Tutor STT (speech-to-text) request
export const tutorSttSchema = z.object({
  audio: z.string().max(20_000_000, { message: "Audio data too large (max ~15MB base64)" })
});

// Tutor SFX request
export const tutorSfxSchema = z.object({
  type: z.string().max(50).optional(),
  customPrompt: z.string().max(500).optional(),
  duration: z.number().min(0.5).max(10).optional()
});

// Tutor music request
export const tutorMusicSchema = z.object({
  type: z.string().max(50).optional(),
  customPrompt: z.string().max(500).optional(),
  duration: z.number().min(5).max(120).optional()
});

// Session greeting request
export const sessionGreetingSchema = z.object({
  studentName: z.string().max(100).optional(),
  tutorName: z.string().max(50).optional().default("Alex"),
  personality: z.enum(["patient", "encouraging", "challenging", "humorous"]).optional().default("patient"),
  currentStreak: z.number().int().min(0).max(10000).optional().default(0),
  totalXp: z.number().int().min(0).optional().default(0),
  recentAchievements: z.array(z.string().max(255)).max(10).optional().default([]),
  weakestSubtopic: z.string().max(255).optional(),
  lastSessionMood: z.string().max(50).optional(),
  userId: uuidSchema.optional(),
  subtopicName: z.string().max(255).optional(),
  exerciseGoal: z.number().int().min(1).max(100).optional()
});

// Session summary request
export const sessionSummarySchema = z.object({
  userId: uuidSchema.optional(),
  subtopicId: uuidSchema.optional(),
  subtopicName: z.string().max(255).optional(),
  topicName: z.string().max(255).optional(),
  correctAnswers: z.number().int().min(0).default(0),
  totalQuestions: z.number().int().min(0).default(0),
  timeSpentSeconds: z.number().min(0).default(0),
  difficultiesAttempted: z.array(z.string().max(50)).max(10).optional()
});

// Session wrapup request
export const sessionWrapupSchema = z.object({
  studentName: z.string().max(100).optional(),
  tutorName: z.string().max(50).default("Alex"),
  personality: z.enum(["patient", "encouraging", "challenging", "humorous"]).default("patient"),
  sessionGoal: z.string().max(500).optional(),
  progress: z.object({
    topicsCovered: z.array(z.string().max(255)).max(20).default([]),
    problemsSolved: z.number().int().min(0).default(0),
    hintsUsed: z.number().int().min(0).default(0),
    correctAnswers: z.number().int().min(0).default(0),
    totalAttempts: z.number().int().min(0).default(0)
  }),
  sessionDurationMinutes: z.number().min(0).max(600).default(0),
  keyBreakthroughs: z.array(z.string().max(500)).max(10).optional().default([]),
  struggles: z.array(z.string().max(500)).max(10).optional().default([])
});

// Check diagnostic answer request
export const checkDiagnosticAnswerFullSchema = z.object({
  questionId: uuidSchema,
  userAnswer: z.string().max(2000).optional().nullable(),
  userId: uuidSchema
});

// Exponential tutor request
export const exponentialTutorFullSchema = z.object({
  action: z.enum(['generate-problem', 'check-answer', 'get-hint', 'explain-solution', 'generate-exam', 'assess-readiness']),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  topic: z.string().max(255).optional(),
  problem: z.string().max(2000).optional(),
  studentAnswer: z.string().max(1000).optional(),
  learningStyle: z.enum(['formal', 'intuitive']).optional().default('formal'),
  conversationHistory: conversationHistorySchema.optional().default([]),
  examAnswers: z.array(z.object({
    questionId: z.string().max(100),
    answer: z.string().max(1000),
    correct: z.boolean(),
    difficulty: z.string().max(50)
  })).max(20).optional()
});

// Generate practice plan request (detailed)
export const generatePracticePlanFullSchema = z.object({
  subtopicId: uuidSchema.optional(),
  subtopicName: z.string().max(255).optional(),
  topicName: z.string().max(255).optional(),
  userId: uuidSchema.optional()
});

// Update learning path request (detailed)
export const updateLearningPathFullSchema = z.object({
  userId: uuidSchema,
  performanceData: z.union([
    z.array(z.object({
      topicId: uuidSchema,
      score: z.number().min(0).max(100),
      weakSubtopics: z.array(uuidSchema).max(50).optional()
    })).max(50),
    z.object({
      topicId: uuidSchema,
      score: z.number().min(0).max(100),
      weakSubtopics: z.array(uuidSchema).max(50).optional()
    })
  ]),
  source: z.string().max(100).optional()
});

// Grade mastery test request
export const gradeMasteryTestFullSchema = z.object({
  testId: uuidSchema.optional(),
  topicId: uuidSchema,
  questions: z.array(z.object({
    id: z.string().max(100),
    correctAnswer: z.string().max(2000),
    subtopicId: uuidSchema.optional(),
    subtopicName: z.string().max(255).optional(),
    conceptsTested: z.array(z.string().max(100)).max(20).optional(),
    primaryMethodBlockId: uuidSchema.optional(),
    primaryMethodBlockNumber: z.string().max(50).optional(),
    supportingTheoremIds: z.array(uuidSchema).max(10).optional(),
    definitionIds: z.array(uuidSchema).max(10).optional()
  })).max(50),
  answers: z.array(z.object({
    questionId: z.string().max(100),
    userAnswer: z.string().max(2000),
    timeSpentSeconds: z.number().min(0).optional()
  })).max(50),
  timeSpentMinutes: z.number().min(0).max(600).optional()
});

// Grade exam answer request
export const gradeExamAnswerFullSchema = z.object({
  questions: z.array(z.object({
    id: z.string().max(100),
    questionNumber: z.number().int().min(1).optional(),
    difficulty: z.string().max(50).optional(),
    points: z.number().min(0).optional(),
    subtopicName: z.string().max(255).optional(),
    context: z.string().max(2000).optional(),
    parts: z.array(z.object({
      partLabel: z.string().max(10),
      question: z.string().max(5000),
      points: z.number().min(0),
      solution: z.string().max(5000).optional(),
      answer: z.string().max(2000)
    })).max(20)
  })).max(50),
  userAnswers: z.array(z.object({
    questionId: z.string().max(100),
    partLabel: z.string().max(10),
    answer: z.string().max(2000)
  })).max(200),
  userId: uuidSchema.optional(),
  topicId: uuidSchema.optional()
});

// ============================================
// VALIDATION HELPER
// ============================================

/**
 * Validates request body against a schema and returns parsed data or error response
 */
export function validateRequestBody<T>(
  body: unknown,
  schema: z.ZodSchema<T>,
  corsHeaders: Record<string, string>
): { success: true; data: T } | { success: false; response: Response } {
  const result = schema.safeParse(body);
  
  if (!result.success) {
    const errorDetails = result.error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message
    }));
    
    console.error("Validation error:", JSON.stringify(errorDetails));
    
    return {
      success: false,
      response: new Response(
        JSON.stringify({ 
          error: "Invalid input",
          details: errorDetails 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    };
  }
  
  return { success: true, data: result.data };
}

/**
 * Safe JSON parse with validation
 */
export async function parseAndValidate<T>(
  req: Request,
  schema: z.ZodSchema<T>,
  corsHeaders: Record<string, string>
): Promise<{ success: true; data: T } | { success: false; response: Response }> {
  try {
    const body = await req.json();
    return validateRequestBody(body, schema, corsHeaders);
  } catch (error) {
    console.error("JSON parse error:", error);
    return {
      success: false,
      response: new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    };
  }
}
