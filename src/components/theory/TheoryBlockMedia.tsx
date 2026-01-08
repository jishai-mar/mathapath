import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Loader2, RefreshCw, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import MathRenderer from '@/components/MathRenderer';
import { cn } from '@/lib/utils';

interface VisualPlanSegment {
  startTime: number;
  endTime: number;
  type: 'title' | 'definition' | 'formula' | 'step' | 'graph' | 'highlight' | 'recap';
  content: string;
  latex?: string;
  highlight?: string;
}

interface VisualPlan {
  totalDuration: number;
  segments: VisualPlanSegment[];
}

interface TheoryBlockMediaProps {
  blockId: string;
  blockNumber: string;
  blockTitle: string;
  videoStatus: 'none' | 'pending' | 'processing' | 'ready' | 'failed';
  videoUrl?: string | null;
  audioUrl?: string | null;
  visualPlan?: VisualPlan | null;
  generationMode?: 'full' | 'fallback';
  generationError?: string | null;
  onRegenerate?: () => void;
  isAdmin?: boolean;
}

export function TheoryBlockMedia({
  blockId,
  blockNumber,
  blockTitle,
  videoStatus,
  videoUrl,
  audioUrl,
  visualPlan,
  generationMode = 'fallback',
  generationError,
  onRegenerate,
  isAdmin = false
}: TheoryBlockMediaProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentSegment, setCurrentSegment] = useState<VisualPlanSegment | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle audio time updates
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      
      // Find current segment based on time
      if (visualPlan?.segments) {
        const segment = visualPlan.segments.find(
          s => audio.currentTime >= s.startTime && audio.currentTime < s.endTime
        );
        setCurrentSegment(segment || null);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      setCurrentSegment(null);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [visualPlan]);

  const togglePlayPause = () => {
    const media = generationMode === 'full' ? videoRef.current : audioRef.current;
    if (!media) return;

    if (isPlaying) {
      media.pause();
    } else {
      media.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const media = generationMode === 'full' ? videoRef.current : audioRef.current;
    if (!media) return;
    media.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Render based on status
  if (videoStatus === 'none') {
    if (!isAdmin) return null;
    return (
      <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">No media generated</span>
          <Button variant="outline" size="sm" onClick={onRegenerate}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Generate Media
          </Button>
        </div>
      </div>
    );
  }

  if (videoStatus === 'pending' || videoStatus === 'processing') {
    return (
      <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <div>
            <p className="text-sm font-medium">
              {videoStatus === 'pending' ? 'Video queued...' : 'Generating media...'}
            </p>
            <p className="text-xs text-muted-foreground">
              This may take a minute. You can read the theory content below.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (videoStatus === 'failed') {
    return (
      <div className="mt-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">Media generation failed</p>
            {generationError && (
              <p className="text-xs text-muted-foreground mt-1">{generationError}</p>
            )}
            {isAdmin && onRegenerate && (
              <Button variant="outline" size="sm" onClick={onRegenerate} className="mt-2">
                <RefreshCw className="w-4 h-4 mr-1" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Ready state - show player
  return (
    <div className="mt-4">
      {/* Play button when collapsed */}
      {!isExpanded && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="gap-2"
        >
          <Play className="w-4 h-4" />
          {audioUrl ? 'Play Narration' : 'View Animation'}
        </Button>
      )}

      {/* Expanded player */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
              {/* Close button */}
              <div className="flex justify-end mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsExpanded(false);
                    if (isPlaying) togglePlayPause();
                  }}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Full video mode */}
              {generationMode === 'full' && videoUrl && (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full rounded-lg"
                  controls
                />
              )}

              {/* Fallback mode: Audio + Animated visuals */}
              {generationMode === 'fallback' && (
                <>
                  {/* Hidden audio element */}
                  {audioUrl && (
                    <audio ref={audioRef} src={audioUrl} preload="metadata" />
                  )}

                  {/* Visual display area */}
                  <div className="min-h-[200px] bg-card rounded-lg border border-border p-6 mb-4 flex flex-col items-center justify-center">
                    <AnimatePresence mode="wait">
                      {currentSegment ? (
                        <motion.div
                          key={`${currentSegment.startTime}-${currentSegment.type}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="text-center space-y-4"
                        >
                          {/* Segment type badge */}
                          <span className={cn(
                            "px-2 py-1 text-xs font-medium rounded-full",
                            currentSegment.type === 'title' && "bg-primary/20 text-primary",
                            currentSegment.type === 'definition' && "bg-blue-500/20 text-blue-600",
                            currentSegment.type === 'formula' && "bg-purple-500/20 text-purple-600",
                            currentSegment.type === 'step' && "bg-green-500/20 text-green-600",
                            currentSegment.type === 'recap' && "bg-amber-500/20 text-amber-600"
                          )}>
                            {currentSegment.type}
                          </span>
                          
                          {/* Content */}
                          {currentSegment.latex ? (
                            <MathRenderer 
                              latex={currentSegment.latex} 
                              displayMode 
                              className="text-xl"
                            />
                          ) : (
                            <p className="text-lg font-medium">{currentSegment.content}</p>
                          )}
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center space-y-2"
                        >
                          <span className="px-2 py-1 text-xs font-mono bg-muted rounded">
                            {blockNumber}
                          </span>
                          <h3 className="text-lg font-semibold">{blockTitle}</h3>
                          <p className="text-sm text-muted-foreground">
                            Press play to start the narration
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Controls */}
                  <div className="space-y-3">
                    {/* Progress bar */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-12">
                        {formatTime(currentTime)}
                      </span>
                      <Progress 
                        value={duration > 0 ? (currentTime / duration) * 100 : 0} 
                        className="flex-1 h-2"
                      />
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {formatTime(duration)}
                      </span>
                    </div>

                    {/* Play/Pause and Volume */}
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={togglePlayPause}
                        disabled={!audioUrl}
                        className="gap-2"
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="w-4 h-4" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            Play
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleMute}
                        disabled={!audioUrl}
                      >
                        {isMuted ? (
                          <VolumeX className="w-4 h-4" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
