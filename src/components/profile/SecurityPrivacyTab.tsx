import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Lock, 
  Shield, 
  Eye, 
  EyeOff, 
  Smartphone, 
  Monitor, 
  Check,
  Circle,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function SecurityPrivacyTab() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const [usageAnalytics, setUsageAnalytics] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!newPassword) return 0;
    let strength = 0;
    if (newPassword.length >= 8) strength += 33;
    if (/[0-9!@#$%^&*]/.test(newPassword)) strength += 33;
    if (/[A-Z]/.test(newPassword)) strength += 34;
    return strength;
  };

  const passwordStrength = getPasswordStrength();
  const strengthLabel = passwordStrength >= 100 ? 'Strong' : passwordStrength >= 66 ? 'Medium' : passwordStrength >= 33 ? 'Weak' : '';
  const strengthColor = passwordStrength >= 100 ? 'text-primary' : passwordStrength >= 66 ? 'text-yellow-500' : 'text-destructive';

  const sessions = [
    { device: 'MacBook Pro', location: 'San Francisco, US', browser: 'Chrome', time: '2 minutes ago', current: true },
    { device: 'iPhone 13', location: 'San Francisco, US', browser: 'App', time: '3 days ago', current: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Security & Privacy</h1>
        <p className="text-muted-foreground">Manage your account security and privacy preferences.</p>
      </div>

      {/* Password Management */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Password Management</h3>
          </div>
          <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
            Last updated: 3 months ago
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Update your password to keep your account secure.</p>

        <div className="space-y-4">
          {/* Current Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Current Password</label>
            <div className="relative">
              <Input 
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button 
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">New Password</label>
              <div className="relative">
                <Input 
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button 
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Confirm New Password</label>
              <Input 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Password Strength */}
          {newPassword && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Password Strength</span>
                <span className={strengthColor}>{strengthLabel}</span>
              </div>
              <div className="flex gap-1">
                <div className={`h-1 flex-1 rounded-full ${passwordStrength >= 33 ? 'bg-primary' : 'bg-border'}`} />
                <div className={`h-1 flex-1 rounded-full ${passwordStrength >= 66 ? 'bg-primary' : 'bg-border'}`} />
                <div className={`h-1 flex-1 rounded-full ${passwordStrength >= 100 ? 'bg-primary' : 'bg-border'}`} />
              </div>
              <ul className="space-y-1 text-xs">
                <li className="flex items-center gap-2">
                  {newPassword.length >= 8 ? (
                    <Check className="w-3 h-3 text-primary" />
                  ) : (
                    <Circle className="w-3 h-3 text-muted-foreground" />
                  )}
                  <span className={newPassword.length >= 8 ? 'text-foreground' : 'text-muted-foreground'}>
                    At least 8 characters
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  {/[0-9!@#$%^&*]/.test(newPassword) ? (
                    <Check className="w-3 h-3 text-primary" />
                  ) : (
                    <Circle className="w-3 h-3 text-muted-foreground" />
                  )}
                  <span className={/[0-9!@#$%^&*]/.test(newPassword) ? 'text-foreground' : 'text-muted-foreground'}>
                    Contains a number or symbol
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  {/[A-Z]/.test(newPassword) ? (
                    <Check className="w-3 h-3 text-primary" />
                  ) : (
                    <Circle className="w-3 h-3 text-muted-foreground" />
                  )}
                  <span className={/[A-Z]/.test(newPassword) ? 'text-foreground' : 'text-muted-foreground'}>
                    Includes uppercase letters
                  </span>
                </li>
              </ul>
            </div>
          )}

          <Button className="mt-2">Update Password</Button>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Two-Factor Authentication</h3>
          </div>
          <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
        </div>
        <p className="text-sm text-muted-foreground mb-4">Add an extra layer of security to your account.</p>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Authenticator App (Recommended)</p>
                <p className="text-sm text-muted-foreground">Use an authenticator app like Google Authenticator or Authy to generate verification codes.</p>
              </div>
            </div>
            <Button variant="link" className="text-primary">Configure →</Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">SMS Authentication</p>
                <p className="text-sm text-muted-foreground">Receive codes via text message to +1 ••• ••• 4492</p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">Inactive</span>
          </div>
        </div>
      </div>

      {/* Privacy Controls */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Eye className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Privacy Controls</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Manage how your data is shared and used.</p>

        <div className="space-y-4 divide-y divide-border">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-foreground">Public Profile</p>
              <p className="text-sm text-muted-foreground">Allow other learners to see your progress achievements.</p>
            </div>
            <Switch checked={publicProfile} onCheckedChange={setPublicProfile} />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-foreground">Usage Analytics</p>
              <p className="text-sm text-muted-foreground">Share anonymous usage data to help us improve the platform.</p>
            </div>
            <Switch checked={usageAnalytics} onCheckedChange={setUsageAnalytics} />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-foreground">Marketing Emails</p>
              <p className="text-sm text-muted-foreground">Receive tips, trends, and promotional offers.</p>
            </div>
            <Switch checked={marketingEmails} onCheckedChange={setMarketingEmails} />
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Monitor className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Active Sessions</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Manage devices where you're currently logged in.</p>

        <div className="space-y-3">
          {sessions.map((session, index) => (
            <div key={index} className={`flex items-center justify-between p-4 rounded-lg border ${session.current ? 'border-primary/30 bg-primary/5' : 'border-border'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{session.device}</p>
                    {session.current && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">CURRENT</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {session.location} • {session.browser} • {session.time}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button variant="link" className="text-destructive hover:text-destructive mt-4 p-0">
          Log out all other sessions
        </Button>
      </div>

      {/* Danger Zone */}
      <div className="space-y-3">
        <h3 className="text-destructive font-semibold">Danger Zone</h3>
        <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Delete Account</p>
              <p className="text-sm text-muted-foreground">Permanently remove your account and all associated data.</p>
            </div>
            <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10">
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
