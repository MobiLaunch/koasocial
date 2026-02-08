import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, Shield, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageTransition } from '@/components/PageTransition';
import { Logo } from '@/components/Logo';

export default function AboutPage() {
  const values = [
    {
      icon: Heart,
      title: 'Community First',
      description: 'We believe in building meaningful connections over viral metrics.',
      color: 'text-primary bg-primary/10'
    },
    {
      icon: Shield,
      title: 'Privacy Focused',
      description: 'Your data belongs to you. We never sell or share your information.',
      color: 'text-secondary bg-secondary/10'
    },
    {
      icon: Users,
      title: 'Open & Inclusive',
      description: 'Everyone deserves a voice. We foster respectful discourse.',
      color: 'text-accent bg-accent/10'
    },
    {
      icon: Sparkles,
      title: 'Thoughtfully Designed',
      description: 'Beautiful, accessible, and joyful to use every day.',
      color: 'text-koa-success bg-koa-success/10'
    }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border/50">
          <div className="px-5 py-5 flex items-center gap-3">
            <Link to="/settings">
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-headline-medium text-foreground">About</h1>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-5 py-8 space-y-8">
          {/* Hero */}
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-6">
              <Logo size="lg" />
            </div>
            <h2 className="text-display-small font-display">
              Social media that <span className="text-primary">cares</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              KoaSocial is a community-driven platform where authentic connections 
              matter more than likes and followers.
            </p>
          </div>

          {/* Values */}
          <div className="grid gap-4 sm:grid-cols-2">
            {values.map((value) => (
              <Card key={value.title} className="rounded-2xl border-0 koa-shadow">
                <CardContent className="p-5">
                  <div className={`h-12 w-12 rounded-xl ${value.color} flex items-center justify-center mb-4`}>
                    <value.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Story */}
          <Card className="rounded-3xl border-0 koa-shadow">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-xl font-semibold">Our Story</h3>
              <p className="text-muted-foreground leading-relaxed">
                KoaSocial was born from a simple idea: social media should bring 
                people together, not divide them. We wanted to create a space where 
                meaningful conversations flourish and where your feed is filled with 
                content that enriches your life.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Named after the koala—a symbol of calm presence and gentle 
                community—we strive to build a platform that encourages thoughtful 
                engagement over reactive scrolling.
              </p>
            </CardContent>
          </Card>

          {/* Footer links */}
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link to="/terms" className="text-sm text-primary hover:underline">
              Terms of Service
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link to="/privacy" className="text-sm text-primary hover:underline">
              Privacy Policy
            </Link>
            <span className="text-muted-foreground">·</span>
            <a href="mailto:hello@koasocial.com" className="text-sm text-primary hover:underline">
              Contact Us
            </a>
          </div>

          <p className="text-center text-sm text-muted-foreground pb-8">
            Made with 🧡 for connection
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
