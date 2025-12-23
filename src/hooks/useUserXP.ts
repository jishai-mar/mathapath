import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useUserXP() {
  const { user } = useAuth();
  const [totalXp, setTotalXp] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchXP = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('total_xp')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching XP:', error);
        return;
      }

      setTotalXp(data?.total_xp || 0);
    } catch (err) {
      console.error('Error in fetchXP:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchXP();
  }, [fetchXP]);

  // Calculate level from XP (every 500 XP = 1 level)
  const level = Math.floor(totalXp / 500) + 1;
  const xpInCurrentLevel = totalXp % 500;
  const xpForNextLevel = 500;
  const progressToNextLevel = (xpInCurrentLevel / xpForNextLevel) * 100;

  return {
    totalXp,
    level,
    xpInCurrentLevel,
    xpForNextLevel,
    progressToNextLevel,
    isLoading,
    refetch: fetchXP,
  };
}
