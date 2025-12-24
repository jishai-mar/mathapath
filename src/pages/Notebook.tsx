import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useNotebook, NotebookEntry } from '@/hooks/useNotebook';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Sparkles, 
  AlertTriangle,
  Heart,
  Filter,
  Pentagon,
  ArrowLeft,
  TrendingUp,
  PanelRightOpen,
  PanelRightClose,
  Trophy,
  Target,
  Zap,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { NotebookSearch } from '@/components/notebook/NotebookSearch';
import { NotebookEntryCard } from '@/components/notebook/NotebookEntryCard';
import { NotebookTutor } from '@/components/notebook/NotebookTutor';
import { XPDisplay } from '@/components/notebook/XPDisplay';

type FilterType = 'all' | 'breakthrough' | 'struggle' | 'interest' | 'mastered' | 'worked_example';

export default function Notebook() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { entries, stats, isLoading, deleteEntry, markAsMastered, getRelatedEntry, updatePersonalNote } = useNotebook();
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<NotebookEntry | null>(null);
  const [showTutor, setShowTutor] = useState(true);

  // Calculate mastery progress percentage
  const masteryProgress = stats.struggles > 0 
    ? Math.round((stats.masteredStruggles / stats.struggles) * 100) 
    : 0;

  // Count worked examples
  const workedExamplesCount = useMemo(() => 
    entries.filter(e => e.note_type === 'worked_example').length,
    [entries]
  );

  // Filter and search entries
  const filteredEntries = useMemo(() => {
    let result = entries;
    
    // Apply type filter
    if (filter === 'mastered') {
      result = result.filter(e => e.note_type === 'struggle' && e.mastered_at !== null);
    } else if (filter === 'worked_example') {
      result = result.filter(e => e.note_type === 'worked_example');
    } else if (filter !== 'all') {
      result = result.filter(e => e.note_type === filter);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e => 
        e.content.toLowerCase().includes(query) ||
        (e.subtopic_name && e.subtopic_name.toLowerCase().includes(query)) ||
        e.note_type.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [entries, filter, searchQuery]);

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
      if (selectedEntry?.id === id) {
        setSelectedEntry(null);
      }
    } else {
      toast.error('Failed to delete entry');
    }
  };

  const handleMarkMastered = async (entry: NotebookEntry) => {
    const result = await markAsMastered(entry.id, true);
    if (result.success) {
      toast.success(`Challenge mastered! +${result.xpEarned} XP 🎉`, {
        description: 'Keep conquering your challenges to earn more XP!',
      });
    } else {
      toast.error('Failed to mark as mastered');
    }
  };

  const handlePractice = (entry: NotebookEntry) => {
    setSelectedEntry(entry);
    setShowTutor(true);
  };

  const handleAskTutor = (entry: NotebookEntry) => {
    setSelectedEntry(entry);
    setShowTutor(true);
  };

  const filterOptions: { value: FilterType; label: string; count: number; icon?: typeof Sparkles }[] = [
    { value: 'all', label: 'All', count: stats.totalEntries },
    { value: 'worked_example', label: 'Solutions', count: workedExamplesCount, icon: FileText },
    { value: 'breakthrough', label: 'Breakthroughs', count: stats.breakthroughs, icon: Sparkles },
    { value: 'struggle', label: 'Challenges', count: stats.struggles, icon: AlertTriangle },
    { value: 'mastered', label: 'Mastered', count: stats.masteredStruggles, icon: Trophy },
    { value: 'interest', label: 'Interests', count: stats.interests, icon: Heart },
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
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
                <p className="text-xs text-muted-foreground">Interactive learning hub</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <XPDisplay compact />
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setShowTutor(!showTutor)}
            >
              {showTutor ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
              <span className="hidden sm:inline">{showTutor ? 'Hide' : 'Show'} Tutor</span>
            </Button>
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Pentagon className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">MathMastery</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* Main Content - Entries */}
        <main className={`flex-1 px-4 sm:px-6 py-6 space-y-6 transition-all ${showTutor ? 'lg:pr-0' : ''}`}>
          {/* Progress Card - Struggle to Breakthrough */}
          {stats.struggles > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-5 border border-border/50"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 flex items-center justify-center">
                    <Target className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Struggle → Breakthrough Progress</h3>
                    <p className="text-xs text-muted-foreground">
                      {stats.masteredStruggles} of {stats.struggles} challenges mastered
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-emerald-400">{masteryProgress}%</div>
                  <div className="text-xs text-muted-foreground">Mastery Rate</div>
                </div>
              </div>
              <Progress 
                value={masteryProgress} 
                className="h-3 bg-amber-500/20" 
              />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  {stats.activeStruggles} active
                </span>
                <span className="flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-emerald-400" />
                  {stats.masteredStruggles} mastered
                </span>
              </div>
            </motion.div>
          )}

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            <div className="glass rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{stats.totalEntries}</div>
              <div className="text-xs text-muted-foreground">Total Insights</div>
            </div>
            <div className="glass rounded-xl p-4 text-center border-emerald-500/20">
              <div className="text-2xl font-bold text-emerald-400">{stats.breakthroughs}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3" /> Breakthroughs
              </div>
            </div>
            <div className="glass rounded-xl p-4 text-center border-amber-500/20">
              <div className="flex items-center justify-center gap-2">
                <div className="text-2xl font-bold text-amber-400">{stats.activeStruggles}</div>
                {stats.masteredStruggles > 0 && (
                  <div className="text-sm text-emerald-400">+{stats.masteredStruggles} ✓</div>
                )}
              </div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3" /> Challenges
              </div>
            </div>
            <div className="glass rounded-xl p-4 text-center border-pink-500/20">
              <div className="text-2xl font-bold text-pink-400">{stats.interests}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Heart className="w-3 h-3" /> Interests
              </div>
            </div>
          </motion.div>

          {/* Search Bar */}
          <NotebookSearch value={searchQuery} onChange={setSearchQuery} />

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            {filterOptions.map(option => (
              <Button
                key={option.value}
                variant={filter === option.value ? 'default' : 'outline'}
                size="sm"
                className={`rounded-full whitespace-nowrap text-xs gap-1.5 ${
                  option.value === 'mastered' && filter !== 'mastered' 
                    ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10' 
                    : ''
                }`}
                onClick={() => setFilter(option.value)}
              >
                {option.icon && <option.icon className="w-3 h-3" />}
                {option.label}
                <span className="opacity-70">({option.count})</span>
              </Button>
            ))}
          </div>

          {/* Entries List */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : filteredEntries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 space-y-4"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground">
                {searchQuery ? 'No matching entries' : filter === 'mastered' ? 'No mastered challenges yet' : filter === 'worked_example' ? 'No saved solutions yet' : 'No entries yet'}
              </h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                {searchQuery 
                  ? 'Try a different search term or clear your filters.'
                  : filter === 'mastered'
                  ? 'Practice your challenges and mark them as mastered when you\'ve conquered them!'
                  : filter === 'worked_example'
                  ? 'Save step-by-step solutions from exercises to review them here.'
                  : 'Your learning insights will appear here as you practice with your tutor.'}
              </p>
              {!searchQuery && filter === 'all' && (
                <Button onClick={() => navigate('/')} className="mt-4">
                  Start Learning
                </Button>
              )}
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-3">
                {filteredEntries.map(entry => (
                  <NotebookEntryCard 
                    key={entry.id} 
                    entry={entry}
                    isSelected={selectedEntry?.id === entry.id}
                    relatedEntry={getRelatedEntry(entry.id)}
                    onSelect={setSelectedEntry}
                    onDelete={handleDelete}
                    onPractice={handlePractice}
                    onAskTutor={handleAskTutor}
                    onMarkMastered={handleMarkMastered}
                    onUpdatePersonalNote={updatePersonalNote}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}
        </main>

        {/* Tutor Panel - Right Side */}
        <AnimatePresence>
          {showTutor && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 400, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="hidden lg:block sticky top-[73px] h-[calc(100vh-73px)] border-l border-border/50 overflow-hidden"
            >
              <div className="h-full p-4">
                <NotebookTutor 
                  selectedEntry={selectedEntry}
                  allEntries={entries}
                />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Tutor - Bottom Sheet */}
      <AnimatePresence>
        {showTutor && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="lg:hidden fixed bottom-0 left-0 right-0 h-[50vh] border-t border-border bg-background z-50"
          >
            <NotebookTutor 
              selectedEntry={selectedEntry}
              allEntries={entries}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
