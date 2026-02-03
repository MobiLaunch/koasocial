import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, Bell, Shield, User, LogOut, Trash2, Globe } from 'lucide-react';
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
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Header - hidden on mobile */}
      <div className="hidden lg:block sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full hover:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-display text-xl font-bold">Settings</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Appearance */}
        <Card className="border-none shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              {isDark ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
              Appearance
            </CardTitle>
            <CardDescription>Customize how Koa looks on your device</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode" className="text-base font-medium">Dark mode</Label>
                <p className="text-sm text-muted-foreground">Toggle between light and dark themes</p>
              </div>
              <Switch
                id="dark-mode"
                checked={isDark}
                onCheckedChange={toggleTheme}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-none shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>Manage your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notify-likes" className="text-base">Likes</Label>
              <Switch
                id="notify-likes"
                checked={notifications.likes}
                onCheckedChange={(checked) => setNotifications({ ...notifications, likes: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="notify-replies" className="text-base">Replies</Label>
              <Switch
                id="notify-replies"
                checked={notifications.replies}
                onCheckedChange={(checked) => setNotifications({ ...notifications, replies: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="notify-follows" className="text-base">New followers</Label>
              <Switch
                id="notify-follows"
                checked={notifications.follows}
                onCheckedChange={(checked) => setNotifications({ ...notifications, follows: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="notify-mentions" className="text-base">Mentions</Label>
              <Switch
                id="notify-mentions"
                checked={notifications.mentions}
                onCheckedChange={(checked) => setNotifications({ ...notifications, mentions: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card className="border-none shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" />
              Account
            </CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => navigate('/profile/edit')}
            >
              <User className="h-4 w-4" />
              Edit profile
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-destructive hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card className="border-none shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-primary" />
              Privacy & Security
            </CardTitle>
            <CardDescription>Control your privacy settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">Public profile</Label>
                <p className="text-sm text-muted-foreground">Anyone can see your posts</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-destructive">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account
                    and remove all your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* App Info */}
        <div className="text-center pt-4 pb-8 text-sm text-muted-foreground">
          <p>Koa Social v1.0.0</p>
          <p className="mt-1">Made with 💚 for connection</p>
        </div>
      </div>
    </div>
  );
}
