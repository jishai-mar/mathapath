import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type ItemCategory = 'accessory' | 'outfit' | 'background' | 'effect';
export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface CustomizationItem {
  id: string;
  category: ItemCategory;
  name: string;
  description: string | null;
  icon_key: string;
  rarity: ItemRarity;
  unlock_requirement_type: 'xp' | 'streak' | 'exercises' | 'mastery' | 'topic_complete';
  unlock_requirement_value: number;
  is_premium: boolean;
  order_index: number;
}

export interface UnlockedItem {
  id: string;
  item_id: string;
  unlocked_at: string;
  is_equipped: boolean;
  item: CustomizationItem;
}

export interface UserStats {
  total_xp: number;
  current_streak: number;
  exercises_completed: number;
  topics_completed: number;
  overall_mastery: number;
}

export function useUnlockableItems() {
  const { user } = useAuth();
  const [allItems, setAllItems] = useState<CustomizationItem[]>([]);
  const [unlockedItems, setUnlockedItems] = useState<UnlockedItem[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [newlyUnlocked, setNewlyUnlocked] = useState<CustomizationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllItems = useCallback(async () => {
    const { data, error } = await supabase
      .from('tutor_customization_items')
      .select('*')
      .order('category')
      .order('order_index');
    
    if (!error && data) {
      setAllItems(data as CustomizationItem[]);
    }
  }, []);

  const fetchUnlockedItems = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('user_unlocked_items')
      .select(`
        id,
        item_id,
        unlocked_at,
        is_equipped,
        item:tutor_customization_items(*)
      `)
      .eq('user_id', user.id);
    
    if (!error && data) {
      setUnlockedItems(data.map(d => ({
        ...d,
        item: d.item as unknown as CustomizationItem
      })));
    }
  }, [user]);

  const fetchUserStats = useCallback(async () => {
    if (!user) return;
    
    // Fetch profile for XP and streak
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_xp, current_streak')
      .eq('id', user.id)
      .single();

    // Fetch exercise attempts count
    const { count: exerciseCount } = await supabase
      .from('exercise_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Fetch topics with high mastery (>80%)
    const { data: topicProgress } = await supabase
      .from('user_topic_progress')
      .select('mastery_percentage')
      .eq('user_id', user.id)
      .gte('mastery_percentage', 80);

    const stats: UserStats = {
      total_xp: profile?.total_xp || 0,
      current_streak: profile?.current_streak || 0,
      exercises_completed: exerciseCount || 0,
      topics_completed: topicProgress?.length || 0,
      overall_mastery: 0
    };

    setUserStats(stats);
  }, [user]);

  const checkForNewUnlocks = useCallback(async () => {
    if (!user || !userStats || allItems.length === 0) return;

    const unlockedItemIds = new Set(unlockedItems.map(ui => ui.item_id));
    const newUnlocks: CustomizationItem[] = [];

    for (const item of allItems) {
      if (unlockedItemIds.has(item.id)) continue;
      if (item.is_premium) continue;

      let shouldUnlock = false;
      
      switch (item.unlock_requirement_type) {
        case 'xp':
          shouldUnlock = userStats.total_xp >= item.unlock_requirement_value;
          break;
        case 'streak':
          shouldUnlock = userStats.current_streak >= item.unlock_requirement_value;
          break;
        case 'exercises':
          shouldUnlock = userStats.exercises_completed >= item.unlock_requirement_value;
          break;
        case 'topic_complete':
          shouldUnlock = userStats.topics_completed >= item.unlock_requirement_value;
          break;
        case 'mastery':
          shouldUnlock = userStats.overall_mastery >= item.unlock_requirement_value;
          break;
      }

      if (shouldUnlock) {
        // Insert the unlock record
        const { error } = await supabase
          .from('user_unlocked_items')
          .insert({
            user_id: user.id,
            item_id: item.id
          });

        if (!error) {
          newUnlocks.push(item);
        }
      }
    }

    if (newUnlocks.length > 0) {
      setNewlyUnlocked(newUnlocks);
      await fetchUnlockedItems();
    }
  }, [user, userStats, allItems, unlockedItems, fetchUnlockedItems]);

  const equipItem = useCallback(async (itemId: string, category: ItemCategory) => {
    if (!user) return false;

    // First, unequip any currently equipped item in this category
    const currentlyEquipped = unlockedItems.find(
      ui => ui.item.category === category && ui.is_equipped
    );

    if (currentlyEquipped) {
      await supabase
        .from('user_unlocked_items')
        .update({ is_equipped: false })
        .eq('id', currentlyEquipped.id);
    }

    // Equip the new item
    const { error } = await supabase
      .from('user_unlocked_items')
      .update({ is_equipped: true })
      .eq('user_id', user.id)
      .eq('item_id', itemId);

    // Update tutor preferences with equipped item
    const columnMap: Record<ItemCategory, string> = {
      accessory: 'equipped_accessory',
      outfit: 'equipped_outfit',
      background: 'equipped_background',
      effect: 'equipped_effect'
    };

    await supabase
      .from('user_tutor_preferences')
      .update({ [columnMap[category]]: itemId })
      .eq('user_id', user.id);

    if (!error) {
      await fetchUnlockedItems();
      return true;
    }
    return false;
  }, [user, unlockedItems, fetchUnlockedItems]);

  const unequipItem = useCallback(async (itemId: string, category: ItemCategory) => {
    if (!user) return false;

    const { error } = await supabase
      .from('user_unlocked_items')
      .update({ is_equipped: false })
      .eq('user_id', user.id)
      .eq('item_id', itemId);

    // Clear from tutor preferences
    const columnMap: Record<ItemCategory, string> = {
      accessory: 'equipped_accessory',
      outfit: 'equipped_outfit',
      background: 'equipped_background',
      effect: 'equipped_effect'
    };

    await supabase
      .from('user_tutor_preferences')
      .update({ [columnMap[category]]: null })
      .eq('user_id', user.id);

    if (!error) {
      await fetchUnlockedItems();
      return true;
    }
    return false;
  }, [user, fetchUnlockedItems]);

  const clearNewlyUnlocked = useCallback(() => {
    setNewlyUnlocked([]);
  }, []);

  const isItemUnlocked = useCallback((itemId: string) => {
    return unlockedItems.some(ui => ui.item_id === itemId);
  }, [unlockedItems]);

  const getEquippedItem = useCallback((category: ItemCategory) => {
    return unlockedItems.find(ui => ui.item.category === category && ui.is_equipped);
  }, [unlockedItems]);

  const getItemsByCategory = useCallback((category: ItemCategory) => {
    return allItems.filter(item => item.category === category);
  }, [allItems]);

  const getProgressToUnlock = useCallback((item: CustomizationItem) => {
    if (!userStats) return { current: 0, required: item.unlock_requirement_value, percentage: 0 };
    
    let current = 0;
    switch (item.unlock_requirement_type) {
      case 'xp':
        current = userStats.total_xp;
        break;
      case 'streak':
        current = userStats.current_streak;
        break;
      case 'exercises':
        current = userStats.exercises_completed;
        break;
      case 'topic_complete':
        current = userStats.topics_completed;
        break;
      case 'mastery':
        current = userStats.overall_mastery;
        break;
    }

    return {
      current,
      required: item.unlock_requirement_value,
      percentage: Math.min(100, (current / item.unlock_requirement_value) * 100)
    };
  }, [userStats]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchAllItems(),
        fetchUnlockedItems(),
        fetchUserStats()
      ]);
      setIsLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user, fetchAllItems, fetchUnlockedItems, fetchUserStats]);

  useEffect(() => {
    if (!isLoading && userStats && allItems.length > 0) {
      checkForNewUnlocks();
    }
  }, [isLoading, userStats, allItems, checkForNewUnlocks]);

  return {
    allItems,
    unlockedItems,
    userStats,
    newlyUnlocked,
    isLoading,
    equipItem,
    unequipItem,
    clearNewlyUnlocked,
    isItemUnlocked,
    getEquippedItem,
    getItemsByCategory,
    getProgressToUnlock,
    refreshData: async () => {
      await Promise.all([fetchUnlockedItems(), fetchUserStats()]);
      await checkForNewUnlocks();
    }
  };
}
