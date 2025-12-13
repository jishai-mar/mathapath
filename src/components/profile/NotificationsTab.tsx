import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, Bell, Info, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationSettings {
  notify_weekly_progress: boolean;
  notify_new_courses: boolean;
  notify_community_mentions: boolean;
  notify_daily_reminder: boolean;
  notify_achievements: boolean;
}

export default function NotificationsTab() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const [settings, setSettings] = useState<NotificationSettings>({
    notify_weekly_progress: true,
    notify_new_courses: false,
    notify_community_mentions: true,
    notify_daily_reminder: true,
    notify_achievements: false,
  });

  const [originalSettings, setOriginalSettings] = useState<NotificationSettings>(settings);

  // Load notification settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('notify_weekly_progress, notify_new_courses, notify_community_mentions, notify_daily_reminder, notify_achievements')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          const loadedSettings = {
            notify_weekly_progress: data.notify_weekly_progress ?? true,
            notify_new_courses: data.notify_new_courses ?? false,
            notify_community_mentions: data.notify_community_mentions ?? true,
            notify_daily_reminder: data.notify_daily_reminder ?? true,
            notify_achievements: data.notify_achievements ?? false,
          };
          setSettings(loadedSettings);
          setOriginalSettings(loadedSettings);
        }
      } catch (error) {
        console.error('Error loading notification settings:', error);
        toast.error('Failed to load notification settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  const handleChange = (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(settings)
        .eq('id', user.id);

      if (error) throw error;

      setOriginalSettings(settings);
      setHasChanges(false);
      toast.success('Notification preferences saved');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setSettings(originalSettings);
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">Notification Preferences</h1>
          {hasChanges && <div className="w-2 h-2 rounded-full bg-primary" />}
        </div>
        <p className="text-muted-foreground">
          Curate your learning environment. Choose how and when we communicate with you regarding your mathematical journey.
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-8">
        {/* Email Communications */}
        <div>
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
            <Mail className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Email Communications</h3>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Weekly Progress Digest</p>
                <p className="text-sm text-muted-foreground">
                  A summary of your weekly achievements, streaks, and concepts mastered.
                </p>
              </div>
              <Switch 
                checked={settings.notify_weekly_progress} 
                onCheckedChange={(v) => handleChange('notify_weekly_progress', v)} 
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">New Course Announcements</p>
                <p className="text-sm text-muted-foreground">
                  Be the first to know when we release new modules on Calculus, Linear Algebra, or Number Theory.
                </p>
              </div>
              <Switch 
                checked={settings.notify_new_courses} 
                onCheckedChange={(v) => handleChange('notify_new_courses', v)} 
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Community Mentions</p>
                <p className="text-sm text-muted-foreground">
                  Notifications when someone replies to your proofs or questions in the forum.
                </p>
              </div>
              <Switch 
                checked={settings.notify_community_mentions} 
                onCheckedChange={(v) => handleChange('notify_community_mentions', v)} 
              />
            </div>
          </div>
        </div>

        {/* In-App Alerts */}
        <div>
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">In-App Alerts</h3>
          </div>

          <div className="bg-muted/30 rounded-xl p-4 space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox 
                id="daily-reminder"
                checked={settings.notify_daily_reminder}
                onCheckedChange={(v) => handleChange('notify_daily_reminder', v as boolean)}
                className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <label htmlFor="daily-reminder" className="cursor-pointer">
                <p className="font-medium text-foreground">Daily Practice Reminder</p>
                <p className="text-sm text-muted-foreground">
                  Gentle nudges to keep your streak alive. Optimized for your usual study time.
                </p>
              </label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox 
                id="achievement-unlocks"
                checked={settings.notify_achievements}
                onCheckedChange={(v) => handleChange('notify_achievements', v as boolean)}
                className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <label htmlFor="achievement-unlocks" className="cursor-pointer">
                <p className="font-medium text-foreground">Achievement Unlocks</p>
                <p className="text-sm text-muted-foreground">
                  Celebratory pop-ups when you master a concept.
                </p>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button 
            variant="outline" 
            onClick={handleDiscard}
            disabled={!hasChanges || isSaving}
          >
            Discard Changes
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Preferences
          </Button>
        </div>
      </div>

      {/* Info Note */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Info className="w-4 h-4" />
        <span>System notifications regarding security and account status cannot be disabled.</span>
      </div>
    </motion.div>
  );
}
