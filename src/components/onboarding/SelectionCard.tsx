import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectionCardProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  isSelected: boolean;
  onClick: () => void;
  variant?: 'default' | 'large';
}

export default function SelectionCard({
  icon: Icon,
  title,
  subtitle,
  isSelected,
  onClick,
  variant = 'default',
}: SelectionCardProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative flex items-center w-full rounded-2xl border transition-all duration-300 text-left focus:outline-none focus:ring-2 focus:ring-primary/50',
        variant === 'large' ? 'p-6' : 'p-4',
        isSelected
          ? 'bg-primary/10 border-primary shadow-[0_0_40px_-10px_hsla(145,76%,55%,0.4)]'
          : 'bg-card/50 border-border/30 hover:border-primary/50 hover:bg-card/80'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex items-center justify-center rounded-full transition-all duration-300 mr-4',
          variant === 'large' ? 'w-14 h-14' : 'w-12 h-12',
          isSelected
            ? 'bg-primary text-primary-foreground'
            : 'bg-primary/10 text-primary group-hover:bg-primary/20'
        )}
      >
        <Icon className={variant === 'large' ? 'w-7 h-7' : 'w-6 h-6'} />
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <h3
          className={cn(
            'font-semibold text-foreground',
            variant === 'large' ? 'text-lg' : 'text-base'
          )}
        >
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
            {subtitle}
          </p>
        )}
      </div>

      {/* Selection indicator */}
      <div
        className={cn(
          'w-6 h-6 rounded-full border-2 flex items-center justify-center ml-4 transition-all duration-300',
          isSelected
            ? 'border-primary bg-primary'
            : 'border-muted-foreground/30'
        )}
      >
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <Check className="w-4 h-4 text-primary-foreground" />
          </motion.div>
        )}
      </div>
    </motion.button>
  );
}
