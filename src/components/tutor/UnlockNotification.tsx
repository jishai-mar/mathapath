import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Gift, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomizationItem, ItemRarity } from '@/hooks/useUnlockableItems';

interface UnlockNotificationProps {
  items: CustomizationItem[];
  onClose: () => void;
  onEquip?: (itemId: string) => void;
  onViewWardrobe?: () => void;
}

const rarityConfig: Record<ItemRarity, { bg: string; border: string; glow: string; text: string }> = {
  common: {
    bg: 'from-slate-500/20 to-slate-600/20',
    border: 'border-slate-400/30',
    glow: 'shadow-slate-400/20',
    text: 'text-slate-300'
  },
  rare: {
    bg: 'from-blue-500/20 to-blue-600/20',
    border: 'border-blue-400/30',
    glow: 'shadow-blue-400/30',
    text: 'text-blue-300'
  },
  epic: {
    bg: 'from-purple-500/20 to-purple-600/20',
    border: 'border-purple-400/30',
    glow: 'shadow-purple-400/30',
    text: 'text-purple-300'
  },
  legendary: {
    bg: 'from-amber-500/20 to-amber-600/20',
    border: 'border-amber-400/30',
    glow: 'shadow-amber-400/40',
    text: 'text-amber-300'
  }
};

const categoryIcons: Record<string, string> = {
  accessory: '🎓',
  outfit: '👔',
  background: '🌌',
  effect: '✨'
};

export function UnlockNotification({ items, onClose, onEquip, onViewWardrobe }: UnlockNotificationProps) {
  if (items.length === 0) return null;

  const primaryItem = items[0];
  const config = rarityConfig[primaryItem.rarity];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className={`relative w-full max-w-md rounded-3xl border ${config.border} bg-gradient-to-b ${config.bg} p-6 shadow-2xl ${config.glow}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Celebration animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', damping: 10 }}
            className="flex justify-center mb-4"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Sparkles className={`w-16 h-16 ${config.text} opacity-30`} />
              </motion.div>
              <div className="relative z-10 w-20 h-20 rounded-2xl bg-card/50 border border-border/50 flex items-center justify-center text-4xl">
                {categoryIcons[primaryItem.category]}
              </div>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-4"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Gift className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary uppercase tracking-wider">
                New Item Unlocked!
              </span>
            </div>
            <h2 className="text-2xl font-serif text-foreground mb-1">
              {primaryItem.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              {primaryItem.description}
            </p>
          </motion.div>

          {/* Rarity badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center mb-6"
          >
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${config.text} ${config.bg} border ${config.border}`}>
              <Star className="w-3 h-3" />
              {primaryItem.rarity}
            </span>
          </motion.div>

          {/* Additional items */}
          {items.length > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-6 text-center"
            >
              <p className="text-sm text-muted-foreground">
                + {items.length - 1} more item{items.length > 2 ? 's' : ''} unlocked!
              </p>
            </motion.div>
          )}

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex gap-3"
          >
            {onEquip && (
              <Button
                onClick={() => onEquip(primaryItem.id)}
                className="flex-1 rounded-xl"
              >
                Equip Now
              </Button>
            )}
            {onViewWardrobe && (
              <Button
                variant="outline"
                onClick={onViewWardrobe}
                className="flex-1 rounded-xl"
              >
                View Wardrobe
              </Button>
            )}
            {!onEquip && !onViewWardrobe && (
              <Button onClick={onClose} className="flex-1 rounded-xl">
                Awesome!
              </Button>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
