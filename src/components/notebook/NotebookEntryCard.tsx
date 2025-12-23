import { motion } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  Lightbulb, 
  AlertTriangle, 
  Sparkles, 
  Heart,
  Brain,
  Trash2,
  Calendar,
  Dumbbell,
  MessageSquare,
  CheckCircle2,
  Trophy,
  Link2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MathRenderer from '@/components/MathRenderer';
import { NotebookEntry } from '@/hooks/useNotebook';

const noteTypeConfig: Record<string, { icon: typeof Lightbulb; label: string; color: string; bgColor: string }> = {
  breakthrough: {
    icon: Sparkles,
    label: 'Breakthrough',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20',
  },
  struggle: {
    icon: AlertTriangle,
    label: 'Challenge',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/20',
  },
  interest: {
    icon: Heart,
    label: 'Interest',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10 border-pink-500/20',
  },
  learning_style: {
    icon: Brain,
    label: 'Learning Style',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/20',
  },
  emotional: {
    icon: Lightbulb,
    label: 'Insight',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/20',
  },
};

interface NotebookEntryCardProps {
  entry: NotebookEntry;
  isSelected: boolean;
  relatedEntry?: NotebookEntry | null;
  onSelect: (entry: NotebookEntry) => void;
  onDelete: (id: string) => void;
  onPractice: (entry: NotebookEntry) => void;
  onAskTutor: (entry: NotebookEntry) => void;
  onMarkMastered?: (entry: NotebookEntry) => void;
}

export function NotebookEntryCard({ 
  entry, 
  isSelected,
  relatedEntry,
  onSelect, 
  onDelete, 
  onPractice,
  onAskTutor,
  onMarkMastered
}: NotebookEntryCardProps) {
  const config = noteTypeConfig[entry.note_type] || noteTypeConfig.emotional;
  const Icon = config.icon;
  const isStruggle = entry.note_type === 'struggle';
  const isMastered = isStruggle && entry.mastered_at !== null;
  const isFromStruggle = entry.note_type === 'breakthrough' && entry.related_entry_id !== null;

  // Check if content contains math (LaTeX patterns)
  const hasMath = /\$.*?\$|\\\[.*?\\\]|\\\(.*?\\\)/s.test(entry.content);

  // Calculate days to mastery if applicable
  const daysToMastery = isMastered && entry.mastered_at
    ? Math.ceil((new Date(entry.mastered_at).getTime() - new Date(entry.detected_at).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => onSelect(entry)}
      className={`group relative p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${
        isMastered 
          ? 'bg-gradient-to-r from-emerald-500/10 to-amber-500/10 border-emerald-500/30' 
          : config.bgColor
      } ${isSelected ? 'ring-2 ring-primary/50 shadow-lg' : ''}`}
    >
      {/* Mastered celebration indicator */}
      {isMastered && (
        <div className="absolute -top-2 -right-2">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg"
          >
            <Trophy className="w-4 h-4 text-white" />
          </motion.div>
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg flex-shrink-0 ${
          isMastered 
            ? 'bg-emerald-500/20 text-emerald-400' 
            : `${config.bgColor} ${config.color}`
        }`}>
          {isMastered ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
        </div>
        
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={`${isMastered ? 'text-emerald-400 border-emerald-400/30' : config.color} border-current/20 text-xs`}>
              {isMastered ? 'Mastered' : config.label}
            </Badge>
            {entry.subtopic_name && (
              <Badge variant="secondary" className="text-xs">
                {entry.subtopic_name}
              </Badge>
            )}
            {isFromStruggle && (
              <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-400/30 gap-1">
                <Link2 className="w-3 h-3" />
                From Struggle
              </Badge>
            )}
            {isMastered && daysToMastery !== null && (
              <Badge variant="secondary" className="text-xs bg-emerald-500/20 text-emerald-400">
                {daysToMastery === 0 ? 'Same day!' : `${daysToMastery} day${daysToMastery === 1 ? '' : 's'}`}
              </Badge>
            )}
          </div>
          
          <div className="text-sm text-foreground leading-relaxed">
            {hasMath ? (
              <MathRenderer latex={entry.content} />
            ) : (
              <p className="line-clamp-3">{entry.content}</p>
            )}
          </div>

          {/* Show related entry info */}
          {relatedEntry && (
            <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2 flex items-center gap-2">
              <Link2 className="w-3 h-3 flex-shrink-0" />
              <span className="line-clamp-1">
                {isStruggle ? 'Led to breakthrough: ' : 'Overcame: '}
                {relatedEntry.content.substring(0, 50)}...
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {formatDistanceToNow(new Date(entry.detected_at), { addSuffix: true })}
            {isMastered && entry.mastered_at && (
              <>
                <span className="text-muted-foreground/50">→</span>
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">
                  Mastered {formatDistanceToNow(new Date(entry.mastered_at), { addSuffix: true })}
                </span>
              </>
            )}
          </div>
          
          {/* Action buttons - show on hover or when selected */}
          <div className={`flex items-center gap-2 pt-1 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            {isStruggle && !isMastered && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPractice(entry);
                  }}
                >
                  <Dumbbell className="w-3 h-3" />
                  Practice
                </Button>
                {onMarkMastered && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1.5 text-emerald-400 border-emerald-400/30 hover:bg-emerald-400/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkMastered(entry);
                    }}
                  >
                    <Trophy className="w-3 h-3" />
                    Mark Mastered
                  </Button>
                )}
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={(e) => {
                e.stopPropagation();
                onAskTutor(entry);
              }}
            >
              <MessageSquare className="w-3 h-3" />
              Ask Tutor
            </Button>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive h-8 w-8 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(entry.id);
          }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
