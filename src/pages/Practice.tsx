import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, BookOpen, Play } from 'lucide-react';
import { toast } from 'sonner';
import { GuidedTutoringSession } from '@/components/session/GuidedTutoringSession';
import TutorCharacter from '@/components/tutor/TutorCharacter';

interface Topic {
  id: string;
  name: string;
  description: string | null;
}

interface Subtopic {
  id: string;
  name: string;
  order_index: number;
}

export default function Practice() {
  const { topicId } = useParams<{ topicId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [topic, setTopic] = useState<Topic | null>(null);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubtopic, setSelectedSubtopic] = useState<Subtopic | null>(null);
  const [isInSession, setIsInSession] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && topicId) {
      loadTopic();
    }
  }, [user, topicId]);

  const loadTopic = async () => {
    try {
      const { data: topicData, error: topicError } = await supabase
        .from('topics')
        .select('*')
        .eq('id', topicId)
        .single();
      
      if (topicError) throw topicError;
      setTopic(topicData);

      const { data: subtopicsData, error: subtopicsError } = await supabase
        .from('subtopics')
        .select('id, name, order_index')
        .eq('topic_id', topicId)
        .order('order_index');
      
      if (subtopicsError) throw subtopicsError;
      setSubtopics(subtopicsData || []);

      // Auto-select first subtopic and start session
      if (subtopicsData && subtopicsData.length > 0) {
        setSelectedSubtopic(subtopicsData[0]);
      }
    } catch (error) {
      console.error('Error loading topic:', error);
      toast.error('Could not load topic.');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const startSession = () => {
    if (selectedSubtopic) {
      setIsInSession(true);
    }
  };

  const endSession = () => {
    setIsInSession(false);
  };

  // If in guided session, show that
  if (isInSession && selectedSubtopic) {
    return (
      <GuidedTutoringSession
        subtopicId={selectedSubtopic.id}
        subtopicName={selectedSubtopic.name}
        onEndSession={endSession}
      />
    );
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-warm">
      {/* Header */}
      <header className="p-4 border-b border-border/20">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-8"
        >
          {/* Tutor */}
          <TutorCharacter mood="idle" size="lg" />

          {/* Topic Info */}
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">{topic?.name}</h1>
          <p className="text-muted-foreground">
              {topic?.description || "Let's practice together!"}
            </p>
          </div>

          {/* Subtopic Selection */}
          {subtopics.length > 1 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Choose a subtopic:</p>
              <div className="grid gap-2">
                {subtopics.map((subtopic) => (
                  <button
                    key={subtopic.id}
                    onClick={() => setSelectedSubtopic(subtopic)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      selectedSubtopic?.id === subtopic.id
                        ? 'bg-primary/10 border-primary/50'
                        : 'bg-card/50 border-border/30 hover:border-border/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-4 h-4 text-muted-foreground" />
                      <span>{subtopic.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Start Button */}
          <Button
            onClick={startSession}
            size="lg"
            disabled={!selectedSubtopic}
            className="w-full h-14 text-lg gap-3 rounded-2xl"
          >
            <Play className="w-5 h-5" />
            Start Session
          </Button>

          <p className="text-xs text-muted-foreground/70">
            Your tutor will guide you through 5 exercises
          </p>
        </motion.div>
      </main>
    </div>
  );
}
