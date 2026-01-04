import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Link2,
  Zap,
  FileText,
  ChevronDown,
  ChevronUp,
  StickyNote,
  Edit3,
  Check,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import MathRenderer from '@/components/MathRenderer';
import { createSegmentsFromSolution } from '@/lib/solutionSegments';
import { NotebookEntry } from '@/hooks/useNotebook';
import { toast } from 'sonner';

// Calculate potential XP for mastering a struggle
function calculatePotentialXP(detectedAt: string): number {
  const daysStruggling = Math.ceil(
    (Date.now() - new Date(detectedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  return 50 + Math.min(daysStruggling * 10, 100);
}

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
  worked_example: {
    icon: FileText,
    label: 'Solution',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/20',
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
  onUpdatePersonalNote?: (id: string, note: string) => Promise<boolean>;
}

export function NotebookEntryCard({ 
  entry, 
  isSelected,
  relatedEntry,
  onSelect, 
  onDelete, 
  onPractice,
  onAskTutor,
  onMarkMastered,
  onUpdatePersonalNote
}: NotebookEntryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(entry.personal_note || '');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const config = noteTypeConfig[entry.note_type] || noteTypeConfig.emotional;
  const Icon = config.icon;
  const isStruggle = entry.note_type === 'struggle';
  const isMastered = isStruggle && entry.mastered_at !== null;
  const isFromStruggle = entry.note_type === 'breakthrough' && entry.related_entry_id !== null;
  const isWorkedExample = entry.note_type === 'worked_example';

  // Check if content contains math (LaTeX patterns)
  const hasMath = /\$.*?\$|\\\[.*?\\\]|\\\(.*?\\\)/s.test(entry.content);

  // Calculate days to mastery if applicable
  const daysToMastery = isMastered && entry.mastered_at
    ? Math.ceil((new Date(entry.mastered_at).getTime() - new Date(entry.detected_at).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Parse worked example content into sections
  const parseWorkedExample = (content: string) => {
    const sections: { title: string; content: string }[] = [];
    const lines = content.split('\n');
    let currentSection = { title: '', content: '' };
    
    for (const line of lines) {
      if (line.startsWith('📝 ') || line.startsWith('🔢 ') || line.startsWith('✅ ') || line.startsWith('💡 ')) {
        if (currentSection.title || currentSection.content) {
          sections.push(currentSection);
        }
        currentSection = { title: line, content: '' };
      } else if (line.trim()) {
        currentSection.content += (currentSection.content ? '\n' : '') + line;
      }
    }
    if (currentSection.title || currentSection.content) {
      sections.push(currentSection);
    }
    
    return sections;
  };

  const workedExampleSections = isWorkedExample ? parseWorkedExample(entry.content) : [];

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
          
          {/* Content display - special handling for worked examples */}
          {isWorkedExample ? (
            <div className="space-y-2">
              {/* Preview - always show first section */}
              {workedExampleSections.length > 0 && (
                <div className="text-sm text-foreground">
                  <div className="font-medium">{workedExampleSections[0].title}</div>
                  {workedExampleSections[0].content && (
                    <div className="mt-1">
                      {hasMath ? (
                        <MathRenderer segments={createSegmentsFromSolution(workedExampleSections[0].content)} />
                      ) : (
                        <p>{workedExampleSections[0].content}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Expand/collapse button */}
              {workedExampleSections.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 w-full justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Hide steps
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      Show {workedExampleSections.length - 1} more steps
                    </>
                  )}
                </Button>
              )}

              {/* Expanded content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3 overflow-hidden"
                  >
                    {workedExampleSections.slice(1).map((section, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`pl-3 border-l-2 ${
                          section.title.startsWith('✅') 
                            ? 'border-emerald-500/50 bg-emerald-500/5' 
                            : section.title.startsWith('💡')
                            ? 'border-amber-500/50 bg-amber-500/5'
                            : 'border-blue-500/30'
                        } rounded-r-lg py-2 pr-2`}
                      >
                        <div className="text-sm font-medium text-foreground">
                          {section.title}
                        </div>
                        {section.content && (
                          <div className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                            {hasMath || /\$.*?\$|\\\[.*?\\\]|\\\(.*?\\\)/s.test(section.content) ? (
                              <MathRenderer segments={createSegmentsFromSolution(section.content)} />
                            ) : (
                              section.content
                            )}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
          <div className="text-sm text-foreground leading-relaxed">
              {hasMath ? (
                <MathRenderer segments={createSegmentsFromSolution(entry.content)} />
              ) : (
                <p className="line-clamp-3">{entry.content}</p>
              )}
            </div>
          )}

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

          {/* Personal note section for worked examples */}
          {isWorkedExample && onUpdatePersonalNote && (
            <div className="mt-2">
              {isEditingNote ? (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add your personal notes here... (e.g., reminders, tips, or things to remember)"
                    className="min-h-[80px] text-sm bg-muted/30 border-muted-foreground/20 focus:border-blue-500/50"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="h-7 text-xs gap-1.5"
                      disabled={isSavingNote}
                      onClick={async (e) => {
                        e.stopPropagation();
                        setIsSavingNote(true);
                        const success = await onUpdatePersonalNote(entry.id, noteText);
                        setIsSavingNote(false);
                        if (success) {
                          setIsEditingNote(false);
                          toast.success('Note saved');
                        } else {
                          toast.error('Failed to save note');
                        }
                      }}
                    >
                      <Check className="w-3 h-3" />
                      {isSavingNote ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        setNoteText(entry.personal_note || '');
                        setIsEditingNote(false);
                      }}
                    >
                      <X className="w-3 h-3" />
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              ) : entry.personal_note ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 group/note"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-start gap-2">
                    <StickyNote className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-amber-400 mb-1">My Note</div>
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap">{entry.personal_note}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover/note:opacity-100 transition-opacity text-muted-foreground hover:text-amber-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditingNote(true);
                      }}
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-amber-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingNote(true);
                  }}
                >
                  <StickyNote className="w-3 h-3" />
                  Add personal note
                </Button>
              )}
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
                    className="h-7 text-xs gap-1.5 text-amber-400 border-amber-400/30 hover:bg-amber-400/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkMastered(entry);
                    }}
                  >
                    <Trophy className="w-3 h-3" />
                    Mark Mastered
                    <span className="flex items-center gap-0.5 ml-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                      <Zap className="w-2.5 h-2.5" />
                      +{calculatePotentialXP(entry.detected_at)}
                    </span>
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
