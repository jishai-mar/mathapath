import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type BookmarkType = 'definition' | 'rule' | 'formula' | 'example' | 'note';

export interface Bookmark {
  id: string;
  user_id: string;
  subtopic_id: string | null;
  subtopic_name: string;
  bookmark_type: BookmarkType;
  content: string;
  note: string | null;
  created_at: string;
}

interface UseBookmarksOptions {
  subtopicId?: string;
  autoFetch?: boolean;
}

export function useBookmarks(options: UseBookmarksOptions = {}) {
  const { subtopicId, autoFetch = true } = options;
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBookmarks = useCallback(async () => {
    if (!user) {
      setBookmarks([]);
      return;
    }

    setIsLoading(true);
    try {
      let query = supabase
        .from('theory_bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (subtopicId) {
        query = query.eq('subtopic_id', subtopicId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setBookmarks((data as Bookmark[]) || []);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, subtopicId]);

  useEffect(() => {
    if (autoFetch) {
      fetchBookmarks();
    }
  }, [autoFetch, fetchBookmarks]);

  const addBookmark = useCallback(async (
    subtopicName: string,
    bookmarkType: BookmarkType,
    content: string,
    note?: string,
    subtopicIdOverride?: string
  ): Promise<Bookmark | null> => {
    if (!user) {
      toast.error('Please sign in to save bookmarks');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('theory_bookmarks')
        .insert({
          user_id: user.id,
          subtopic_id: subtopicIdOverride || subtopicId || null,
          subtopic_name: subtopicName,
          bookmark_type: bookmarkType,
          content,
          note: note || null,
        })
        .select()
        .single();

      if (error) throw error;

      const newBookmark = data as Bookmark;
      setBookmarks(prev => [newBookmark, ...prev]);
      toast.success('Bookmark saved!');
      return newBookmark;
    } catch (error) {
      console.error('Error adding bookmark:', error);
      toast.error('Failed to save bookmark');
      return null;
    }
  }, [user, subtopicId]);

  const updateBookmarkNote = useCallback(async (
    bookmarkId: string,
    note: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('theory_bookmarks')
        .update({ note })
        .eq('id', bookmarkId)
        .eq('user_id', user.id);

      if (error) throw error;

      setBookmarks(prev =>
        prev.map(b => b.id === bookmarkId ? { ...b, note } : b)
      );
      toast.success('Note updated');
      return true;
    } catch (error) {
      console.error('Error updating bookmark:', error);
      toast.error('Failed to update note');
      return false;
    }
  }, [user]);

  const removeBookmark = useCallback(async (bookmarkId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('theory_bookmarks')
        .delete()
        .eq('id', bookmarkId)
        .eq('user_id', user.id);

      if (error) throw error;

      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
      toast.success('Bookmark removed');
      return true;
    } catch (error) {
      console.error('Error removing bookmark:', error);
      toast.error('Failed to remove bookmark');
      return false;
    }
  }, [user]);

  const isBookmarked = useCallback((content: string): Bookmark | undefined => {
    return bookmarks.find(b => b.content === content);
  }, [bookmarks]);

  const getBookmarksByType = useCallback((type: BookmarkType): Bookmark[] => {
    return bookmarks.filter(b => b.bookmark_type === type);
  }, [bookmarks]);

  return {
    bookmarks,
    isLoading,
    addBookmark,
    updateBookmarkNote,
    removeBookmark,
    isBookmarked,
    getBookmarksByType,
    refetch: fetchBookmarks,
  };
}
