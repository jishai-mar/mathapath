import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import MathRenderer from '@/components/MathRenderer';
import { useBookmarks, Bookmark, BookmarkType } from '@/hooks/useBookmarks';
import { 
  Bookmark as BookmarkIcon, 
  Trash2, 
  Edit2, 
  Check, 
  X,
  Lightbulb,
  Calculator,
  FileText,
  BookOpen,
  StickyNote,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const typeConfig: Record<BookmarkType, { icon: React.ReactNode; label: string; color: string }> = {
  definition: { 
    icon: <BookOpen className="w-3 h-3" />, 
    label: 'Definition',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
  },
  rule: { 
    icon: <Lightbulb className="w-3 h-3" />, 
    label: 'Key Rule',
    color: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
  },
  formula: { 
    icon: <Calculator className="w-3 h-3" />, 
    label: 'Formula',
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/20'
  },
  example: { 
    icon: <FileText className="w-3 h-3" />, 
    label: 'Example',
    color: 'bg-green-500/10 text-green-500 border-green-500/20'
  },
  note: { 
    icon: <StickyNote className="w-3 h-3" />, 
    label: 'Note',
    color: 'bg-rose-500/10 text-rose-500 border-rose-500/20'
  },
};

interface BookmarksListProps {
  className?: string;
  showHeader?: boolean;
  maxHeight?: string;
}

export function BookmarksList({ 
  className = '', 
  showHeader = true,
  maxHeight = '400px',
}: BookmarksListProps) {
  const { bookmarks, isLoading, removeBookmark, updateBookmarkNote } = useBookmarks();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');
  const [filterType, setFilterType] = useState<BookmarkType | 'all'>('all');

  const filteredBookmarks = filterType === 'all' 
    ? bookmarks 
    : bookmarks.filter(b => b.bookmark_type === filterType);

  const handleEditStart = (bookmark: Bookmark) => {
    setEditingId(bookmark.id);
    setEditNote(bookmark.note || '');
  };

  const handleEditSave = async (bookmarkId: string) => {
    await updateBookmarkNote(bookmarkId, editNote);
    setEditingId(null);
    setEditNote('');
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditNote('');
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading bookmarks...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookmarkIcon className="w-5 h-5 text-primary" />
            Saved Bookmarks
            <Badge variant="secondary" className="ml-auto">
              {bookmarks.length}
            </Badge>
          </CardTitle>
        </CardHeader>
      )}
      
      <CardContent className="pt-0">
        {/* Filter tabs */}
        <div className="flex flex-wrap gap-1 mb-4">
          <Button
            variant={filterType === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilterType('all')}
            className="h-7 text-xs"
          >
            All
          </Button>
          {(Object.keys(typeConfig) as BookmarkType[]).map((type) => (
            <Button
              key={type}
              variant={filterType === type ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilterType(type)}
              className="h-7 text-xs gap-1"
            >
              {typeConfig[type].icon}
              {typeConfig[type].label}
            </Button>
          ))}
        </div>

        {filteredBookmarks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookmarkIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No bookmarks yet</p>
            <p className="text-xs mt-1">Save parts of theory to review later</p>
          </div>
        ) : (
          <ScrollArea style={{ maxHeight }}>
            <div className="space-y-3 pr-3">
              <AnimatePresence mode="popLayout">
                {filteredBookmarks.map((bookmark) => (
                  <motion.div
                    key={bookmark.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-3 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] gap-1 ${typeConfig[bookmark.bookmark_type as BookmarkType]?.color || ''}`}
                        >
                          {typeConfig[bookmark.bookmark_type as BookmarkType]?.icon}
                          {typeConfig[bookmark.bookmark_type as BookmarkType]?.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {bookmark.subtopic_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditStart(bookmark)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBookmark(bookmark.id)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-sm text-foreground">
                      <MathRenderer latex={bookmark.content} />
                    </div>

                    {editingId === bookmark.id ? (
                      <div className="mt-2 space-y-2">
                        <Textarea
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          placeholder="Add a note..."
                          className="text-xs min-h-[50px]"
                        />
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleEditCancel}
                            className="h-6 px-2"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleEditSave(bookmark.id)}
                            className="h-6 px-2"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : bookmark.note ? (
                      <div className="mt-2 p-2 rounded bg-secondary/50 text-xs text-muted-foreground italic">
                        📝 {bookmark.note}
                      </div>
                    ) : null}

                    <div className="mt-2 text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(bookmark.created_at), { addSuffix: true })}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
