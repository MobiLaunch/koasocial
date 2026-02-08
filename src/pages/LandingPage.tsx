import { Link } from 'react-router-dom';
import { MessageCircle, Users, Shield, Globe, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/Logo';

const features = [
  {
    icon: MessageCircle,
    title: 'Share your thoughts',
    description: 'Post updates, share ideas, and connect with friends in a friendly environment.',
    color: 'from-primary to-koa-coral',
  },
  {
    icon: Users,
    title: 'Build your community',
    description: 'Follow interesting people and grow your network organically.',
    color: 'from-secondary to-koa-teal',
  },
  {
    icon: Shield,
    title: 'Your data, your rules',
    description: 'Privacy-focused with transparent practices and user control.',
    color: 'from-koa-boost to-primary',
  },
  {
    icon: Globe,
    title: 'Global reach',
    description: 'Stay connected with trending news and a growing community.',
    color: 'from-accent to-koa-coral',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="md" linkTo="/" />
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/public">Explore</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-40 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />
        </div>

        <div className="container max-w-4xl mx-auto text-center relative">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent/20 text-accent-foreground text-sm font-semibold mb-8 animate-fade-in border border-accent/30">
            <Sparkles className="h-4 w-4 text-accent-foreground" />
            A cozy corner of the internet
          </div>

          {/* Main heading - M3 Expressive typography */}
          <h1 className="text-display-large mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Social networking,{' '}
            <span className="bg-gradient-to-r from-primary via-koa-coral to-accent bg-clip-text text-transparent">
              reimagined
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-body-large text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Join koasocial — a warm, friendly space where you can share your thoughts, 
            connect with like-minded people, and stay informed with trending news.
          </p>

          {/* CTA Buttons - M3 style */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Button size="xl" className="group koa-gradient text-primary-foreground koa-shadow-lg hover:koa-shadow-xl" asChild>
              <Link to="/auth">
                Join koasocial
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link to="/public">Explore public posts</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 surface-container">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-headline-large text-foreground mb-4">
              Why you'll love it here
            </h2>
            <p className="text-body-large text-muted-foreground max-w-xl mx-auto">
              Built with care, designed for connection
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={feature.title} 
                className="rounded-3xl border-0 bg-card koa-shadow hover:koa-shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in-up group"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <CardContent className="pt-8 pb-6 px-6">
                  <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 transition-transform group-hover:scale-110`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-title-large text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-4">
        <div className="container max-w-4xl mx-auto">
          <Card className="rounded-3xl overflow-hidden border-0 koa-shadow-xl">
            <div className="koa-gradient p-12 md:p-16 text-center relative">
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full translate-x-1/4 translate-y-1/4" />
              
              <div className="relative">
                <h2 className="text-headline-large text-white mb-4">
                  Ready to join the community?
                </h2>
                <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
                  Start sharing, connecting, and being part of something special.
                </p>
                <Button 
                  size="xl" 
                  className="bg-white text-foreground hover:bg-white/90 shadow-lg group"
                  asChild
                >
                  <Link to="/auth">
                    Create your account
                    <span className="ml-2 text-xl transition-transform group-hover:scale-125">🐨</span>
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 border-t bg-surface-container">
        <div className="container max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo size="sm" />

          <div className="flex items-center gap-8 text-sm text-muted-foreground">
            <Link to="/about" className="hover:text-foreground transition-colors font-medium">About</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors font-medium">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors font-medium">Privacy</Link>
            <Link to="/docs" className="hover:text-foreground transition-colors font-medium">Docs</Link>
          </div>

          <div className="text-sm text-muted-foreground">
            © 2026 koasocial
          </div>
        </div>
      </footer>
    </div>
  );
}