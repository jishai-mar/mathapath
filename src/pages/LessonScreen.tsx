import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import LearnView from '@/components/LearnView';
import { Skeleton } from '@/components/ui/skeleton';

interface SubtopicData {
  id: string;
  name: string;
  theory_explanation: string | null;
  worked_examples: any[];
}

interface TopicData {
  id: string;
  name: string;
}

export default function LessonScreen() {
  const { topicId, lessonId } = useParams<{ topicId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [topic, setTopic] = useState<TopicData | null>(null);
  const [lesson, setLesson] = useState<SubtopicData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (topicId && lessonId) {
      loadLessonData();
    }
  }, [topicId, lessonId]);

  const loadLessonData = async () => {
    setIsLoading(true);
    try {
      // Fetch topic
      const { data: topicData } = await supabase
        .from('topics')
        .select('id, name')
        .eq('id', topicId)
        .single();
      
      if (topicData) setTopic(topicData);

      // Fetch subtopic (lesson)
      const { data: subtopicData } = await supabase
        .from('subtopics')
        .select('id, name, theory_explanation, worked_examples')
        .eq('id', lessonId)
        .single();
      
      if (subtopicData) {
        setLesson({
          ...subtopicData,
          worked_examples: Array.isArray(subtopicData.worked_examples) 
            ? subtopicData.worked_examples 
            : []
        });
      }
    } catch (error) {
      console.error('Error loading lesson:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartPractice = () => {
    if (lessonId) {
      navigate(`/practice-question/${lessonId}`);
    }
  };

  const handleBack = () => {
    if (topicId) {
      navigate(`/learning-path/${topicId}`);
    } else {
      navigate('/');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Lesson not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <LearnView
        subtopicName={lesson.name}
        topicName={topic?.name}
        theoryExplanation={lesson.theory_explanation}
        workedExamples={lesson.worked_examples}
        onStartPractice={handleStartPractice}
        onBack={handleBack}
      />
    </div>
  );
}
