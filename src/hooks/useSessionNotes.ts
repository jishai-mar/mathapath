import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type NoteType = 'interest' | 'struggle' | 'breakthrough' | 'emotional' | 'learning_style';

interface SessionNote {
  note_type: NoteType;
  content: string;
  subtopic_name?: string;
}

export function useSessionNotes() {
  const { user } = useAuth();

  const saveNote = useCallback(async (note: SessionNote) => {
    if (!user) return;

    try {
      // Check if a similar note already exists to avoid duplicates
      const { data: existing } = await supabase
        .from('student_session_notes')
        .select('id')
        .eq('user_id', user.id)
        .eq('note_type', note.note_type)
        .eq('content', note.content)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log('Note already exists, skipping duplicate');
        return;
      }

      const { error } = await supabase
        .from('student_session_notes')
        .insert({
          user_id: user.id,
          note_type: note.note_type,
          content: note.content,
          subtopic_name: note.subtopic_name,
        });

      if (error) {
        console.error('Error saving session note:', error);
      } else {
        console.log(`Saved ${note.note_type} note:`, note.content);
      }
    } catch (err) {
      console.error('Error in saveNote:', err);
    }
  }, [user]);

  const saveInterest = useCallback((content: string) => {
    return saveNote({ note_type: 'interest', content });
  }, [saveNote]);

  const saveStruggle = useCallback((content: string, subtopicName?: string) => {
    return saveNote({ note_type: 'struggle', content, subtopic_name: subtopicName });
  }, [saveNote]);

  const saveBreakthrough = useCallback((content: string, subtopicName?: string) => {
    return saveNote({ note_type: 'breakthrough', content, subtopic_name: subtopicName });
  }, [saveNote]);

  const saveLearningStyle = useCallback((content: string) => {
    return saveNote({ note_type: 'learning_style', content });
  }, [saveNote]);

  const saveEmotionalNote = useCallback((content: string, subtopicName?: string) => {
    return saveNote({ note_type: 'emotional', content, subtopic_name: subtopicName });
  }, [saveNote]);

  // Analyze tutor response for things worth remembering
  const analyzeAndSaveFromResponse = useCallback(async (
    tutorResponse: string,
    studentMessage: string,
    subtopicName?: string
  ) => {
    if (!user) return;

    const lowerStudent = studentMessage.toLowerCase();
    const lowerTutor = tutorResponse.toLowerCase();

    // Detect breakthroughs from tutor praise
    const breakthroughIndicators = [
      'you got it',
      'exactly right',
      'perfect',
      'you nailed it',
      'you figured it out',
      'that\'s it',
      'you\'ve mastered',
      'breakthrough',
      'finally clicked',
    ];

    for (const indicator of breakthroughIndicators) {
      if (lowerTutor.includes(indicator)) {
        await saveBreakthrough(
          `Student demonstrated understanding of ${subtopicName || 'the concept'}`,
          subtopicName
        );
        break;
      }
    }

    // Detect struggles from student messages
    const struggleIndicators = [
      'i don\'t understand',
      'confused',
      'stuck',
      'don\'t get it',
      'help me',
      'can\'t figure',
    ];

    for (const indicator of struggleIndicators) {
      if (lowerStudent.includes(indicator)) {
        await saveStruggle(
          `Student expressed difficulty with ${subtopicName || 'the material'}`,
          subtopicName
        );
        break;
      }
    }

    // Detect personal interests from student messages
    const interestPatterns = [
      /i (?:love|like|enjoy|play|do) (\w+)/i,
      /my (?:favorite|hobby|interest) is (\w+)/i,
      /i'm a (\w+) player/i,
      /i have a (\w+) game/i,
    ];

    for (const pattern of interestPatterns) {
      const match = studentMessage.match(pattern);
      if (match) {
        await saveInterest(`Student mentioned interest in: ${match[1]}`);
        break;
      }
    }
  }, [user, saveBreakthrough, saveStruggle, saveInterest]);

  return {
    saveNote,
    saveInterest,
    saveStruggle,
    saveBreakthrough,
    saveLearningStyle,
    saveEmotionalNote,
    analyzeAndSaveFromResponse,
  };
}
