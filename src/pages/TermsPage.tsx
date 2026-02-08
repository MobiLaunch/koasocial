import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageTransition } from '@/components/PageTransition';

export default function TermsPage() {
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
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-headline-medium text-foreground">Terms of Service</h1>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-5 py-8">
          <Card className="rounded-3xl border-0 koa-shadow">
            <CardContent className="p-6 sm:p-8 space-y-6">
              <p className="text-sm text-muted-foreground">
                Last updated: February 8, 2026
              </p>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing and using KoaSocial, you agree to be bound by these Terms of 
                  Service and all applicable laws and regulations. If you do not agree with 
                  any of these terms, you are prohibited from using this service.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold">2. User Accounts</h2>
                <p className="text-muted-foreground leading-relaxed">
                  You are responsible for maintaining the confidentiality of your account 
                  and password. You agree to accept responsibility for all activities that 
                  occur under your account.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold">3. Content Guidelines</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Users are responsible for the content they post. You agree not to post 
                  content that is illegal, harmful, threatening, abusive, harassing, 
                  defamatory, or otherwise objectionable.
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>No hate speech or discrimination</li>
                  <li>No harassment or bullying</li>
                  <li>No spam or misleading content</li>
                  <li>No illegal activities</li>
                  <li>Respect intellectual property rights</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold">4. Intellectual Property</h2>
                <p className="text-muted-foreground leading-relaxed">
                  You retain ownership of content you create. By posting, you grant KoaSocial 
                  a non-exclusive license to use, display, and distribute your content on our platform.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold">5. Termination</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may terminate or suspend your account immediately, without prior notice, 
                  for any reason, including breach of these Terms.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold">6. Changes to Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We reserve the right to modify these terms at any time. We will notify 
                  users of significant changes via email or platform notification.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold">7. Contact</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Questions about the Terms of Service should be sent to{' '}
                  <a href="mailto:legal@koasocial.com" className="text-primary hover:underline">
                    legal@koasocial.com
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
            <Link to="/privacy" className="text-sm text-primary hover:underline">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
