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
  MessageSquare
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
  onSelect: (entry: NotebookEntry) => void;
  onDelete: (id: string) => void;
  onPractice: (entry: NotebookEntry) => void;
  onAskTutor: (entry: NotebookEntry) => void;
}

export function NotebookEntryCard({ 
  entry, 
  isSelected, 
  onSelect, 
  onDelete, 
  onPractice,
  onAskTutor 
}: NotebookEntryCardProps) {
  const config = noteTypeConfig[entry.note_type] || noteTypeConfig.emotional;
  const Icon = config.icon;
  const isStruggle = entry.note_type === 'struggle';

  // Check if content contains math (LaTeX patterns)
  const hasMath = /\$.*?\$|\\\[.*?\\\]|\\\(.*?\\\)/s.test(entry.content);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => onSelect(entry)}
      className={`group relative p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${config.bgColor} ${
        isSelected ? 'ring-2 ring-primary/50 shadow-lg' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${config.bgColor} ${config.color} flex-shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
        
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={`${config.color} border-current/20 text-xs`}>
              {config.label}
            </Badge>
            {entry.subtopic_name && (
              <Badge variant="secondary" className="text-xs">
                {entry.subtopic_name}
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
          
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            {formatDistanceToNow(new Date(entry.detected_at), { addSuffix: true })}
          </p>
          
          {/* Action buttons - show on hover or when selected */}
          <div className={`flex items-center gap-2 pt-1 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            {isStruggle && (
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
