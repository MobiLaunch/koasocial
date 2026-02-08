import { supabase } from '@/integrations/supabase/client';

interface SeedProfile {
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  is_verified?: boolean;
  verification_tier?: 'standard' | 'premium' | 'organization';
}

interface SeedPost {
  content: string;
  authorIndex: number;
  visibility: 'public' | 'unlisted' | 'followers';
  hoursAgo: number;
}

const SEED_PROFILES: SeedProfile[] = [
  {
    username: 'koasocial_team',
    display_name: 'KoaSocial Team 🐨',
    bio: 'Official account of KoaSocial - A warm, friendly place to connect and share! 🌿',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=koateam',
    is_verified: true,
    verification_tier: 'organization',
  },
  {
    username: 'welcome_bot',
    display_name: 'Welcome Bot ✨',
    bio: 'Here to help new members feel at home! Ask me anything about KoaSocial',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=welcomebot',
    is_verified: true,
    verification_tier: 'standard',
  },
  {
    username: 'sunny_dev',
    display_name: 'Sunny Chen',
    bio: 'Full-stack developer | Coffee enthusiast ☕ | Building cool stuff with React',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sunny',
  },
  {
    username: 'nature_alex',
    display_name: 'Alex Rivers',
    bio: 'Nature photographer 📸 | Hiking trails | Sharing the beauty of the outdoors',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
  },
  {
    username: 'bookworm_emma',
    display_name: 'Emma Barnes',
    bio: 'Book reviewer 📚 | Tea lover | Always reading something cozy',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma',
  },
  {
    username: 'pixel_artist_pro',
    display_name: 'Pixel Pete',
    bio: 'Retro game artist 🎮 | Making pixels dance | Commissions open!',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pete',
  },
];

const SEED_POSTS: SeedPost[] = [
  {
    content: 'Welcome to KoaSocial! 🎉 We\'re so excited to have you here. This is a warm, friendly place to connect with others and share what matters to you. Take a look around, introduce yourself, and don\'t hesitate to reach out if you need help!',
    authorIndex: 0,
    visibility: 'public',
    hoursAgo: 168,
  },
  {
    content: '👋 New here? Here are some tips to get started:\n\n1️⃣ Complete your profile\n2️⃣ Make your first post\n3️⃣ Explore the public timeline\n4️⃣ Connect with interesting people\n\nRemember, be kind and have fun!',
    authorIndex: 1,
    visibility: 'public',
    hoursAgo: 167,
  },
  {
    content: 'Just deployed a new feature at work and it feels amazing! 💻✨ There\'s something special about seeing your code come to life. What\'s everyone working on today? #coding #webdev',
    authorIndex: 2,
    visibility: 'public',
    hoursAgo: 12,
  },
  {
    content: 'Morning hike complete! 🌄 The sunrise over the mountains was absolutely breathtaking. Sometimes you just need to disconnect from screens and reconnect with nature. Highly recommend it! #hiking #nature',
    authorIndex: 3,
    visibility: 'public',
    hoursAgo: 8,
  },
  {
    content: 'Currently reading "Project Hail Mary" and I can\'t put it down! 📖 Anyone else read it? No spoilers please, but I\'d love to discuss when I finish! #books #reading',
    authorIndex: 4,
    visibility: 'public',
    hoursAgo: 6,
  },
  {
    content: '🎨 New pixel art piece finished! Spent the weekend creating this cozy coffee shop scene. The tiny details are what make pixel art special. What do you all think? #pixelart #gamedev',
    authorIndex: 5,
    visibility: 'public',
    hoursAgo: 4,
  },
  {
    content: 'Hot take: Taking regular breaks makes you a BETTER developer, not a lazier one. Just went for a 15-minute walk and solved a bug that had me stuck for 2 hours! 🚶‍♂️💡 #developer #productivity',
    authorIndex: 2,
    visibility: 'public',
    hoursAgo: 3,
  },
  {
    content: 'Pro tip for new hikers: Always bring more water than you think you need! Learned this the hard way 😅 Stay safe out there friends! 💧 #hiking #outdoors',
    authorIndex: 3,
    visibility: 'public',
    hoursAgo: 2,
  },
  {
    content: 'The cozy vibes today are immaculate ☕🍂 Rainy day, good book, warm blanket. This is what contentment feels like.',
    authorIndex: 4,
    visibility: 'public',
    hoursAgo: 1,
  },
  {
    content: 'Working on character sprites for a new indie game project! The 16-bit era had such a unique aesthetic that I try to capture. Anyone else nostalgic for old-school games? 🎮',
    authorIndex: 5,
    visibility: 'public',
    hoursAgo: 0.5,
  },
];

export async function checkIfSeedDataExists(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', 'koasocial_team')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking seed data:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking seed data:', error);
    return false;
  }
}

export async function seedDatabase(): Promise<{ success: boolean; message: string }> {
  try {
    const seedExists = await checkIfSeedDataExists();
    if (seedExists) {
      return { success: true, message: 'Seed data already exists' };
    }

    console.log('Starting database seeding...');

    const createdProfiles: any[] = [];
    
    for (const profile of SEED_PROFILES) {
      const dummyUserId = `seed-${profile.username}`;
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: dummyUserId,
          username: profile.username,
          display_name: profile.display_name,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
          is_verified: profile.is_verified || false,
        } as any)
        .select()
        .single();

      if (error) {
        console.error(`Error creating profile ${profile.username}:`, error);
        continue;
      }

      createdProfiles.push(data);
    }

    if (createdProfiles.length === 0) {
      return { success: false, message: 'Failed to create seed profiles' };
    }

    console.log(`Created ${createdProfiles.length} seed profiles`);

    let createdPostsCount = 0;
    
    for (const post of SEED_POSTS) {
      const author = createdProfiles[post.authorIndex];
      if (!author) continue;

      const createdAt = new Date();
      createdAt.setHours(createdAt.getHours() - post.hoursAgo);

      const { error } = await supabase
        .from('posts')
        .insert({
          author_id: author.id,
          content: post.content,
          visibility: post.visibility,
          created_at: createdAt.toISOString(),
        });

      if (error) {
        console.error('Error creating seed post:', error);
        continue;
      }

      createdPostsCount++;
    }

    console.log(`Created ${createdPostsCount} seed posts`);

    return {
      success: true,
      message: `Successfully seeded database with ${createdProfiles.length} profiles and ${createdPostsCount} posts`,
    };
  } catch (error: any) {
    console.error('Error seeding database:', error);
    return { success: false, message: error.message || 'Unknown error' };
  }
}

export async function addSeedEngagement(): Promise<void> {
  try {
    const { data: posts } = await supabase
      .from('posts')
      .select('id, author_id')
      .limit(20);

    if (!posts || posts.length === 0) return;

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .limit(10);

    if (!profiles || profiles.length === 0) return;

    for (const post of posts.slice(0, 5)) {
      for (const profile of profiles.slice(0, 3)) {
        if (post.author_id === profile.id) continue;
        
        try {
          await supabase
            .from('favorites')
            .insert({
              user_id: profile.id,
              post_id: post.id,
            });
        } catch {
          // Ignore duplicate or failed inserts
        }
      }
    }

    for (const post of posts.slice(0, 3)) {
      for (const profile of profiles.slice(0, 2)) {
        if (post.author_id === profile.id) continue;
        
        try {
          await supabase
            .from('boosts')
            .insert({
              user_id: profile.id,
              post_id: post.id,
            });
        } catch {
          // Ignore duplicate or failed inserts
        }
      }
    }

    console.log('Added seed engagement');
  } catch (error) {
    console.error('Error adding seed engagement:', error);
  }
}
