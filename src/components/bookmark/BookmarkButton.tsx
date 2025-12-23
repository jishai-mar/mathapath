import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Bookmark, BookmarkCheck, X } from 'lucide-react';
import { useBookmarks, BookmarkType, Bookmark as BookmarkData } from '@/hooks/useBookmarks';

interface BookmarkButtonProps {
  subtopicName: string;
  subtopicId?: string;
  bookmarkType: BookmarkType;
  content: string;
  size?: 'sm' | 'default';
  variant?: 'ghost' | 'outline' | 'secondary';
  className?: string;
}

export function BookmarkButton({
  subtopicName,
  subtopicId,
  bookmarkType,
  content,
  size = 'sm',
  variant = 'ghost',
  className = '',
}: BookmarkButtonProps) {
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks({ 
    subtopicId,
    autoFetch: true 
  });
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const existingBookmark = isBookmarked(content);
  const isAlreadyBookmarked = !!existingBookmark;

  const handleBookmark = async () => {
    if (isAlreadyBookmarked && existingBookmark) {
      setIsLoading(true);
      await removeBookmark(existingBookmark.id);
      setIsLoading(false);
      return;
    }

    setIsOpen(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    await addBookmark(subtopicName, bookmarkType, content, note, subtopicId);
    setIsLoading(false);
    setNote('');
    setIsOpen(false);
  };

  const handleQuickSave = async () => {
    setIsLoading(true);
    await addBookmark(subtopicName, bookmarkType, content, undefined, subtopicId);
    setIsLoading(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          size={size}
          onClick={handleBookmark}
          disabled={isLoading}
          className={`${className} ${isAlreadyBookmarked ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <motion.div
            animate={isAlreadyBookmarked ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            {isAlreadyBookmarked ? (
              <BookmarkCheck className="w-4 h-4" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </motion.div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Save Bookmark</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground line-clamp-2">
            {content.substring(0, 100)}...
          </p>

          <Textarea
            placeholder="Add a note (optional)..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="text-sm min-h-[60px]"
          />

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleQuickSave}
              disabled={isLoading}
              className="flex-1"
            >
              Quick Save
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1"
            >
              Save with Note
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
