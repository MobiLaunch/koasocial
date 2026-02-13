import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/components/Logo';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    displayName: '',
  });
  const { toast } = useToast();
  const navigate = useNavigate();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        toast({ title: 'Welcome back!', description: 'You have been signed in.' });
        navigate('/home');
      } else {
        // Check if username is taken
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', formData.username.toLowerCase())
          .single();

        if (existingUser) {
          throw new Error('Username is already taken');
        }

        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) throw error;

        if (data.user) {
          // Create profile
          const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            username: formData.username.toLowerCase(),
            display_name: formData.displayName || formData.username,
          } as any);

          if (profileError) throw profileError;
        }

        toast({
          title: 'Check your email!',
          description: 'We sent you a confirmation link to verify your account.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decorations - use smaller blurs on mobile for performance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-10 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />
      </div>
      {/* Lightweight mobile background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none md:hidden">
        <div className="absolute top-0 left-1/4 w-48 h-48 bg-primary/5 rounded-full blur-xl" />
        <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-accent/5 rounded-full blur-xl" />
      </div>

      {/* Loading indicator at top */}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <LoadingIndicator size="sm" />
        </div>
      )}


      <Card className="w-full max-w-md rounded-3xl border-0 koa-shadow-lg bg-card relative animate-scale-in md:bg-card/95 md:backdrop-blur-sm">
        <CardHeader className="text-center pb-2 pt-8">
          <div className="flex justify-center mb-6">
            <Logo size="lg" linkTo="/" />
          </div>
          <CardTitle className="text-headline-medium">
            {isLogin ? 'Welcome back!' : 'Join koasocial'}
          </CardTitle>
          <CardDescription className="text-base">
            {isLogin
              ? 'Sign in to your account to continue'
              : 'Create your account and start sharing'}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-semibold">Username</Label>
                  <Input
                    id="username"
                    placeholder="koala_lover"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required={!isLogin}
                    className="h-12 rounded-xl border-2 border-border focus:border-primary transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-sm font-semibold">Display Name</Label>
                  <Input
                    id="displayName"
                    placeholder="Koala 🐨"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="h-12 rounded-xl border-2 border-border focus:border-primary transition-colors"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="h-12 rounded-xl border-2 border-border focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="h-12 rounded-xl pr-12 border-2 border-border focus:border-primary transition-colors"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-10 w-10 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full h-12 rounded-xl text-base koa-gradient text-primary-foreground koa-shadow hover:koa-shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isLogin ? (
                'Sign in'
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Create account
                </>
              )}
            </Button>

          </form>

          <div className="mt-8 text-center text-sm">
            {isLogin ? (
              <p className="text-muted-foreground">
                Don't have an account?{' '}
                <button
                  onClick={() => setIsLogin(false)}
                  className="text-primary font-semibold hover:underline"
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p className="text-muted-foreground">
                Already have an account?{' '}
                <button
                  onClick={() => setIsLogin(true)}
                  className="text-primary font-semibold hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}