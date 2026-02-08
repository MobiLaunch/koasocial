import { Link } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageTransition } from '@/components/PageTransition';

export default function PrivacyPage() {
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
            <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <Lock className="h-5 w-5 text-secondary" />
            </div>
            <h1 className="text-headline-medium text-foreground">Privacy Policy</h1>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-5 py-8">
          <Card className="rounded-3xl border-0 koa-shadow">
            <CardContent className="p-6 sm:p-8 space-y-6">
              <p className="text-sm text-muted-foreground">
                Last updated: February 8, 2026
              </p>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold">Our Commitment</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Your privacy is fundamental to KoaSocial. We are committed to 
                  protecting your personal information and being transparent about 
                  how we collect, use, and share your data.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold">Information We Collect</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We collect information you provide directly, including:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Account information (email, username, display name)</li>
                  <li>Profile information (bio, avatar, interests)</li>
                  <li>Content you create (posts, messages, comments)</li>
                  <li>Usage data (how you interact with the platform)</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold">How We Use Your Information</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We use your information to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Provide and improve our services</li>
                  <li>Personalize your experience</li>
                  <li>Communicate with you about updates</li>
                  <li>Ensure safety and security</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold">Data Sharing</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We do not sell your personal information. We may share data with:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Service providers who help operate our platform</li>
                  <li>Law enforcement when legally required</li>
                  <li>Other users (only content you choose to share publicly)</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold">Your Rights</h2>
                <p className="text-muted-foreground leading-relaxed">
                  You have the right to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Access your personal data</li>
                  <li>Correct inaccurate information</li>
                  <li>Delete your account and data</li>
                  <li>Export your data</li>
                  <li>Opt out of marketing communications</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold">Data Security</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We implement industry-standard security measures to protect your 
                  data, including encryption, secure servers, and regular security audits.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold">Cookies</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We use essential cookies to make our platform work. We do not use 
                  tracking cookies for advertising purposes.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold">Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed">
                  For privacy-related questions, contact us at{' '}
                  <a href="mailto:privacy@koasocial.com" className="text-primary hover:underline">
                    privacy@koasocial.com
                  </a>
                </p>
              </section>
            </CardContent>
          </Card>

          {/* Footer links */}
          <div className="flex flex-wrap justify-center gap-4 pt-8 pb-8">
            <Link to="/about" className="text-sm text-primary hover:underline">
              About
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link to="/terms" className="text-sm text-primary hover:underline">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
