import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, Bell, Info, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotificationsTab() {
  const [weeklyProgress, setWeeklyProgress] = useState(true);
  const [newCourse, setNewCourse] = useState(false);
  const [communityMentions, setCommunityMentions] = useState(true);
  
  const [dailyReminder, setDailyReminder] = useState(true);
  const [achievementUnlocks, setAchievementUnlocks] = useState(false);

  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (setter: React.Dispatch<React.SetStateAction<boolean>>, value: boolean) => {
    setter(value);
    setHasChanges(true);
  };

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
                checked={weeklyProgress} 
                onCheckedChange={(v) => handleChange(setWeeklyProgress, v)} 
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
                checked={newCourse} 
                onCheckedChange={(v) => handleChange(setNewCourse, v)} 
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
                checked={communityMentions} 
                onCheckedChange={(v) => handleChange(setCommunityMentions, v)} 
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
                checked={dailyReminder}
                onCheckedChange={(v) => handleChange(setDailyReminder, v as boolean)}
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
                checked={achievementUnlocks}
                onCheckedChange={(v) => handleChange(setAchievementUnlocks, v as boolean)}
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
            onClick={() => {
              setWeeklyProgress(true);
              setNewCourse(false);
              setCommunityMentions(true);
              setDailyReminder(true);
              setAchievementUnlocks(false);
              setHasChanges(false);
            }}
          >
            Discard Changes
          </Button>
          <Button onClick={() => setHasChanges(false)}>
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
