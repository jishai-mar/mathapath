import { useState } from 'react';
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
import { User, Mail, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';

interface GeneralInfoTabProps {
  user: UserType | null;
  displayName: string | null;
}

export default function GeneralInfoTab({ user, displayName }: GeneralInfoTabProps) {
  const [firstName, setFirstName] = useState(displayName?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(displayName?.split(' ')[1] || '');
  const [username, setUsername] = useState(user?.email?.split('@')[0] || '');
  const [academicInterest, setAcademicInterest] = useState('applied-math');
  const [aboutMe, setAboutMe] = useState('');

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
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} />
              <AvatarFallback className="text-2xl bg-secondary">
                {displayName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
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
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
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
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Last Name</label>
            <Input 
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
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
              onChange={(e) => setUsername(e.target.value)}
              className="rounded-l-none"
              placeholder="johndoe_math"
            />
          </div>
        </div>

        {/* Academic Interest */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Primary Academic Interest</label>
          <Select value={academicInterest} onValueChange={setAcademicInterest}>
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
            onChange={(e) => setAboutMe(e.target.value)}
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
          Last saved: Today at 10:42 AM
        </p>
        <div className="flex gap-3">
          <Button variant="outline">Cancel</Button>
          <Button>Save Changes</Button>
        </div>
      </div>
    </motion.div>
  );
}
