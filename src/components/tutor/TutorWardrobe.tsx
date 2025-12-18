import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Check, Star, Sparkles, Shirt, Palette, Wand2, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TutorAvatar } from './TutorAvatar';
import { useTutor } from '@/contexts/TutorContext';
import { 
  useUnlockableItems, 
  CustomizationItem, 
  ItemCategory, 
  ItemRarity 
} from '@/hooks/useUnlockableItems';

const categoryConfig: Record<ItemCategory, { label: string; icon: typeof Crown; description: string }> = {
  accessory: { label: 'Accessories', icon: Crown, description: 'Hats, glasses, and more' },
  outfit: { label: 'Outfits', icon: Shirt, description: 'Stylish clothes for your tutor' },
  background: { label: 'Backgrounds', icon: Palette, description: 'Set the scene' },
  effect: { label: 'Effects', icon: Wand2, description: 'Magical visual effects' }
};

const rarityColors: Record<ItemRarity, { bg: string; border: string; text: string; glow: string }> = {
  common: { bg: 'bg-slate-500/10', border: 'border-slate-400/30', text: 'text-slate-400', glow: '' },
  rare: { bg: 'bg-blue-500/10', border: 'border-blue-400/30', text: 'text-blue-400', glow: 'shadow-blue-400/20' },
  epic: { bg: 'bg-purple-500/10', border: 'border-purple-400/30', text: 'text-purple-400', glow: 'shadow-purple-400/20' },
  legendary: { bg: 'bg-amber-500/10', border: 'border-amber-400/30', text: 'text-amber-400', glow: 'shadow-amber-400/30' }
};

const requirementLabels: Record<string, string> = {
  xp: 'XP',
  streak: 'day streak',
  exercises: 'exercises',
  topic_complete: 'topics mastered',
  mastery: '% mastery'
};

interface ItemCardProps {
  item: CustomizationItem;
  isUnlocked: boolean;
  isEquipped: boolean;
  progress: { current: number; required: number; percentage: number };
  onEquip: () => void;
  onUnequip: () => void;
}

function ItemCard({ item, isUnlocked, isEquipped, progress, onEquip, onUnequip }: ItemCardProps) {
  const colors = rarityColors[item.rarity];
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={isUnlocked ? { scale: 1.02 } : undefined}
      className={`relative rounded-2xl border ${colors.border} ${colors.bg} p-4 transition-all ${
        isUnlocked ? 'cursor-pointer hover:shadow-lg ' + colors.glow : 'opacity-60'
      } ${isEquipped ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
      onClick={() => isUnlocked && (isEquipped ? onUnequip() : onEquip())}
    >
      {/* Rarity indicator */}
      <div className={`absolute top-2 right-2 flex items-center gap-1 text-xs font-medium ${colors.text}`}>
        <Star className="w-3 h-3" />
        <span className="capitalize">{item.rarity}</span>
      </div>

      {/* Icon/Preview */}
      <div className={`w-12 h-12 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center mb-3 text-2xl`}>
        {!isUnlocked ? (
          <Lock className="w-5 h-5 text-muted-foreground" />
        ) : (
          getItemEmoji(item.icon_key)
        )}
      </div>

      {/* Name and description */}
      <h4 className="font-medium text-foreground mb-1">{item.name}</h4>
      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{item.description}</p>

      {/* Unlock status or progress */}
      {isUnlocked ? (
        <div className="flex items-center justify-between">
          {isEquipped ? (
            <span className="flex items-center gap-1.5 text-xs text-primary font-medium">
              <Check className="w-3.5 h-3.5" />
              Equipped
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Click to equip</span>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Progress value={progress.percentage} className="h-1.5" />
          <p className="text-xs text-muted-foreground">
            {progress.current}/{progress.required} {requirementLabels[item.unlock_requirement_type]}
          </p>
        </div>
      )}
    </motion.div>
  );
}

function getItemEmoji(iconKey: string): string {
  const emojiMap: Record<string, string> = {
    'glasses': '👓',
    'badge': '🎖️',
    'headphones': '🎧',
    'graduation-cap': '🎓',
    'crown': '👑',
    'halo': '😇',
    'lab-coat': '🥼',
    'vest': '🦺',
    'blazer': '🧥',
    'robe': '👘',
    'wizard-cloak': '🧙',
    'notebook': '📓',
    'chalkboard': '📋',
    'library': '📚',
    'stars': '⭐',
    'space': '🚀',
    'galaxy': '🌌',
    'sparkle': '✨',
    'glow': '💫',
    'numbers': '🔢',
    'rainbow': '🌈',
    'lightning': '⚡',
    'fire': '🔥'
  };
  return emojiMap[iconKey] || '❓';
}

export function TutorWardrobe() {
  const { preferences } = useTutor();
  const {
    allItems,
    userStats,
    isLoading,
    isItemUnlocked,
    getEquippedItem,
    getItemsByCategory,
    getProgressToUnlock,
    equipItem,
    unequipItem
  } = useUnlockableItems();

  const [activeCategory, setActiveCategory] = useState<ItemCategory>('accessory');

  const categories: ItemCategory[] = ['accessory', 'outfit', 'background', 'effect'];
  const categoryItems = getItemsByCategory(activeCategory);

  const equippedAccessory = getEquippedItem('accessory');
  const equippedOutfit = getEquippedItem('outfit');
  const equippedBackground = getEquippedItem('background');
  const equippedEffect = getEquippedItem('effect');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const unlockedCount = allItems.filter(item => isItemUnlocked(item.id)).length;

  return (
    <div className="space-y-6">
      {/* Header with preview */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Tutor Preview */}
        <div className="flex-shrink-0">
          <div className="glass rounded-2xl p-6 text-center">
            <TutorAvatar 
              style={preferences.avatarStyle} 
              mood="happy" 
              size="xl"
              equippedAccessory={equippedAccessory?.item.icon_key}
              equippedOutfit={equippedOutfit?.item.icon_key}
              equippedBackground={equippedBackground?.item.icon_key}
              equippedEffect={equippedEffect?.item.icon_key}
            />
            <p className="text-sm text-muted-foreground mt-3">
              {preferences.tutorName}'s current look
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-4">
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Collection Progress</span>
            </div>
            <div className="flex items-center gap-4">
              <Progress value={(unlockedCount / allItems.length) * 100} className="flex-1 h-2" />
              <span className="text-sm text-muted-foreground">
                {unlockedCount}/{allItems.length}
              </span>
            </div>
          </div>

          {userStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatBox label="XP" value={userStats.total_xp} icon="⚡" />
              <StatBox label="Streak" value={`${userStats.current_streak}d`} icon="🔥" />
              <StatBox label="Exercises" value={userStats.exercises_completed} icon="📝" />
              <StatBox label="Topics" value={userStats.topics_completed} icon="🎯" />
            </div>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as ItemCategory)}>
        <TabsList className="w-full grid grid-cols-4 h-auto p-1">
          {categories.map((cat) => {
            const config = categoryConfig[cat];
            const Icon = config.icon;
            const equipped = getEquippedItem(cat);
            return (
              <TabsTrigger
                key={cat}
                value={cat}
                className="flex flex-col items-center gap-1 py-3 relative"
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs">{config.label}</span>
                {equipped && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {categories.map((cat) => (
          <TabsContent key={cat} value={cat} className="mt-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={cat}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-2 md:grid-cols-3 gap-4"
              >
                {getItemsByCategory(cat).map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    isUnlocked={isItemUnlocked(item.id)}
                    isEquipped={getEquippedItem(cat)?.item_id === item.id}
                    progress={getProgressToUnlock(item)}
                    onEquip={() => equipItem(item.id, item.category)}
                    onUnequip={() => unequipItem(item.id, item.category)}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function StatBox({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="glass rounded-xl p-3 text-center">
      <span className="text-lg">{icon}</span>
      <p className="text-lg font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
