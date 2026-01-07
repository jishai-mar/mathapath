import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Target,
  ChevronRight,
  X,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { differenceInDays, differenceInHours, format } from 'date-fns';

interface Notification {
  id: string;
  type: 'behind' | 'ahead' | 'gap' | 'milestone' | 'refresh';
  title: string;
  message: string;
  action?: {
    label: string;
    route: string;
  };
  priority: 'low' | 'medium' | 'high';
}

export function LearningNotifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      checkLearningStatus();
    }
  }, [user]);

  const checkLearningStatus = async () => {
    if (!user) return;
    
    const newNotifications: Notification[] = [];
    
    try {
      // Check learning path status
      const { data: pathNodes } = await supabase
        .from('learning_path_nodes')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_date', { ascending: true });
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('last_practice_date, target_mastery_date')
        .eq('id', user.id)
        .single();
      
      const { data: sessions } = await supabase
        .from('learning_sessions')
        .select('started_at')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(1);
      
      const today = new Date();
      
      // Check for session gap (>3 days since last practice)
      if (sessions?.[0]) {
        const lastSession = new Date(sessions[0].started_at);
        const daysSinceLastSession = differenceInDays(today, lastSession);
        
        if (daysSinceLastSession >= 3) {
          newNotifications.push({
            id: 'session-gap',
            type: 'gap',
            title: 'Welcome back!',
            message: `It's been ${daysSinceLastSession} days since your last session. Let's do a quick warm-up to refresh your memory.`,
            action: {
              label: 'Start Warm-up',
              route: '/practice',
            },
            priority: 'medium',
          });
        }
      }
      
      // Check learning path schedule
      if (pathNodes && pathNodes.length > 0) {
        const pastDueNodes = pathNodes.filter(
          node => new Date(node.scheduled_date) < today && node.status !== 'completed'
        );
        const completedNodes = pathNodes.filter(node => node.status === 'completed');
        
        // Behind schedule (>20% past due)
        const behindRatio = pastDueNodes.length / pathNodes.length;
        if (behindRatio > 0.2) {
          newNotifications.push({
            id: 'behind-schedule',
            type: 'behind',
            title: 'Falling behind schedule',
            message: `You have ${pastDueNodes.length} overdue sessions. Consider a catch-up plan to get back on track.`,
            action: {
              label: 'View Catch-up Plan',
              route: '/set-goal',
            },
            priority: 'high',
          });
        }
        
        // Ahead of schedule (completed >20% more than expected)
        const expectedCompleted = pathNodes.filter(
          node => new Date(node.scheduled_date) <= today
        ).length;
        if (completedNodes.length > expectedCompleted * 1.2 && expectedCompleted > 0) {
          newNotifications.push({
            id: 'ahead-schedule',
            type: 'ahead',
            title: 'Ahead of schedule!',
            message: 'Great progress! Consider taking a topic exam to test your readiness early.',
            action: {
              label: 'Take Topic Exam',
              route: '/practice',
            },
            priority: 'low',
          });
        }
      }
      
      // Check for deadline proximity
      if (profile?.target_mastery_date) {
        const deadline = new Date(profile.target_mastery_date);
        const daysUntilDeadline = differenceInDays(deadline, today);
        
        if (daysUntilDeadline <= 7 && daysUntilDeadline > 0) {
          newNotifications.push({
            id: 'deadline-near',
            type: 'milestone',
            title: `${daysUntilDeadline} days until your goal`,
            message: 'Your target date is approaching. Focus on weak areas to maximize readiness.',
            priority: 'high',
          });
        }
      }
      
    } catch (error) {
      console.error('Error checking learning status:', error);
    }
    
    setNotifications(newNotifications.filter(n => !dismissed.includes(n.id)));
  };

  const dismissNotification = (id: string) => {
    setDismissed(prev => [...prev, id]);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'behind': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'ahead': return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'gap': return <RefreshCw className="h-5 w-5 text-blue-500" />;
      case 'milestone': return <Target className="h-5 w-5 text-purple-500" />;
      case 'refresh': return <Clock className="h-5 w-5 text-orange-500" />;
    }
  };

  const getPriorityStyles = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high': return 'border-amber-500/30 bg-amber-500/5';
      case 'medium': return 'border-blue-500/30 bg-blue-500/5';
      case 'low': return 'border-border bg-muted/30';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {notifications.slice(0, 2).map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className={`p-4 border ${getPriorityStyles(notification.priority)}`}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm">{notification.title}</h4>
                    <button 
                      onClick={() => dismissNotification(notification.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {notification.message}
                  </p>
                  {notification.action && (
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="px-0 mt-2 h-auto"
                      onClick={() => navigate(notification.action!.route)}
                    >
                      {notification.action.label}
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
