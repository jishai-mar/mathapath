import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useNotebook, NotebookEntry } from '@/hooks/useNotebook';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Lightbulb, 
  AlertTriangle, 
  Sparkles, 
  Heart,
  Brain,
  Trash2,
  Filter,
  Pentagon,
  ArrowLeft,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';

type FilterType = 'all' | 'breakthrough' | 'struggle' | 'interest' | 'learning_style' | 'emotional';

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

function NotebookEntryCard({ entry, onDelete }: { entry: NotebookEntry; onDelete: (id: string) => void }) {
  const config = noteTypeConfig[entry.note_type] || noteTypeConfig.emotional;
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`group relative p-5 rounded-2xl border ${config.bgColor} backdrop-blur-sm transition-all hover:scale-[1.01]`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className={`p-2.5 rounded-xl ${config.bgColor} ${config.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={`${config.color} border-current/20`}>
                {config.label}
              </Badge>
              {entry.subtopic_name && (
                <Badge variant="secondary" className="text-xs">
                  {entry.subtopic_name}
                </Badge>
              )}
            </div>
            <p className="text-foreground leading-relaxed">{entry.content}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              {formatDistanceToNow(new Date(entry.detected_at), { addSuffix: true })}
              <span className="text-muted-foreground/50">•</span>
              {format(new Date(entry.detected_at), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(entry.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

export default function Notebook() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { entries, stats, isLoading, deleteEntry } = useNotebook();
  const [filter, setFilter] = useState<FilterType>('all');

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleDelete = async (id: string) => {
    const success = await deleteEntry(id);
    if (success) {
      toast.success('Entry deleted');
    } else {
      toast.error('Failed to delete entry');
    }
  };

  const filteredEntries = filter === 'all' 
    ? entries 
    : entries.filter(e => e.note_type === filter);

  const filterOptions: { value: FilterType; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: stats.totalEntries },
    { value: 'breakthrough', label: 'Breakthroughs', count: stats.breakthroughs },
    { value: 'struggle', label: 'Challenges', count: stats.struggles },
    { value: 'interest', label: 'Interests', count: stats.interests },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradient effects */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 15% 50%, hsla(239, 84%, 67%, 0.08) 0%, transparent 25%), radial-gradient(circle at 85% 30%, hsla(160, 84%, 39%, 0.05) 0%, transparent 25%)',
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary ring-1 ring-white/5">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-serif font-medium text-foreground">My Notebook</h1>
                <p className="text-xs text-muted-foreground">Learning journey insights</p>
              </div>
            </div>
          </div>
          
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <Pentagon className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">MathMastery</span>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="glass rounded-2xl p-5 text-center">
            <div className="text-3xl font-bold text-foreground">{stats.totalEntries}</div>
            <div className="text-sm text-muted-foreground">Total Insights</div>
          </div>
          <div className="glass rounded-2xl p-5 text-center border-emerald-500/20">
            <div className="text-3xl font-bold text-emerald-400">{stats.breakthroughs}</div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" /> Breakthroughs
            </div>
          </div>
          <div className="glass rounded-2xl p-5 text-center border-amber-500/20">
            <div className="text-3xl font-bold text-amber-400">{stats.struggles}</div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3" /> Challenges
            </div>
          </div>
          <div className="glass rounded-2xl p-5 text-center border-pink-500/20">
            <div className="text-3xl font-bold text-pink-400">{stats.interests}</div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <Heart className="w-3 h-3" /> Interests
            </div>
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          {filterOptions.map(option => (
            <Button
              key={option.value}
              variant={filter === option.value ? 'default' : 'outline'}
              size="sm"
              className="rounded-full whitespace-nowrap"
              onClick={() => setFilter(option.value)}
            >
              {option.label}
              <span className="ml-1.5 text-xs opacity-70">({option.count})</span>
            </Button>
          ))}
        </div>

        {/* Entries List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 space-y-4"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium text-foreground">No entries yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your learning insights, breakthroughs, and discoveries will appear here as you practice with your tutor.
            </p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Start Learning
            </Button>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-4">
              {filteredEntries.map(entry => (
                <NotebookEntryCard 
                  key={entry.id} 
                  entry={entry} 
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
