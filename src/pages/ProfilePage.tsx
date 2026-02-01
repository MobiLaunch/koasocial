import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Link as LinkIcon, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PostCard } from '@/components/PostCard';
import { currentUser, mockPosts } from '@/data/mockData';
import { formatCount, formatHandle } from '@/lib/formatters';

export default function ProfilePage() {
  const user = currentUser;
  const userPosts = mockPosts.filter(p => p.author.id === user.id);

  return (
    <div className="animate-fade-in">
      {/* Banner */}
      <div className="relative h-48 bg-gradient-to-br from-primary/30 to-koa-peach/30">
        {user.bannerImage && (
          <img
            src={user.bannerImage}
            alt="Profile banner"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Profile header */}
      <div className="relative px-4 pb-4 border-b">
        {/* Avatar */}
        <div className="relative -mt-16 mb-4">
          <Avatar className="h-32 w-32 ring-4 ring-background">
            <AvatarImage src={user.avatar} alt={user.displayName} />
            <AvatarFallback className="bg-primary/10 text-primary text-4xl">
              {user.displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Action buttons */}
        <div className="absolute right-4 top-4 flex gap-2">
          <Button variant="outline" size="icon" className="rounded-full">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
          <Button className="rounded-full koa-gradient text-primary-foreground hover:opacity-90">
            Edit profile
          </Button>
        </div>

        {/* User info */}
        <div className="mt-2">
          <h1 className="font-display text-2xl font-bold text-foreground">
            {user.displayName}
          </h1>
          <p className="text-muted-foreground">
            {formatHandle(user.username, user.instance)}
          </p>
        </div>

        {/* Bio */}
        <p className="mt-3 text-foreground leading-relaxed">
          {user.bio}
        </p>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Joined January 2024
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mt-4">
          <Link to="#" className="hover:underline">
            <span className="font-bold text-foreground">{formatCount(user.followingCount)}</span>
            <span className="text-muted-foreground ml-1">Following</span>
          </Link>
          <Link to="#" className="hover:underline">
            <span className="font-bold text-foreground">{formatCount(user.followersCount)}</span>
            <span className="text-muted-foreground ml-1">Followers</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0">
          <TabsTrigger
            value="posts"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
          >
            Posts
          </TabsTrigger>
          <TabsTrigger
            value="replies"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
          >
            Replies
          </TabsTrigger>
          <TabsTrigger
            value="media"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
          >
            Media
          </TabsTrigger>
          <TabsTrigger
            value="likes"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
          >
            Likes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-0">
          {userPosts.length > 0 ? (
            <div className="divide-y divide-border">
              {userPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <p>No posts yet</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="replies" className="mt-0">
          <div className="p-8 text-center text-muted-foreground">
            <p>No replies yet</p>
          </div>
        </TabsContent>

        <TabsContent value="media" className="mt-0">
          <div className="p-8 text-center text-muted-foreground">
            <p>No media posts yet</p>
          </div>
        </TabsContent>

        <TabsContent value="likes" className="mt-0">
          <div className="p-8 text-center text-muted-foreground">
            <p>Likes are private</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
