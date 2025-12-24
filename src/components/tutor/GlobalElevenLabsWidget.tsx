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
        context_summary: 'De student bekijkt de app maar werkt niet aan een specifieke opgave.',
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
        ? `Je helpt nu een student met de volgende opgave:

HUIDIGE OPGAVE: ${context.current_question}
ONDERWERP: ${context.subtopic_name}
MOEILIJKHEID: ${context.difficulty}
${context.student_answer ? `STUDENT'S ANTWOORD: ${context.student_answer}` : ''}
${context.correct_answer ? `CORRECT ANTWOORD (niet direct vertellen!): ${context.correct_answer}` : ''}
AANTAL POGINGEN: ${context.attempts}
${context.hints ? `BESCHIKBARE HINTS: ${context.hints}` : ''}

BELANGRIJK:
- Vraag eerst wat de student al heeft geprobeerd en waar ze vastlopen
- Geef NIET direct het antwoord, help ze om het zelf te ontdekken
- Als ze meerdere keren fout hebben, geef dan meer directe hulp
- Wees geduldig, vriendelijk en moedigend aan
- Leg concepten uit in eenvoudige taal
- Als je wiskundige formules uitlegt, zeg ze duidelijk voor (bijv. "x kwadraat plus 2x is gelijk aan 5")`
        : `De student bekijkt de app maar werkt niet aan een specifieke opgave.
Help ze met algemene wiskundevragen of verwijs ze naar het starten van een oefensessie.`;

      // Set the override-config attribute with dynamic context
      const overrideConfig = {
        agent: {
          prompt: {
            prompt: dynamicPrompt,
          },
          firstMessage: context.has_exercise
            ? `Hoi! Ik zie dat je werkt aan een opgave over ${context.subtopic_name}. Waar kan ik je mee helpen?`
            : 'Hallo! Ik ben je wiskunde tutor. Hoe kan ik je vandaag helpen?',
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
