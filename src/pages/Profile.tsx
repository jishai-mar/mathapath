import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calculator,
  User,
  Shield,
  CreditCard,
  Bell,
  Moon,
  Gauge,
  Flame,
  Award,
  ArrowRight,
  Pencil,
  LogOut
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

type ProfileTab = 'general' | 'security' | 'subscription' | 'notifications';

interface ProfileData {
  display_name: string | null;
  total_xp: number;
  current_streak: number;
  created_at: string;
}

interface CourseProgress {
  id: string;
  name: string;
  module: string;
  progress: number;
  lessonsCompleted: number;
  totalLessons: number;
  status: 'active' | 'review';
  icon: 'fx' | 'algebra';
  color: string;
}

export default function Profile() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<ProfileTab>('general');
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

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

      // Load topic progress for courses
      const { data: topicProgress } = await supabase
        .from('user_topic_progress')
        .select('topic_id, mastery_percentage, exercises_completed')
        .eq('user_id', user!.id)
        .order('mastery_percentage', { ascending: false })
        .limit(2);

      const { data: topics } = await supabase
        .from('topics')
        .select('id, name');

      const topicMap = new Map((topics || []).map(t => [t.id, t.name]));

      const courseData: CourseProgress[] = (topicProgress || []).map((tp, index) => ({
        id: tp.topic_id,
        name: topicMap.get(tp.topic_id) || 'Mathematics',
        module: `Module ${Math.floor(tp.exercises_completed / 10) + 1}`,
        progress: tp.mastery_percentage,
        lessonsCompleted: tp.exercises_completed,
        totalLessons: Math.max(40, tp.exercises_completed + 12),
        status: index === 0 ? 'active' : 'review',
        icon: index === 0 ? 'fx' : 'algebra',
        color: index === 0 ? 'bg-primary' : 'bg-purple-500',
      }));

      setCourses(courseData);
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

  return (
    <div className="min-h-screen bg-background relative">
      {/* Subtle gradient glow */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.08),transparent_50%)]" />
      
      {/* Header */}
      <header className="w-full border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Calculator className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">MathPath</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Courses
            </Link>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Practice
            </Link>
            <span className="text-sm text-foreground font-medium border-b-2 border-primary pb-1">
              Profile
            </span>
            <button 
              onClick={handleSignOut}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar */}
          <div className="w-full lg:w-80 space-y-6">
            {/* Profile Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-secondary/50 rounded-2xl border border-border/50 p-6"
            >
              {/* Avatar */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative mb-4">
                  <Avatar className="w-28 h-28 border-2 border-border">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} />
                    <AvatarFallback className="text-2xl bg-secondary">
                      {profile?.display_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-background shadow-lg hover:bg-primary/90 transition-colors">
                    <Pencil className="w-4 h-4 text-primary-foreground" />
                  </button>
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  {profile?.display_name || 'Student'}
                </h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>

              {/* Edit Profile Button */}
              <Button 
                variant="outline" 
                className="w-full mb-6 border-border/50 hover:bg-secondary"
              >
                Edit Profile
              </Button>

              {/* Stats */}
              <div className="flex justify-between pt-4 border-t border-border/50">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Global Rank</p>
                  <div className="flex items-center justify-center gap-1">
                    <Award className="w-4 h-4 text-yellow-500" />
                    <span className="font-bold">Top 5%</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Member Since</p>
                  <span className="font-bold">{getMemberSince()}</span>
                </div>
              </div>
            </motion.div>

            {/* Navigation Menu */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-secondary/50 rounded-2xl border border-border/50 p-2"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </motion.div>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Current Focus Header */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center justify-between"
            >
              <h2 className="text-xl font-bold text-foreground">Current Focus</h2>
              <Link 
                to="/" 
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Full Statistics
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Course Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.length > 0 ? courses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + index * 0.05 }}
                  className="bg-secondary/50 rounded-2xl border border-border/50 p-5"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl ${course.color} flex items-center justify-center`}>
                      {course.icon === 'fx' ? (
                        <span className="text-white font-bold text-sm">fx</span>
                      ) : (
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="12" r="2" />
                          <circle cx="12" cy="5" r="2" />
                          <circle cx="12" cy="19" r="2" />
                          <circle cx="5" cy="12" r="2" />
                          <circle cx="19" cy="12" r="2" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-md ${
                      course.status === 'active' 
                        ? 'bg-secondary text-muted-foreground' 
                        : 'bg-secondary text-muted-foreground'
                    }`}>
                      {course.status === 'active' ? 'Active' : 'Review'}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-foreground mb-1">{course.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{course.module}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{course.progress}% Completed</span>
                      <span className="text-muted-foreground">
                        {course.status === 'active' 
                          ? `${course.lessonsCompleted}/${course.totalLessons} Lessons`
                          : 'Finish Review'
                        }
                      </span>
                    </div>
                    <Progress 
                      value={course.progress} 
                      className="h-1.5"
                    />
                  </div>
                </motion.div>
              )) : (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-secondary/50 rounded-2xl border border-border/50 p-5"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                        <span className="text-white font-bold text-sm">fx</span>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-md bg-secondary text-muted-foreground">
                        Active
                      </span>
                    </div>
                    <h3 className="font-bold text-foreground mb-1">Advanced Calculus</h3>
                    <p className="text-sm text-muted-foreground mb-4">Module 4: Partial Derivatives</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">72% Completed</span>
                        <span className="text-muted-foreground">28/40 Lessons</span>
                      </div>
                      <Progress value={72} className="h-1.5" />
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-secondary/50 rounded-2xl border border-border/50 p-5"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="12" r="2" />
                          <circle cx="12" cy="5" r="2" />
                          <circle cx="12" cy="19" r="2" />
                          <circle cx="5" cy="12" r="2" />
                          <circle cx="19" cy="12" r="2" />
                        </svg>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-md bg-secondary text-muted-foreground">
                        Review
                      </span>
                    </div>
                    <h3 className="font-bold text-foreground mb-1">Linear Algebra</h3>
                    <p className="text-sm text-muted-foreground mb-4">Module 8: Eigenvalues</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">94% Completed</span>
                        <span className="text-muted-foreground">Finish Review</span>
                      </div>
                      <Progress value={94} className="h-1.5" />
                    </div>
                  </motion.div>
                </>
              )}
            </div>

            {/* Streak Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-secondary/50 rounded-2xl border border-border/50 p-5"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">
                    {profile?.current_streak || 12} Day Streak!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Keep it up! You're mastering concepts faster than 80% of users.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Preferences Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-xl font-bold text-foreground mb-4">Preferences</h2>
              
              <div className="bg-secondary/50 rounded-2xl border border-border/50 divide-y divide-border/50">
                {/* Appearance */}
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                      <Moon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Appearance</h3>
                      <p className="text-sm text-muted-foreground">Dark mode is enabled by system default</p>
                    </div>
                  </div>
                  <button className="text-sm text-primary hover:underline">Edit</button>
                </div>

                {/* Learning Pace */}
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                      <Gauge className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Learning Pace</h3>
                      <p className="text-sm text-muted-foreground">Currently set to "Intensive" (5 lessons/week)</p>
                    </div>
                  </div>
                  <button className="text-sm text-primary hover:underline">Change</button>
                </div>

                {/* Notifications */}
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                      <Bell className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Notifications</h3>
                      <p className="text-sm text-muted-foreground">Email digest enabled</p>
                    </div>
                  </div>
                  <Switch 
                    checked={notificationsEnabled}
                    onCheckedChange={setNotificationsEnabled}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
