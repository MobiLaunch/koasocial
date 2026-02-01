import { useState } from 'react';
import { Globe } from 'lucide-react';
import { PostCard } from '@/components/PostCard';
import { mockPosts } from '@/data/mockData';
import type { Post } from '@/data/mockData';

export default function PublicPage() {
  const [posts] = useState<Post[]>(mockPosts);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <header className="sticky top-0 lg:top-0 z-30 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Globe className="h-6 w-6 text-primary" />
          <h1 className="font-display text-xl font-bold text-foreground">Public Timeline</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Posts from across the fediverse
        </p>
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
        <p>Keep scrolling for more! ✨</p>
      </div>
    </div>
  );
}
