import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from '@/components/AppSidebar';
import { RightSidebar } from '@/components/RightSidebar';
import { ComposeModal } from '@/components/ComposeModal';
import { MobileBottomNav } from '@/components/MobileBottomNav';

export default function MainLayout() {
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePostCreated = () => {
    // Trigger refresh of timeline
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar onCompose={() => setIsComposeOpen(true)} />

      <div className="lg:ml-72 min-h-screen">
        <div className="flex">
          {/* Main content */}
          <main className="flex-1 min-h-screen border-r max-w-2xl pb-20 lg:pb-0">
            {/* Mobile header spacer */}
            <div className="h-14 lg:hidden" />
            <Outlet key={refreshKey} />
          </main>

          {/* Right sidebar */}
          <RightSidebar />
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav onCompose={() => setIsComposeOpen(true)} />

      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
}
