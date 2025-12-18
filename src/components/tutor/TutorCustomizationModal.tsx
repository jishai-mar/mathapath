import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TutorAvatar, avatarOptions, AvatarStyle } from './TutorAvatar';
import { cn } from '@/lib/utils';
import { Check, Sparkles } from 'lucide-react';

export type Personality = 'patient' | 'encouraging' | 'challenging' | 'humorous';
export type ChatTheme = 'default' | 'warm' | 'cool' | 'nature';

interface TutorPreferences {
  tutorName: string;
  avatarStyle: AvatarStyle;
  personality: Personality;
  chatTheme: ChatTheme;
}

interface TutorCustomizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPreferences?: TutorPreferences;
  onSave: (preferences: TutorPreferences) => void;
  isOnboarding?: boolean;
}

const personalityOptions: { value: Personality; name: string; description: string; emoji: string }[] = [
  { value: 'patient', name: 'Patient & Gentle', description: 'Takes time to explain concepts carefully', emoji: '🌱' },
  { value: 'encouraging', name: 'Encouraging & Energetic', description: 'Celebrates every win, keeps you motivated', emoji: '🎉' },
  { value: 'challenging', name: 'Challenging & Direct', description: 'Pushes you to think deeper', emoji: '🎯' },
  { value: 'humorous', name: 'Humorous & Friendly', description: 'Makes learning fun with light jokes', emoji: '😄' },
];

const themeOptions: { value: ChatTheme; name: string; colors: string }[] = [
  { value: 'default', name: 'Default', colors: 'from-primary/20 to-primary/10' },
  { value: 'warm', name: 'Warm', colors: 'from-orange-500/20 to-amber-500/10' },
  { value: 'cool', name: 'Cool', colors: 'from-blue-500/20 to-cyan-500/10' },
  { value: 'nature', name: 'Nature', colors: 'from-emerald-500/20 to-green-500/10' },
];

const nameSuggestions = ['Alex', 'Max', 'Luna', 'Sam', 'Nova', 'Sage', 'River', 'Sky'];

export function TutorCustomizationModal({
  open,
  onOpenChange,
  initialPreferences,
  onSave,
  isOnboarding = false,
}: TutorCustomizationModalProps) {
  const [preferences, setPreferences] = useState<TutorPreferences>(
    initialPreferences || {
      tutorName: 'Alex',
      avatarStyle: 'friendly-robot',
      personality: 'patient',
      chatTheme: 'default',
    }
  );
  const [step, setStep] = useState(isOnboarding ? 0 : -1);

  const handleSave = () => {
    onSave(preferences);
    onOpenChange(false);
  };

  const renderOnboardingStep = () => {
    switch (step) {
      case 0:
        return (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6"
          >
            <div className="flex justify-center">
              <TutorAvatar style={preferences.avatarStyle} mood="happy" size="xl" showSpeechBubble />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Meet Your Personal AI Tutor!</h3>
              <p className="text-muted-foreground">
                I'm here to help you master math. Let's get to know each other!
              </p>
            </div>
            <Button onClick={() => setStep(1)} className="gap-2">
              Let's Go <Sparkles className="w-4 h-4" />
            </Button>
          </motion.div>
        );
      case 1:
        return (
          <motion.div
            key="name"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">What would you like to call me?</h3>
              <p className="text-sm text-muted-foreground">Pick a name or create your own</p>
            </div>
            <div className="space-y-4">
              <Input
                value={preferences.tutorName}
                onChange={(e) => setPreferences({ ...preferences, tutorName: e.target.value })}
                placeholder="Enter a name..."
                className="text-center text-lg"
              />
              <div className="flex flex-wrap gap-2 justify-center">
                {nameSuggestions.map((name) => (
                  <Button
                    key={name}
                    variant={preferences.tutorName === name ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreferences({ ...preferences, tutorName: name })}
                  >
                    {name}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
              <Button onClick={() => setStep(2)} disabled={!preferences.tutorName.trim()}>
                Next
              </Button>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            key="avatar"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Choose my appearance</h3>
              <p className="text-sm text-muted-foreground">Pick the avatar that speaks to you</p>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {avatarOptions.map((option) => (
                <button
                  key={option.style}
                  onClick={() => setPreferences({ ...preferences, avatarStyle: option.style })}
                  className={cn(
                    "relative p-2 rounded-xl border-2 transition-all",
                    preferences.avatarStyle === option.style
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <TutorAvatar style={option.style} mood="happy" size="md" />
                  {preferences.avatarStyle === option.style && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {avatarOptions.find(o => o.style === preferences.avatarStyle)?.description}
            </p>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)}>Next</Button>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div
            key="personality"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">How should I teach you?</h3>
              <p className="text-sm text-muted-foreground">Pick my teaching personality</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {personalityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPreferences({ ...preferences, personality: option.value })}
                  className={cn(
                    "relative p-4 rounded-xl border-2 transition-all text-left",
                    preferences.personality === option.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{option.emoji}</span>
                    <div>
                      <div className="font-medium">{option.name}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </div>
                  {preferences.personality === option.value && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={() => setStep(4)}>Next</Button>
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6"
          >
            <div className="flex justify-center">
              <TutorAvatar style={preferences.avatarStyle} mood="celebrating" size="xl" showSpeechBubble />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Hi, I'm {preferences.tutorName}! 👋</h3>
              <p className="text-muted-foreground">
                I'm excited to be your personal math tutor. Let's start learning together!
              </p>
            </div>
            <Button onClick={handleSave} size="lg" className="gap-2">
              Start Learning <Sparkles className="w-4 h-4" />
            </Button>
          </motion.div>
        );
      default:
        return null;
    }
  };

  const renderFullEditor = () => (
    <div className="space-y-6">
      {/* Avatar Preview */}
      <div className="flex justify-center">
        <TutorAvatar style={preferences.avatarStyle} mood="happy" size="lg" />
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label>Tutor Name</Label>
        <Input
          value={preferences.tutorName}
          onChange={(e) => setPreferences({ ...preferences, tutorName: e.target.value })}
          placeholder="Enter a name..."
        />
        <div className="flex flex-wrap gap-1">
          {nameSuggestions.slice(0, 4).map((name) => (
            <Button
              key={name}
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => setPreferences({ ...preferences, tutorName: name })}
            >
              {name}
            </Button>
          ))}
        </div>
      </div>

      {/* Avatar Selection */}
      <div className="space-y-2">
        <Label>Avatar</Label>
        <div className="grid grid-cols-5 gap-2">
          {avatarOptions.map((option) => (
            <button
              key={option.style}
              onClick={() => setPreferences({ ...preferences, avatarStyle: option.style })}
              className={cn(
                "relative p-2 rounded-lg border-2 transition-all",
                preferences.avatarStyle === option.style
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              )}
            >
              <TutorAvatar style={option.style} mood="idle" size="sm" />
            </button>
          ))}
        </div>
      </div>

      {/* Personality */}
      <div className="space-y-2">
        <Label>Teaching Style</Label>
        <div className="grid grid-cols-2 gap-2">
          {personalityOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setPreferences({ ...preferences, personality: option.value })}
              className={cn(
                "p-3 rounded-lg border-2 transition-all text-left",
                preferences.personality === option.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="flex items-center gap-2">
                <span>{option.emoji}</span>
                <span className="text-sm font-medium">{option.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div className="space-y-2">
        <Label>Chat Theme</Label>
        <div className="grid grid-cols-4 gap-2">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setPreferences({ ...preferences, chatTheme: option.value })}
              className={cn(
                "p-3 rounded-lg border-2 transition-all",
                preferences.chatTheme === option.value
                  ? "border-primary"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className={cn("w-full h-6 rounded bg-gradient-to-r", option.colors)} />
              <span className="text-xs mt-1 block">{option.name}</span>
            </button>
          ))}
        </div>
      </div>

      <Button onClick={handleSave} className="w-full">
        Save Changes
      </Button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("sm:max-w-md", isOnboarding && "sm:max-w-lg")}>
        {!isOnboarding && (
          <DialogHeader>
            <DialogTitle>Customize Your Tutor</DialogTitle>
            <DialogDescription>
              Personalize how your AI tutor looks and teaches
            </DialogDescription>
          </DialogHeader>
        )}
        <AnimatePresence mode="wait">
          {isOnboarding ? renderOnboardingStep() : renderFullEditor()}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
