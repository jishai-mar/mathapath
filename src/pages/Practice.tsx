import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, BookOpen, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

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
      // Load topic
      const { data: topicData, error: topicError } = await supabase
        .from('topics')
        .select('*')
        .eq('id', topicId)
        .single();
      
      if (topicError) throw topicError;
      setTopic(topicData);

      // Load subtopics
      const { data: subtopicsData, error: subtopicsError } = await supabase
        .from('subtopics')
        .select('*')
        .eq('topic_id', topicId)
        .order('order_index');
      
      if (subtopicsError) throw subtopicsError;
      setSubtopics(subtopicsData || []);
    } catch (error) {
      console.error('Error loading topic:', error);
      toast.error('Failed to load topic. Please try again.');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-24 w-full" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Topics
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Topic header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 gradient-text">
            {topic?.name}
          </h1>
          {topic?.description && (
            <p className="text-muted-foreground">{topic.description}</p>
          )}
        </div>

        {/* Subtopics */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Subtopics</h2>
          </div>
          
          {subtopics.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Exercises coming soon! We're preparing content for this topic.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {subtopics.map((subtopic, index) => (
                <Card 
                  key={subtopic.id}
                  className="border-border/50 hover:border-primary/30 transition-colors cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => toast.info('Exercise practice coming in the next update!')}
                >
                  <CardHeader className="py-4">
                    <CardTitle className="text-base font-medium flex items-center justify-between">
                      <span>{subtopic.name}</span>
                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                        0 exercises
                      </span>
                    </CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
