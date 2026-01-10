import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Heart, Send, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { PerspectiveMaps } from './PerspectiveMaps';
import { PerspectiveArguments } from './PerspectiveArguments';

type PerspectiveChoice = 'current' | 'two-state' | null;

interface PerspectiveInterestCardProps {
  onSaveReflection: (reflection: string, perspective: PerspectiveChoice) => Promise<void>;
}

export function PerspectiveInterestCard({ onSaveReflection }: PerspectiveInterestCardProps) {
  const [selectedPerspective, setSelectedPerspective] = useState<PerspectiveChoice>(null);
  const [reflectionText, setReflectionText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async () => {
    if (!reflectionText.trim() || !selectedPerspective) return;
    
    setIsSaving(true);
    try {
      await onSaveReflection(reflectionText, selectedPerspective);
      setIsSaved(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative p-5 rounded-xl border bg-pink-500/10 border-pink-500/20"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-lg bg-pink-500/20 text-pink-400 flex-shrink-0">
          <Globe className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-pink-400 border-pink-400/30 text-xs">
              <Heart className="w-3 h-3 mr-1" />
              Interest
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Exploration
            </Badge>
          </div>
          <h3 className="text-base font-medium text-foreground">
            Israel & Palestine – Exploring Perspectives
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            A neutral exploration of different viewpoints. No right or wrong answers.
          </p>
        </div>
      </div>

      {/* Maps Section */}
      <PerspectiveMaps className="mb-5" />

      {/* Question */}
      <div className="text-center mb-4">
        <p className="text-sm text-foreground font-medium">
          Which perspective do you find more convincing?
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          This is for reflection only – there's no "correct" choice
        </p>
      </div>

      {/* Selection Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
        <Button
          variant={selectedPerspective === 'current' ? 'default' : 'outline'}
          size="sm"
          className={`gap-2 ${
            selectedPerspective === 'current' 
              ? 'bg-slate-600 hover:bg-slate-700 text-white' 
              : 'border-slate-500/30 text-slate-400 hover:bg-slate-500/10'
          }`}
          onClick={() => setSelectedPerspective('current')}
          disabled={isSaved}
        >
          <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
            selectedPerspective === 'current' ? 'border-white bg-white' : 'border-current'
          }`}>
            {selectedPerspective === 'current' && <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />}
          </div>
          Current situation
        </Button>
        <Button
          variant={selectedPerspective === 'two-state' ? 'default' : 'outline'}
          size="sm"
          className={`gap-2 ${
            selectedPerspective === 'two-state' 
              ? 'bg-teal-600 hover:bg-teal-700 text-white' 
              : 'border-teal-500/30 text-teal-400 hover:bg-teal-500/10'
          }`}
          onClick={() => setSelectedPerspective('two-state')}
          disabled={isSaved}
        >
          <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
            selectedPerspective === 'two-state' ? 'border-white bg-white' : 'border-current'
          }`}>
            {selectedPerspective === 'two-state' && <div className="w-1.5 h-1.5 rounded-full bg-teal-600" />}
          </div>
          Two-state solution
        </Button>
      </div>

      {/* Expanded Content - Arguments */}
      <AnimatePresence>
        {selectedPerspective && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="border-t border-pink-500/20 pt-5 mt-2 space-y-5">
              {/* Arguments Section */}
              <PerspectiveArguments />

              {/* Reflection Section */}
              <div className="space-y-3">
                <div className="border-t border-pink-500/10 pt-4">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Why does this perspective resonate with you?
                  </label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Optional – your reflection is private and not shared
                  </p>
                  {isSaved ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-center"
                    >
                      <Check className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                      <p className="text-sm text-emerald-400 font-medium">Reflection saved to your notebook</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        You can find it in your Interests entries
                      </p>
                    </motion.div>
                  ) : (
                    <>
                      <Textarea
                        value={reflectionText}
                        onChange={(e) => setReflectionText(e.target.value)}
                        placeholder="Share your thoughts... (optional)"
                        className="min-h-[100px] bg-muted/30 border-muted-foreground/20 focus:border-pink-500/50 resize-none"
                      />
                      <div className="flex justify-end mt-3">
                        <Button
                          size="sm"
                          className="gap-2 bg-pink-600 hover:bg-pink-700 text-white"
                          onClick={handleSave}
                          disabled={!reflectionText.trim() || isSaving}
                        >
                          {isSaving ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Send className="w-3 h-3" />
                              Save Reflection
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
