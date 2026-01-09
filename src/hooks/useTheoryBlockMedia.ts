import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/hooks/useAuthenticatedFetch';

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

interface TheoryBlockMediaState {
  videoStatus: 'none' | 'pending' | 'processing' | 'ready' | 'failed';
  videoUrl: string | null;
  audioUrl: string | null;
  visualPlan: VisualPlan | null;
  generationMode: 'full' | 'fallback';
  generationError: string | null;
}

export function useTheoryBlockMedia(blockId: string) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateMedia = useCallback(async (): Promise<TheoryBlockMediaState | null> => {
    setIsGenerating(true);
    
    try {
      // Call the edge function to generate media
      const response = await authenticatedFetch('generate-theory-media', {
        method: 'POST',
        body: JSON.stringify({ theoryBlockId: blockId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate media');
      }

      const result = await response.json();
      
      toast({
        title: 'Media Generated',
        description: `Narration for ${result.blockNumber} is ready`,
      });

      return {
        videoStatus: 'ready',
        videoUrl: null,
        audioUrl: result.audioUrl,
        visualPlan: result.visualPlan,
        generationMode: 'fallback',
        generationError: null,
      };

    } catch (error) {
      console.error('Failed to generate theory media:', error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [blockId, toast]);

  const fetchMediaStatus = useCallback(async (): Promise<TheoryBlockMediaState | null> => {
    try {
      const { data, error } = await supabase
        .from('theory_blocks')
        .select('video_status, video_url, audio_url, visual_plan, generation_mode, generation_error')
        .eq('id', blockId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        videoStatus: (data.video_status as TheoryBlockMediaState['videoStatus']) || 'none',
        videoUrl: data.video_url,
        audioUrl: data.audio_url,
        visualPlan: data.visual_plan as unknown as VisualPlan | null,
        generationMode: (data.generation_mode as 'full' | 'fallback') || 'fallback',
        generationError: data.generation_error,
      };
    } catch (error) {
      console.error('Failed to fetch media status:', error);
      return null;
    }
  }, [blockId]);

  return {
    generateMedia,
    fetchMediaStatus,
    isGenerating,
  };
}
