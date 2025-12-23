import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookmarksList } from '@/components/bookmark/BookmarksList';
import { ArrowLeft, Bookmark } from 'lucide-react';

export default function Bookmarks() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Bookmark className="w-8 h-8 text-primary" />
            My Bookmarks
          </h1>
          <p className="text-muted-foreground mt-2">
            Review saved definitions, formulas, and examples
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <BookmarksList maxHeight="calc(100vh - 250px)" />
        </motion.div>
      </div>
    </div>
  );
}
