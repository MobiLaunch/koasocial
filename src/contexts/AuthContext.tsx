import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  instance: string;
  interests: string[];
  social_links: Record<string, string>;
  is_verified: boolean;
  verification_tier: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data as Profile;
  };

  const createProfileForOAuthUser = async (user: User): Promise<Profile | null> => {
    const metadata = user.user_metadata;
    const email = user.email || '';
    
    // Generate username from email or name
    let username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
    
    // Ensure unique username by checking and appending numbers if needed
    let attempts = 0;
    let finalUsername = username;
    while (attempts < 5) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', finalUsername)
        .single();
      
      if (!existing) break;
      finalUsername = `${username}_${Math.floor(Math.random() * 1000)}`;
      attempts++;
    }

    const displayName = metadata?.full_name || metadata?.name || email.split('@')[0];
    const avatarUrl = metadata?.avatar_url || metadata?.picture || null;

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        username: finalUsername,
        display_name: displayName,
        avatar_url: avatarUrl,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating profile for OAuth user:', error);
      return null;
    }

    return data as Profile;
  };

  const fetchOrCreateProfile = async (user: User): Promise<Profile | null> => {
    let profileData = await fetchProfile(user.id);
    
    // If no profile exists (OAuth user), create one
    if (!profileData) {
      profileData = await createProfileForOAuthUser(user);
    }
    
    return profileData;
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  useEffect(() => {
    // Set up auth state listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Use setTimeout to avoid Supabase client deadlock
          setTimeout(async () => {
            const profileData = await fetchOrCreateProfile(session.user);
            setProfile(profileData);
            setLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchOrCreateProfile(session.user).then(profileData => {
          setProfile(profileData);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
