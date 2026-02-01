import { useState } from 'react';
import { Home as HomeIcon } from 'lucide-react';
import { PostCard } from '@/components/PostCard';
import { mockPosts } from '@/data/mockData';
import type { Post } from '@/data/mockData';

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>(mockPosts);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <header className="sticky top-0 lg:top-0 z-30 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <HomeIcon className="h-6 w-6 text-primary" />
          <h1 className="font-display text-xl font-bold text-foreground">Home</h1>
        </div>
      </header>

      {/* Timeline */}
      <div className="divide-y divide-border">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
          />
        ))}
      </div>

      {/* Load more indicator */}
      <div className="p-8 text-center text-muted-foreground">
        <p>You're all caught up! 🎉</p>
      </div>
    </div>
  );
}
