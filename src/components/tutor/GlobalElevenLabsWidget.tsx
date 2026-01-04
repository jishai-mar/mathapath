import { useEffect, useCallback } from 'react';
import { useExerciseContext } from '@/contexts/ExerciseContext';

interface GlobalElevenLabsWidgetProps {
  agentId?: string;
}

export function GlobalElevenLabsWidget({
  agentId = 'agent_4501kd82684tegmad70k26kqzs17',
}: GlobalElevenLabsWidgetProps) {
  const exerciseContext = useExerciseContext();

  // Build dynamic context for the agent
  const buildDynamicContext = useCallback(() => {
    if (!exerciseContext) {
      return {
        has_exercise: false,
        context_summary: 'The student is browsing the app but not working on a specific exercise.',
      };
    }

    const context = exerciseContext.getContextForTutor();
    
    return {
      has_exercise: !!exerciseContext.currentQuestion,
      current_question: exerciseContext.currentQuestion || '',
      subtopic_name: exerciseContext.subtopicName || '',
      topic_name: exerciseContext.topicName || '',
      difficulty: exerciseContext.difficulty || '',
      student_answer: exerciseContext.currentAnswer || '',
      correct_answer: exerciseContext.correctAnswer || '',
      attempts: exerciseContext.studentAttempts,
      hints: exerciseContext.hints?.join(' | ') || '',
      context_summary: context,
    };
  }, [exerciseContext]);

  useEffect(() => {
    // Check if widget already exists to prevent duplicates
    const existingWidget = document.querySelector('elevenlabs-convai');
    if (existingWidget) {
      return;
    }

    // Create and append the ElevenLabs widget element to body
    const widget = document.createElement('elevenlabs-convai');
    widget.setAttribute('agent-id', agentId);
    
    // Build the dynamic prompt override with exercise context
    const updateWidgetContext = () => {
      const context = buildDynamicContext();
      
      // Create a dynamic prompt that includes exercise context
      const dynamicPrompt = context.has_exercise
        ? `You are now helping a student with the following exercise:

CURRENT EXERCISE: ${context.current_question}
TOPIC: ${context.subtopic_name}
DIFFICULTY: ${context.difficulty}
${context.student_answer ? `STUDENT'S ANSWER: ${context.student_answer}` : ''}
${context.correct_answer ? `CORRECT ANSWER (don't reveal directly!): ${context.correct_answer}` : ''}
NUMBER OF ATTEMPTS: ${context.attempts}
${context.hints ? `AVAILABLE HINTS: ${context.hints}` : ''}

IMPORTANT:
- First ask what the student has already tried and where they're stuck
- Do NOT give the answer directly, help them discover it themselves
- If they've made multiple mistakes, give more direct help
- Be patient, friendly and encouraging
- Explain concepts in simple language
- When explaining math formulas, say them clearly (e.g., "x squared plus 2x equals 5")`
        : `The student is browsing the app but not working on a specific exercise.
Help them with general math questions or direct them to start a practice session.`;

      // Set the override-config attribute with dynamic context
      const overrideConfig = {
        agent: {
          prompt: {
            prompt: dynamicPrompt,
          },
          firstMessage: context.has_exercise
            ? `Hi! I see you're working on an exercise about ${context.subtopic_name}. How can I help you?`
            : "Hello! I'm your math tutor. How can I help you today?",
        },
      };

      widget.setAttribute('override-config', JSON.stringify(overrideConfig));
    };

    updateWidgetContext();
    document.body.appendChild(widget);

    // Set up an interval to update context periodically
    const intervalId = setInterval(updateWidgetContext, 5000);

    // Listen for custom events from the app to update context
    const handleContextUpdate = () => {
      updateWidgetContext();
    };
    window.addEventListener('exercise-context-updated', handleContextUpdate);

    return () => {
      // Cleanup on unmount
      clearInterval(intervalId);
      window.removeEventListener('exercise-context-updated', handleContextUpdate);
      const widget = document.querySelector('elevenlabs-convai');
      if (widget) {
        widget.remove();
      }
    };
  }, [agentId, buildDynamicContext]);

  // Trigger context update when exercise context changes
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('exercise-context-updated'));
  }, [
    exerciseContext?.currentQuestion,
    exerciseContext?.currentAnswer,
    exerciseContext?.subtopicName,
  ]);

  // This component doesn't render anything visible - the widget floats on the page
  return null;
}
