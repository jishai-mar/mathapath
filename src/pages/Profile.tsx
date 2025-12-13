import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calculator,
  User,
  Shield,
  CreditCard,
  Bell,
  Award,
  Pencil,
  LogOut,
  HardDrive
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import GeneralInfoTab from '@/components/profile/GeneralInfoTab';
import SecurityPrivacyTab from '@/components/profile/SecurityPrivacyTab';
import SubscriptionTab from '@/components/profile/SubscriptionTab';
import NotificationsTab from '@/components/profile/NotificationsTab';

type ProfileTab = 'general' | 'security' | 'subscription' | 'notifications';

interface ProfileData {
  display_name: string | null;
  total_xp: number;
  current_streak: number;
  created_at: string;
}

export default function Profile() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<ProfileTab>('general');
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name, total_xp, current_streak, created_at')
        .eq('id', user!.id)
        .single();
      
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getMemberSince = () => {
    if (!profile?.created_at) return 'N/A';
    const date = new Date(profile.created_at);
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear().toString().slice(-2);
    return `${month} '${year}`;
  };

  const navItems = [
    { id: 'general' as ProfileTab, label: 'General Info', icon: User },
    { id: 'security' as ProfileTab, label: 'Security & Privacy', icon: Shield },
    { id: 'subscription' as ProfileTab, label: 'Subscription', icon: CreditCard },
    { id: 'notifications' as ProfileTab, label: 'Notifications', icon: Bell },
  ];

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <Skeleton className="h-16 w-full" />
          <div className="flex gap-8">
            <Skeleton className="h-96 w-80" />
            <Skeleton className="h-96 flex-1" />
          </div>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralInfoTab user={user} displayName={profile?.display_name || null} />;
      case 'security':
        return <SecurityPrivacyTab />;
      case 'subscription':
        return <SubscriptionTab />;
      case 'notifications':
        return <NotificationsTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 relative">
      {/* Subtle decorative background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-primary/5 to-transparent rounded-full blur-3xl" />
      </div>
      
      {/* Header */}
      <header className="w-full border-b border-border bg-background sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">M</span>
            </div>
            <span className="text-xl font-bold text-foreground">MathPath</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
            </button>
            <Avatar className="w-9 h-9 border border-border">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} />
              <AvatarFallback className="text-sm bg-secondary">
                {profile?.display_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar */}
          <div className="w-full lg:w-64 space-y-6">
            {/* Navigation Menu */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-1"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                      isActive 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </motion.div>

            {/* Current Plan Card - Only show on subscription tab or always */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-xl border border-border p-4"
            >
              <p className="text-xs text-primary font-medium mb-1">CURRENT PLAN</p>
              <p className="font-bold text-foreground mb-1">Scholar Premium</p>
              <p className="text-sm text-muted-foreground mb-3">Next billing date: Oct 24, 2023</p>
              <Link to="#" className="text-sm text-primary hover:underline flex items-center gap-1">
                Manage Subscription →
              </Link>
            </motion.div>

            {/* Storage Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-card rounded-xl border border-border p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">STORAGE</span>
                <span className="text-sm font-medium text-primary">75%</span>
              </div>
              <Progress value={75} className="h-2 mb-2" />
              <p className="text-sm text-muted-foreground mb-2">15GB of 20GB used</p>
              <Link to="#" className="text-sm text-primary hover:underline">
                Manage Storage
              </Link>
            </motion.div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderTabContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
