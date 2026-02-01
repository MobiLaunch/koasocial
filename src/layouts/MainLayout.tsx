import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from '@/components/AppSidebar';
import { RightSidebar } from '@/components/RightSidebar';
import { ComposeModal } from '@/components/ComposeModal';

export default function MainLayout() {
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar onCompose={() => setIsComposeOpen(true)} />

      <div className="lg:ml-72 min-h-screen">
        <div className="flex">
          {/* Main content */}
          <main className="flex-1 min-h-screen border-r max-w-2xl">
            {/* Mobile header spacer */}
            <div className="h-14 lg:hidden" />
            <Outlet />
          </main>

          {/* Right sidebar */}
          <RightSidebar />
        </div>
      </div>

      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
      />
    </div>
  );
}
