import { motion } from 'framer-motion';

interface QuestionHeaderProps {
  tag: string;
  question: string;
  subtitle?: string;
}

export default function QuestionHeader({
  tag,
  question,
  subtitle,
}: QuestionHeaderProps) {
  return (
    <div className="text-center space-y-4 mb-8">
      {/* Tag badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30"
      >
        <span className="text-xs font-semibold text-primary tracking-wider uppercase">
          {tag}
        </span>
      </motion.div>

      {/* Question */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight"
      >
        {question}
      </motion.h1>

      {/* Subtitle */}
      {subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-muted-foreground text-base sm:text-lg max-w-lg mx-auto"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}
