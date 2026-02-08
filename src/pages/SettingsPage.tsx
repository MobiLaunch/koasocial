import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, Bell, Shield, User, LogOut, Trash2, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [notifications, setNotifications] = useState({
    likes: true,
    replies: true,
    follows: true,
    mentions: true,
  });

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="animate-fade-in">
      {/* Header - M3 Expressive style */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="px-5 py-5 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-xl hover:bg-surface-container-high lg:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <SettingsIcon className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-headline-medium text-foreground">Settings</h1>
        </div>
      </header>

      <div className="p-5 space-y-5 max-w-2xl mx-auto">
        {/* Appearance */}
        <Card className="rounded-3xl border-0 koa-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="h-10 w-10 rounded-xl bg-accent/30 flex items-center justify-center">
                {isDark ? <Moon className="h-5 w-5 text-accent-foreground" /> : <Sun className="h-5 w-5 text-accent-foreground" />}
              </div>
              Appearance
            </CardTitle>
            <CardDescription className="pl-13">Customize how KoaSocial looks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-colors">
              <div className="space-y-1">
                <Label htmlFor="dark-mode" className="text-base font-semibold">Dark mode</Label>
                <p className="text-sm text-muted-foreground">Toggle between light and dark themes</p>
              </div>
              <Switch
                id="dark-mode"
                checked={isDark}
                onCheckedChange={toggleTheme}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="rounded-3xl border-0 koa-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              Notifications
            </CardTitle>
            <CardDescription className="pl-13">Manage your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { id: 'likes', label: 'Likes', value: notifications.likes },
              { id: 'replies', label: 'Replies', value: notifications.replies },
              { id: 'follows', label: 'New followers', value: notifications.follows },
              { id: 'mentions', label: 'Mentions', value: notifications.mentions },
            ].map((item, index) => (
              <div key={item.id}>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-colors">
                  <Label htmlFor={`notify-${item.id}`} className="text-base font-medium">{item.label}</Label>
                  <Switch
                    id={`notify-${item.id}`}
                    checked={item.value}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, [item.id]: checked })}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Account */}
        <Card className="rounded-3xl border-0 koa-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="h-10 w-10 rounded-xl bg-secondary/15 flex items-center justify-center">
                <User className="h-5 w-5 text-secondary" />
              </div>
              Account
            </CardTitle>
            <CardDescription className="pl-13">Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-14 rounded-2xl bg-surface-container hover:bg-surface-container-high font-medium"
              onClick={() => navigate('/profile/edit')}
            >
              <User className="h-5 w-5" />
              Edit profile
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-14 rounded-2xl bg-surface-container hover:bg-destructive/10 text-destructive font-medium"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
              Sign out
            </Button>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card className="rounded-3xl border-0 koa-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="h-10 w-10 rounded-xl bg-koa-success/15 flex items-center justify-center">
                <Shield className="h-5 w-5 text-koa-success" />
              </div>
              Privacy & Security
            </CardTitle>
            <CardDescription className="pl-13">Control your privacy settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-colors">
              <div className="space-y-1">
                <Label className="text-base font-semibold">Public profile</Label>
                <p className="text-sm text-muted-foreground">Anyone can see your posts</p>
              </div>
              <Switch defaultChecked className="data-[state=checked]:bg-koa-success" />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="rounded-3xl border-2 border-destructive/30 koa-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg text-destructive">
              <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              Danger Zone
            </CardTitle>
            <CardDescription className="pl-13">Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="lg" className="w-full gap-3 rounded-2xl h-14">
                  <Trash2 className="h-5 w-5" />
                  Delete account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl">Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription className="text-base">
                    This action cannot be undone. This will permanently delete your account
                    and remove all your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                  <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">
                    Delete account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* App Info */}
        <div className="text-center pt-6 pb-10 text-sm text-muted-foreground">
          <p className="font-semibold">KoaSocial v1.0.0</p>
          <p className="mt-1">Made with 🧡 for connection</p>
        </div>
      </div>
    </div>
  );
}