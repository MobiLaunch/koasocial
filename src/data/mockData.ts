export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  instance: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing?: boolean;
  bannerImage?: string;
  createdAt: string;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  createdAt: string;
  repliesCount: number;
  boostsCount: number;
  favoritesCount: number;
  isBoosted: boolean;
  isFavorited: boolean;
  boostedBy?: User;
  visibility: 'public' | 'unlisted' | 'followers' | 'direct';
  replyTo?: string;
}

export interface Notification {
  id: string;
  type: 'follow' | 'favorite' | 'boost' | 'reply' | 'mention';
  user: User;
  post?: Post;
  createdAt: string;
  read: boolean;
}

// Mock Users
export const currentUser: User = {
  id: '1',
  username: 'koala_lover',
  displayName: 'Koala 🐨',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=koala',
  bio: 'Just a friendly koala sharing thoughts and eucalyptus recommendations 🌿',
  instance: 'koasocial.app',
  followersCount: 234,
  followingCount: 156,
  postsCount: 89,
  bannerImage: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1200&h=400&fit=crop',
  createdAt: '2024-01-15T10:00:00Z',
};

export const mockUsers: User[] = [
  currentUser,
  {
    id: '2',
    username: 'sunny_coder',
    displayName: 'Sunny ☀️',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sunny',
    bio: 'Full-stack developer by day, gardener by weekend 🌻',
    instance: 'koasocial.app',
    followersCount: 567,
    followingCount: 234,
    postsCount: 145,
    isFollowing: true,
    createdAt: '2024-02-20T14:30:00Z',
  },
  {
    id: '3',
    username: 'mountain_wanderer',
    displayName: 'Alex Trails',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
    bio: 'Hiking enthusiast | Nature photographer | Based in Colorado 🏔️',
    instance: 'outdoor.social',
    followersCount: 1234,
    followingCount: 456,
    postsCount: 312,
    isFollowing: true,
    createdAt: '2023-11-05T08:15:00Z',
  },
  {
    id: '4',
    username: 'bookish_fox',
    displayName: 'Fiona Fox 📚',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fiona',
    bio: 'Book reviewer | Tea lover | Cozy vibes only ✨',
    instance: 'koasocial.app',
    followersCount: 892,
    followingCount: 345,
    postsCount: 234,
    isFollowing: false,
    createdAt: '2024-03-10T16:45:00Z',
  },
  {
    id: '5',
    username: 'pixel_artist',
    displayName: 'Pixel Pete 🎨',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pete',
    bio: 'Retro game artist | Making pixels dance since 1998',
    instance: 'art.social',
    followersCount: 2341,
    followingCount: 189,
    postsCount: 567,
    isFollowing: true,
    createdAt: '2023-08-22T12:00:00Z',
  },
];

// Mock Posts
export const mockPosts: Post[] = [
  {
    id: '1',
    author: mockUsers[1],
    content: 'Just finished building a beautiful new feature using React and TypeScript! The feeling when everything just works is unmatched 💻✨ #coding #webdev',
    createdAt: '2024-12-08T14:30:00Z',
    repliesCount: 12,
    boostsCount: 45,
    favoritesCount: 89,
    isBoosted: false,
    isFavorited: true,
    visibility: 'public',
  },
  {
    id: '2',
    author: mockUsers[2],
    content: 'Morning hike complete! The sunrise over the mountains was absolutely breathtaking today. Sometimes you just need to disconnect and appreciate nature 🌄',
    createdAt: '2024-12-08T08:15:00Z',
    repliesCount: 8,
    boostsCount: 67,
    favoritesCount: 134,
    isBoosted: true,
    isFavorited: false,
    visibility: 'public',
    boostedBy: mockUsers[1],
  },
  {
    id: '3',
    author: mockUsers[3],
    content: 'Currently reading "The Midnight Library" by Matt Haig and it\'s absolutely captivating! Anyone else read it? Would love to discuss 📖☕',
    createdAt: '2024-12-07T20:45:00Z',
    repliesCount: 23,
    boostsCount: 34,
    favoritesCount: 78,
    isBoosted: false,
    isFavorited: false,
    visibility: 'public',
  },
  {
    id: '4',
    author: mockUsers[4],
    content: 'New pixel art drop! Created this cozy cabin scene for an upcoming indie game. What do you think? 🎮🏠\n\n#pixelart #gamedev #indiegame',
    createdAt: '2024-12-07T16:00:00Z',
    repliesCount: 45,
    boostsCount: 156,
    favoritesCount: 289,
    isBoosted: true,
    isFavorited: true,
    visibility: 'public',
  },
  {
    id: '5',
    author: currentUser,
    content: 'Hot take: eucalyptus leaves are seriously underrated 🌿 They\'re not just for koalas, they smell amazing too! Anyone else appreciate a good eucalyptus candle?',
    createdAt: '2024-12-07T12:30:00Z',
    repliesCount: 5,
    boostsCount: 12,
    favoritesCount: 34,
    isBoosted: false,
    isFavorited: false,
    visibility: 'public',
  },
  {
    id: '6',
    author: mockUsers[1],
    content: 'Pro tip for developers: Take breaks! Just went for a 15-minute walk and came back to solve a bug that had me stuck for 2 hours 🚶‍♂️💡',
    createdAt: '2024-12-06T10:00:00Z',
    repliesCount: 18,
    boostsCount: 89,
    favoritesCount: 156,
    isBoosted: false,
    isFavorited: true,
    visibility: 'public',
  },
];

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'follow',
    user: mockUsers[3],
    createdAt: '2024-12-08T15:00:00Z',
    read: false,
  },
  {
    id: '2',
    type: 'favorite',
    user: mockUsers[1],
    post: mockPosts[4],
    createdAt: '2024-12-08T14:45:00Z',
    read: false,
  },
  {
    id: '3',
    type: 'boost',
    user: mockUsers[4],
    post: mockPosts[4],
    createdAt: '2024-12-08T14:30:00Z',
    read: false,
  },
  {
    id: '4',
    type: 'reply',
    user: mockUsers[2],
    post: mockPosts[4],
    createdAt: '2024-12-08T13:00:00Z',
    read: true,
  },
  {
    id: '5',
    type: 'mention',
    user: mockUsers[1],
    post: mockPosts[0],
    createdAt: '2024-12-07T18:00:00Z',
    read: true,
  },
  {
    id: '6',
    type: 'follow',
    user: mockUsers[4],
    createdAt: '2024-12-07T12:00:00Z',
    read: true,
  },
];

// Trending topics
export const mockTrending = [
  { tag: '#koasocial', posts: 1234 },
  { tag: '#coding', posts: 892 },
  { tag: '#photography', posts: 567 },
  { tag: '#bookclub', posts: 345 },
  { tag: '#pixelart', posts: 234 },
];

// Suggested users to follow
export const suggestedUsers = mockUsers.filter(u => !u.isFollowing && u.id !== currentUser.id);
