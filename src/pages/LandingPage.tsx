import { Link } from 'react-router-dom';
import { MessageCircle, Users, Shield, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/Logo';

const features = [
  {
    icon: MessageCircle,
    title: 'Share your thoughts',
    description: 'Post updates, share ideas, and connect with friends in a friendly environment.',
  },
  {
    icon: Users,
    title: 'Build your community',
    description: 'Follow interesting people and grow your network organically.',
  },
  {
    icon: Shield,
    title: 'Your data, your rules',
    description: 'Privacy-focused with transparent practices and user control.',
  },
  {
    icon: Globe,
    title: 'Global reach',
    description: 'Stay connected with trending news and a growing community.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="md" linkTo="/" />

          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button className="rounded-full koa-gradient text-primary-foreground hover:opacity-90" asChild>
              <Link to="/auth">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-8">
            <span className="animate-pulse">🌿</span>
            A cozy corner of the internet
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
            Social networking,{' '}
            <span className="bg-gradient-to-r from-primary to-koa-peach bg-clip-text text-transparent">
              reimagined
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Join koasocial — a warm, friendly space where you can share your thoughts, 
            connect with like-minded people, and stay informed with trending news.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="rounded-full px-8 h-14 text-lg koa-gradient text-primary-foreground hover:opacity-90 koa-shadow-lg" asChild>
              <Link to="/auth">
                Join koasocial
                <span className="ml-2">→</span>
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-lg" asChild>
              <Link to="/public">Explore public posts</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container max-w-6xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center text-foreground mb-12">
            Why you'll love it here
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="rounded-2xl border-0 koa-shadow hover:koa-shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-xl koa-gradient flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto">
          <Card className="rounded-3xl koa-gradient p-8 md:p-12 text-center border-0 koa-shadow-lg">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to join the community?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
              Start sharing, connecting, and being part of something special.
            </p>
            <Button
              size="lg"
              className="rounded-full px-8 h-14 text-lg bg-background text-foreground hover:bg-background/90"
              asChild
            >
              <Link to="/auth">
                Create your account
                <span className="ml-2">🐨</span>
              </Link>
            </Button>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="container max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/docs" className="hover:text-foreground transition-colors">Documentation</Link>
          </div>

          <div className="text-sm text-muted-foreground">
            © 2026 koasocial
          </div>
        </div>
      </footer>
    </div>
  );
}
