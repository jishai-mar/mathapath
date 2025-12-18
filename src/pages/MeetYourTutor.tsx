import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTutor } from '@/contexts/TutorContext';
import { TutorAvatar, AvatarStyle } from '@/components/tutor/TutorAvatar';
import { Personality, ChatTheme } from '@/components/tutor/TutorCustomizationModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  Bot,
  Bird,
  Circle,
  GraduationCap,
  Cat,
  Heart,
  Zap,
  Target,
  Smile
} from 'lucide-react';

const AVATAR_OPTIONS: { style: AvatarStyle; name: string; icon: React.ReactNode }[] = [
  { style: 'friendly-robot', name: 'Friendly Robot', icon: <Bot className="w-5 h-5" /> },
  { style: 'wise-owl', name: 'Wise Owl', icon: <Bird className="w-5 h-5" /> },
  { style: 'abstract-orb', name: 'Abstract Orb', icon: <Circle className="w-5 h-5" /> },
  { style: 'cartoon-professor', name: 'Professor', icon: <GraduationCap className="w-5 h-5" /> },
  { style: 'helpful-fox', name: 'Helpful Fox', icon: <Cat className="w-5 h-5" /> },
];

const PERSONALITY_OPTIONS: { value: Personality; name: string; description: string; icon: React.ReactNode }[] = [
  { value: 'patient', name: 'Patient', description: 'Gentle, step-by-step guidance', icon: <Heart className="w-5 h-5" /> },
  { value: 'encouraging', name: 'Encouraging', description: 'Lots of praise and celebration', icon: <Sparkles className="w-5 h-5" /> },
  { value: 'challenging', name: 'Challenging', description: 'Pushes for excellence', icon: <Target className="w-5 h-5" /> },
  { value: 'humorous', name: 'Humorous', description: 'Fun and light-hearted', icon: <Smile className="w-5 h-5" /> },
];

const THEME_OPTIONS: { value: ChatTheme; name: string; colors: string }[] = [
  { value: 'default', name: 'Default', colors: 'from-primary/20 to-primary/10' },
  { value: 'warm', name: 'Warm', colors: 'from-orange-500/20 to-amber-500/10' },
  { value: 'cool', name: 'Cool', colors: 'from-blue-500/20 to-cyan-500/10' },
  { value: 'nature', name: 'Nature', colors: 'from-emerald-500/20 to-green-500/10' },
];

const NAME_SUGGESTIONS = ['Alex', 'Max', 'Luna', 'Sam', 'Nova', 'Sage'];

type Step = 'intro' | 'name' | 'avatar' | 'personality' | 'theme' | 'complete';

export default function MeetYourTutor() {
  const navigate = useNavigate();
  const { preferences, updatePreferences, setFirstTimeComplete } = useTutor();
  
  const [step, setStep] = useState<Step>('intro');
  const [tutorName, setTutorName] = useState(preferences.tutorName);
  const [avatarStyle, setAvatarStyle] = useState<AvatarStyle>(preferences.avatarStyle);
  const [personality, setPersonality] = useState<Personality>(preferences.personality);
  const [chatTheme, setChatTheme] = useState<ChatTheme>(preferences.chatTheme);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps: Step[] = ['intro', 'name', 'avatar', 'personality', 'theme', 'complete'];
  const currentStepIndex = steps.indexOf(step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await updatePreferences({
        tutorName,
        avatarStyle,
        personality,
        chatTheme,
      });
      setFirstTimeComplete();
      navigate('/');
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, hsla(145, 76%, 30%, 0.15) 0%, transparent 60%)',
        }}
      />
      <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-primary/5 blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-primary/3 blur-3xl" />

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-border/20 z-50">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <AnimatePresence mode="wait">
          {/* Intro Step */}
          {step === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center max-w-xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="mb-8"
              >
                <TutorAvatar style={avatarStyle} mood="celebrating" size="xl" />
              </motion.div>
              
              <div className="flex items-center justify-center gap-2 text-primary mb-4">
                <Sparkles className="w-5 h-5" />
                <span className="text-sm font-medium uppercase tracking-wider">Welcome</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-4">
                Meet Your Personal<br />AI Math Tutor
              </h1>
              
              <p className="text-lg text-muted-foreground mb-8">
                I'll be your guide through your math learning journey. Let's customize how I look and teach so I can help you best!
              </p>
              
              <Button 
                onClick={handleNext}
                size="lg"
                className="px-8 py-6 text-lg rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Let's Get Started
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          )}

          {/* Name Step */}
          {step === 'name' && (
            <motion.div
              key="name"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center max-w-xl w-full"
            >
              <TutorAvatar style={avatarStyle} mood="curious" size="lg" className="mb-6 mx-auto" />
              
              <h2 className="text-3xl font-serif text-foreground mb-2">What should I call myself?</h2>
              <p className="text-muted-foreground mb-8">Give me a name you'll enjoy talking to!</p>
              
              <div className="space-y-4">
                <Input
                  value={tutorName}
                  onChange={(e) => setTutorName(e.target.value)}
                  placeholder="Enter a name..."
                  className="text-center text-xl py-6 rounded-xl"
                  maxLength={20}
                />
                
                <div className="flex flex-wrap justify-center gap-2">
                  {NAME_SUGGESTIONS.map((name) => (
                    <button
                      key={name}
                      onClick={() => setTutorName(name)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        tutorName === name
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border border-border text-muted-foreground hover:bg-surface-highlight hover:text-foreground'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-3 justify-center mt-8">
                <Button variant="outline" onClick={handleBack} className="px-6 py-3 rounded-xl">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={handleNext} 
                  disabled={!tutorName.trim()}
                  className="px-6 py-3 rounded-xl"
                >
                  Continue
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Avatar Step */}
          {step === 'avatar' && (
            <motion.div
              key="avatar"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center max-w-2xl w-full"
            >
              <TutorAvatar style={avatarStyle} mood="happy" size="lg" className="mb-6 mx-auto" />
              
              <h2 className="text-3xl font-serif text-foreground mb-2">Choose my look</h2>
              <p className="text-muted-foreground mb-8">Pick an avatar style that feels right to you!</p>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                {AVATAR_OPTIONS.map((option) => (
                  <button
                    key={option.style}
                    onClick={() => setAvatarStyle(option.style)}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      avatarStyle === option.style
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    <TutorAvatar style={option.style} mood="idle" size="md" className="mx-auto mb-2" />
                    <span className="text-sm font-medium text-foreground">{option.name}</span>
                  </button>
                ))}
              </div>
              
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={handleBack} className="px-6 py-3 rounded-xl">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleNext} className="px-6 py-3 rounded-xl">
                  Continue
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Personality Step */}
          {step === 'personality' && (
            <motion.div
              key="personality"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center max-w-3xl w-full"
            >
              <TutorAvatar style={avatarStyle} mood="explaining" size="lg" className="mb-6 mx-auto" />
              
              <h2 className="text-3xl font-serif text-foreground mb-2">How should I teach?</h2>
              <p className="text-muted-foreground mb-6">Choose a teaching style that motivates you best!</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {PERSONALITY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setPersonality(option.value)}
                    className={`p-5 rounded-2xl border-2 text-left transition-all ${
                      personality === option.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        personality === option.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        {option.icon}
                      </div>
                      <span className="text-lg font-semibold text-foreground">{option.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-[52px]">{option.description}</p>
                  </button>
                ))}
              </div>

              {/* Preview Section */}
              <motion.div
                key={personality}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-6 mb-8 text-left border border-primary/20"
              >
                <div className="flex items-center gap-2 text-primary mb-3">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Preview: How {tutorName} responds</span>
                </div>
                
                <div className="space-y-4">
                  {/* Correct Answer Response */}
                  <div className="flex gap-3">
                    <TutorAvatar style={avatarStyle} mood="happy" size="sm" className="flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">When you get it right:</p>
                      <div className="bg-card rounded-xl p-3 text-sm text-foreground">
                        {personality === 'patient' && `"That's correct! You took your time and worked through it step by step. That's exactly how you build solid understanding."`}
                        {personality === 'encouraging' && `"YES! 🎉 You absolutely crushed it! I knew you could do it! Your hard work is really paying off!"`}
                        {personality === 'challenging' && `"Correct. Good. Now let's see if you can handle something more complex. Ready to level up?"`}
                        {personality === 'humorous' && `"Boom! 💥 You just solved that like a math ninja! High five! ✋ (I'd actually high five you but... digital tutor problems.)"`}
                      </div>
                    </div>
                  </div>
                  
                  {/* Wrong Answer Response */}
                  <div className="flex gap-3">
                    <TutorAvatar style={avatarStyle} mood="encouraging" size="sm" className="flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">When you make a mistake:</p>
                      <div className="bg-card rounded-xl p-3 text-sm text-foreground">
                        {personality === 'patient' && `"Not quite, but that's okay! Let's slow down and look at this together. Which part feels confusing? We'll work through it one piece at a time."`}
                        {personality === 'encouraging' && `"Oops! But hey, mistakes are just learning in disguise! You're so close - let me give you a hint and I bet you'll get it!"`}
                        {personality === 'challenging' && `"Not quite. Think about what you just did. Where did your approach go wrong? I want you to figure out the mistake yourself."`}
                        {personality === 'humorous' && `"Hmm, that answer is playing hide and seek with the right one! 🙈 Let's retrace our steps - I'll be your math detective partner!"`}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={handleBack} className="px-6 py-3 rounded-xl">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleNext} className="px-6 py-3 rounded-xl">
                  Continue
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Theme Step */}
          {step === 'theme' && (
            <motion.div
              key="theme"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center max-w-xl w-full"
            >
              <TutorAvatar style={avatarStyle} mood="happy" size="lg" className="mb-6 mx-auto" />
              
              <h2 className="text-3xl font-serif text-foreground mb-2">Pick a chat theme</h2>
              <p className="text-muted-foreground mb-8">Choose colors for our conversation!</p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                {THEME_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setChatTheme(option.value)}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      chatTheme === option.value
                        ? 'border-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className={`h-16 rounded-xl bg-gradient-to-br ${option.colors} mb-3`} />
                    <span className="text-sm font-medium text-foreground">{option.name}</span>
                  </button>
                ))}
              </div>
              
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={handleBack} className="px-6 py-3 rounded-xl">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleNext} className="px-6 py-3 rounded-xl">
                  Almost Done!
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Complete Step */}
          {step === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center max-w-xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="mb-8"
              >
                <TutorAvatar 
                  style={avatarStyle} 
                  mood="celebrating" 
                  size="xl"
                  showSpeechBubble
                />
              </motion.div>
              
              <div className="flex items-center justify-center gap-2 text-primary mb-4">
                <Zap className="w-5 h-5" />
                <span className="text-sm font-medium uppercase tracking-wider">All Set!</span>
              </div>
              
              <h1 className="text-4xl font-serif text-foreground mb-4">
                Nice to meet you!
              </h1>
              
              <p className="text-lg text-muted-foreground mb-8">
                I'm <span className="text-foreground font-semibold">{tutorName}</span>, your personal AI math tutor. 
                I'll be {personality === 'patient' ? 'patient and gentle' : 
                         personality === 'encouraging' ? 'encouraging and celebratory' :
                         personality === 'challenging' ? 'challenging and direct' : 
                         'fun and humorous'} in our lessons. Let's start learning!
              </p>
              
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={handleBack} className="px-6 py-3 rounded-xl">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
                <Button 
                  onClick={handleComplete}
                  disabled={isSubmitting}
                  size="lg"
                  className="px-8 py-6 text-lg rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isSubmitting ? 'Saving...' : 'Start Learning!'}
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
