import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Sparkles, ArrowRight, Mail, Lock, User, AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils';

// Animated floating blob component
function AnimatedBlob({ 
  className, 
  delay = 0,
  duration = 8,
  color = 'primary'
}: { 
  className?: string; 
  delay?: number;
  duration?: number;
  color?: 'primary' | 'secondary' | 'accent';
}) {
  const colorClasses = {
    primary: 'bg-primary/30 dark:bg-primary/20',
    secondary: 'bg-secondary/30 dark:bg-secondary/20',
    accent: 'bg-accent/40 dark:bg-accent/25',
  };

  return (
    <div
      className={cn(
        "absolute rounded-full blur-3xl animate-blob",
        colorClasses[color],
        className
      )}
      style={{
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    />
  );
}

// Tactile button with press effect
function TactileButton({
  children,
  className,
  variant = 'primary',
  isLoading,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline';
  isLoading?: boolean;
}) {
  const baseClasses = "relative w-full h-14 rounded-2xl font-bold text-base transition-all duration-200 transform active:scale-[0.97] disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden group";
  
  const variantClasses = {
    primary: "bg-gradient-to-br from-primary via-primary to-[hsl(var(--koa-coral))] text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5",
    secondary: "bg-gradient-to-br from-secondary via-secondary to-[hsl(var(--koa-teal))] text-secondary-foreground shadow-lg shadow-secondary/25 hover:shadow-xl hover:shadow-secondary/30 hover:-translate-y-0.5",
    outline: "border-2 border-border bg-card/50 backdrop-blur-sm text-foreground hover:bg-accent/20 hover:border-primary/50",
  };

  return (
    <button
      className={cn(baseClasses, variantClasses[variant], className)}
      disabled={isLoading}
      {...props}
    >
      {/* Ripple effect layer */}
      <span className="absolute inset-0 bg-white/20 opacity-0 group-active:opacity-100 transition-opacity duration-150" />
      
      {/* Shine effect */}
      <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </span>
      
      <span className="relative flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
}

// Floating input with animated label
function FloatingInput({
  id,
  type = 'text',
  label,
  icon: Icon,
  value,
  onChange,
  required,
  autoComplete,
  showPasswordToggle,
  showPassword,
  onTogglePassword,
}: {
  id: string;
  type?: string;
  label: string;
  icon: React.ElementType;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  autoComplete?: string;
  showPasswordToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;
  const isActive = isFocused || hasValue;

  return (
    <div className="relative group">
      {/* Glow effect on focus */}
      <div className={cn(
        "absolute inset-0 rounded-2xl transition-opacity duration-300",
        "bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 blur-xl opacity-0",
        isFocused && "opacity-100"
      )} />
      
      <div className={cn(
        "relative flex items-center h-14 rounded-2xl border-2 transition-all duration-300 bg-card/80 backdrop-blur-sm",
        isFocused ? "border-primary shadow-lg shadow-primary/10" : "border-border/50 hover:border-border"
      )}>
        {/* Icon */}
        <div className={cn(
          "pl-4 transition-colors duration-300",
          isActive ? "text-primary" : "text-muted-foreground"
        )}>
          <Icon className="h-5 w-5" />
        </div>
        
        {/* Input */}
        <input
          id={id}
          type={showPasswordToggle ? (showPassword ? 'text' : 'password') : type}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          required={required}
          autoComplete={autoComplete}
          className="flex-1 h-full bg-transparent px-3 pt-4 text-base outline-none placeholder-transparent peer"
          placeholder={label}
        />
        
        {/* Floating label */}
        <Label
          htmlFor={id}
          className={cn(
            "absolute left-12 transition-all duration-300 pointer-events-none",
            isActive
              ? "top-1 text-xs font-semibold text-primary"
              : "top-1/2 -translate-y-1/2 text-base text-muted-foreground"
          )}
        >
          {label}
        </Label>
        
        {/* Password toggle */}
        {showPasswordToggle && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="pr-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    displayName: '',
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleModeSwitch = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setIsLogin(!isLogin);
      setIsTransitioning(false);
    }, 150);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });

      if (error) throw error;
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
      {/* Animated bouncing blobs background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large primary blob - top left */}
        <AnimatedBlob 
          className="w-[500px] h-[500px] -top-32 -left-32"
          color="primary"
          delay={0}
          duration={12}
        />
        
        {/* Secondary blob - bottom right */}
        <AnimatedBlob 
          className="w-[400px] h-[400px] -bottom-24 -right-24"
          color="secondary"
          delay={2}
          duration={10}
        />
        
        {/* Accent blob - top right */}
        <AnimatedBlob 
          className="w-[350px] h-[350px] top-20 -right-20"
          color="accent"
          delay={4}
          duration={14}
        />
        
        {/* Small primary blob - bottom left */}
        <AnimatedBlob 
          className="w-[250px] h-[250px] bottom-32 left-10"
          color="primary"
          delay={1}
          duration={9}
        />
        
        {/* Medium accent blob - center left */}
        <AnimatedBlob 
          className="w-[200px] h-[200px] top-1/3 left-1/4"
          color="accent"
          delay={3}
          duration={11}
        />
        
        {/* Small secondary blob - center right */}
        <AnimatedBlob 
          className="w-[180px] h-[180px] bottom-1/3 right-1/4"
          color="secondary"
          delay={5}
          duration={13}
        />

        {/* Mesh gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-transparent to-background/80" />
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary/20 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${4 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Top loading bar */}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-primary/20 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary via-accent to-secondary animate-loading-slide" />
        </div>
      )}

      {/* Logo in corner */}
      <div className="absolute top-6 left-6 z-10 animate-fade-in">
        <Logo size="md" />
      </div>

      {/* Main card */}
      <div 
        className={cn(
          "relative w-full max-w-md transition-all duration-500",
          isTransitioning && "scale-95 opacity-50"
        )}
      >
        {/* Card glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 rounded-[2rem] blur-xl opacity-75 animate-pulse" />
        
        <div className="relative bg-card/90 backdrop-blur-xl rounded-[2rem] border border-border/50 shadow-2xl shadow-primary/10 overflow-hidden">
          {/* Decorative top gradient bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-accent to-secondary" />
          
          {/* Header */}
          <div className="px-8 pt-10 pb-4 text-center">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl animate-pulse" />
                <Logo size="xl" linkTo="/" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {isLogin ? 'Welcome back!' : 'Join the community'}
            </h1>
            <p className="text-muted-foreground">
              {isLogin
                ? 'Sign in to continue your journey'
                : 'Create your account and start sharing'}
            </p>
          </div>

          {/* Form */}
          <div className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className={cn(
                  "space-y-4 transition-all duration-300",
                  !isLogin ? "opacity-100 max-h-[200px]" : "opacity-0 max-h-0 overflow-hidden"
                )}>
                  <FloatingInput
                    id="username"
                    label="Username"
                    icon={AtSign}
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required={!isLogin}
                    autoComplete="username"
                  />

                  <FloatingInput
                    id="displayName"
                    label="Display Name"
                    icon={User}
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    autoComplete="name"
                  />
                </div>
              )}

              <FloatingInput
                id="email"
                type="email"
                label="Email Address"
                icon={Mail}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                autoComplete="email"
              />

              <FloatingInput
                id="password"
                label="Password"
                icon={Lock}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                autoComplete={isLogin ? "current-password" : "new-password"}
                showPasswordToggle
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword(!showPassword)}
              />

              {/* Submit button */}
              <div className="pt-2">
                <TactileButton
                  type="submit"
                  variant="primary"
                  isLoading={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isLogin ? (
                    <>
                      Sign in
                      <ArrowRight className="h-5 w-5" />
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Create account
                    </>
                  )}
                </TactileButton>
              </div>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-4 text-sm text-muted-foreground font-medium">
                    or continue with
                  </span>
                </div>
              </div>

              {/* Google button */}
              <TactileButton
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                isLoading={isLoading}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </TactileButton>
            </form>

            {/* Mode switch */}
            <div className="mt-8 text-center">
              <p className="text-muted-foreground">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
                <button
                  type="button"
                  onClick={handleModeSwitch}
                  className="ml-2 text-primary font-semibold hover:underline underline-offset-4 transition-all"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>

            {/* Legal links */}
            <div className="mt-6 text-center text-xs text-muted-foreground">
              <p>
                By continuing, you agree to our{' '}
                <a href="/terms" className="text-primary hover:underline">Terms</a>
                {' '}and{' '}
                <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
