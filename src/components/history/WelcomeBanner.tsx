import { motion } from 'framer-motion';
import { Sparkles, Flame, Target, Trophy, Heart } from 'lucide-react';

interface WelcomeBannerProps {
  userName: string | null;
  currentStreak: number;
  totalQuestions: number;
  averageAccuracy: number;
  bestTopic: { name: string; accuracy: number } | null;
}

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Hey there';
}

function getEncouragingMessage(props: WelcomeBannerProps): { message: string; icon: React.ReactNode } {
  const { currentStreak, totalQuestions, averageAccuracy, bestTopic } = props;

  // Priority 1: High streak celebration
  if (currentStreak >= 7) {
    return {
      message: `Amazing! You've been on fire for ${currentStreak} days straight! Keep that incredible momentum going! 🔥`,
      icon: <Flame className="h-5 w-5 text-orange-500" />
    };
  }

  // Priority 2: Milestone celebration
  if (totalQuestions >= 500) {
    return {
      message: `Incredible! ${totalQuestions} questions completed! You're a true math champion! 🏆`,
      icon: <Trophy className="h-5 w-5 text-yellow-500" />
    };
  }
  if (totalQuestions >= 250) {
    return {
      message: `Outstanding! ${totalQuestions} questions tackled! Your dedication is inspiring! ⭐`,
      icon: <Trophy className="h-5 w-5 text-yellow-500" />
    };
  }
  if (totalQuestions >= 100) {
    return {
      message: `Wow, ${totalQuestions} questions completed! Your hard work is really paying off!`,
      icon: <Target className="h-5 w-5 text-primary" />
    };
  }

  // Priority 3: Accuracy celebration
  if (averageAccuracy >= 80) {
    return {
      message: `Your ${averageAccuracy}% accuracy shows you're truly mastering the material! Keep it up!`,
      icon: <Target className="h-5 w-5 text-green-500" />
    };
  }

  // Priority 4: Growing streak
  if (currentStreak >= 3) {
    return {
      message: `${currentStreak} days in a row! Great consistency shows real dedication! 💪`,
      icon: <Flame className="h-5 w-5 text-orange-500" />
    };
  }

  // Priority 5: Best topic highlight
  if (bestTopic && bestTopic.accuracy >= 70) {
    return {
      message: `You're crushing it in ${bestTopic.name}! That's your superpower! ✨`,
      icon: <Sparkles className="h-5 w-5 text-purple-500" />
    };
  }

  // Priority 6: New user welcome
  if (totalQuestions < 10) {
    return {
      message: `Welcome to your learning journey! Every expert was once a beginner. You've got this!`,
      icon: <Heart className="h-5 w-5 text-pink-500" />
    };
  }

  // Priority 7: Default encouragement
  return {
    message: `Every step forward counts. You're building something amazing, one problem at a time!`,
    icon: <Sparkles className="h-5 w-5 text-primary" />
  };
}

export function WelcomeBanner(props: WelcomeBannerProps) {
  const { userName, currentStreak, totalQuestions, averageAccuracy } = props;
  const greeting = getTimeGreeting();
  const { message, icon } = getEncouragingMessage(props);
  const displayName = userName || 'Learner';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border border-primary/20 p-5"
    >
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10 space-y-3">
        {/* Greeting with icon */}
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-xl font-bold text-foreground">
            {greeting}, {displayName}!
          </h2>
        </div>

        {/* Encouraging message */}
        <p className="text-muted-foreground leading-relaxed">
          {message}
        </p>

        {/* Mini stats row */}
        <div className="flex flex-wrap gap-3 pt-2">
          {currentStreak > 0 && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-background/60 rounded-full border border-border/50"
            >
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">{currentStreak}-day streak</span>
            </motion.div>
          )}
          {averageAccuracy > 0 && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-background/60 rounded-full border border-border/50"
            >
              <Target className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">{averageAccuracy}% accuracy</span>
            </motion.div>
          )}
          {totalQuestions > 0 && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-background/60 rounded-full border border-border/50"
            >
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">{totalQuestions} questions</span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
