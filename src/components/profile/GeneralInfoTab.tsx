import { useState, useEffect } from 'react';
import { User as UserType } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Mail, Pencil, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GeneralInfoTabProps {
  user: UserType | null;
  displayName: string | null;
}

interface ProfileData {
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  academic_interest: string | null;
  about_me: string | null;
  avatar_url: string | null;
  updated_at: string;
}

export default function GeneralInfoTab({ user, displayName }: GeneralInfoTabProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [academicInterest, setAcademicInterest] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, username, academic_interest, about_me, avatar_url, updated_at')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setFirstName(data.first_name || '');
          setLastName(data.last_name || '');
          setUsername(data.username || user.email?.split('@')[0] || '');
          setAcademicInterest(data.academic_interest || '');
          setAboutMe(data.about_me || '');
          setAvatarUrl(data.avatar_url);
          setLastSaved(data.updated_at);
        } else {
          // Fallback to display name if no profile data
          const nameParts = displayName?.split(' ') || [];
          setFirstName(nameParts[0] || '');
          setLastName(nameParts.slice(1).join(' ') || '');
          setUsername(user.email?.split('@')[0] || '');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user, displayName]);

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName || null,
          last_name: lastName || null,
          username: username || null,
          academic_interest: academicInterest || null,
          about_me: aboutMe || null,
          display_name: `${firstName} ${lastName}`.trim() || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      setLastSaved(new Date().toISOString());
      setHasChanges(false);
      toast.success('Profile saved successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async () => {
    // Reload profile data
    if (!user) return;
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, username, academic_interest, about_me, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setUsername(data.username || '');
        setAcademicInterest(data.academic_interest || '');
        setAboutMe(data.about_me || '');
        setAvatarUrl(data.avatar_url);
      }
      setHasChanges(false);
    } catch (error) {
      console.error('Error reloading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, value: T) => {
    setter(value);
    setHasChanges(true);
  };

  const formatLastSaved = () => {
    if (!lastSaved) return 'Never';
    const date = new Date(lastSaved);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return isToday ? `Today at ${time}` : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ` at ${time}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">General Info</h1>
        <p className="text-muted-foreground">Manage your personal details and public profile presence.</p>
      </div>

      {/* Main Card */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-8">
        {/* Profile Picture */}
        <div className="flex items-center gap-6 pb-6 border-b border-border">
          <div className="relative">
            <Avatar className="w-24 h-24 border-4 border-primary/20">
              <AvatarImage src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} />
              <AvatarFallback className="text-2xl bg-secondary">
                {firstName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-background shadow-lg hover:bg-primary/90 transition-colors">
              <Pencil className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">Profile Picture</h3>
            <p className="text-sm text-muted-foreground mb-3">
              This will be displayed on your public profile and in leaderboards.
            </p>
            <div className="flex gap-3">
              <Button variant="default" size="sm">
                Change Photo
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  setAvatarUrl(null);
                  setHasChanges(true);
                }}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">First Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                value={firstName}
                onChange={(e) => handleFieldChange(setFirstName, e.target.value)}
                placeholder="John"
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Last Name</label>
            <Input 
              value={lastName}
              onChange={(e) => handleFieldChange(setLastName, e.target.value)}
              placeholder="Doe"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              value={user?.email || ''}
              readOnly
              className="pl-10 bg-muted"
            />
          </div>
          <p className="text-xs text-muted-foreground">We'll send important academic updates to this email.</p>
        </div>

        {/* Public Username */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Public Username</label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
              mathpath.app/u/
            </span>
            <Input 
              value={username}
              onChange={(e) => handleFieldChange(setUsername, e.target.value)}
              className="rounded-l-none"
              placeholder="johndoe_math"
            />
          </div>
        </div>

        {/* Academic Interest */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Primary Academic Interest</label>
          <Select value={academicInterest} onValueChange={(v) => handleFieldChange(setAcademicInterest, v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select interest" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="applied-math">Applied Mathematics</SelectItem>
              <SelectItem value="pure-math">Pure Mathematics</SelectItem>
              <SelectItem value="statistics">Statistics</SelectItem>
              <SelectItem value="computer-science">Computer Science</SelectItem>
              <SelectItem value="physics">Physics</SelectItem>
              <SelectItem value="engineering">Engineering</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* About Me */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">About Me</label>
          <Textarea 
            value={aboutMe}
            onChange={(e) => handleFieldChange(setAboutMe, e.target.value)}
            placeholder="Share a bit about your mathematical journey..."
            rows={4}
            maxLength={200}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Displayed on your public profile.</span>
            <span>{aboutMe.length}/200</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Last saved: {formatLastSaved()}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleCancel} disabled={!hasChanges || isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
