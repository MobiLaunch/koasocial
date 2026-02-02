import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(); // Changed from .single() to .maybeSingle() to prevent 406 errors

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }

      return data as Profile;
    } catch (error) {
      console.error("Unexpected error in fetchProfile:", error);
      return null;
    }
  };

  const createProfileForOAuthUser = async (user: User): Promise<Profile | null> => {
    try {
      const metadata = user.user_metadata || {};
      const email = user.email || "";

      // Generate username from email or fallback to user ID segment
      let username = email
        ? email
            .split("@")[0]
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, "_")
        : `user_${user.id.slice(0, 8)}`;

      // Ensure unique username
      let attempts = 0;
      let finalUsername = username;

      while (attempts < 5) {
        const { data: existing } = await supabase
          .from("profiles")
          .select("username")
          .eq("username", finalUsername)
          .maybeSingle();

        if (!existing) break;
        finalUsername = `${username}_${Math.floor(Math.random() * 1000)}`;
        attempts++;
      }

      const displayName = metadata?.full_name || metadata?.name || finalUsername;
      const avatarUrl = metadata?.avatar_url || metadata?.picture || null;

      const { data, error } = await supabase
        .from("profiles")
        .insert({
          user_id: user.id,
          username: finalUsername,
          display_name: displayName,
          avatar_url: avatarUrl,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating profile for OAuth user:", error);
        return null;
      }

      return data as Profile;
    } catch (error) {
      console.error("Unexpected error in createProfile:", error);
      return null;
    }
  };

  const fetchOrCreateProfile = async (user: User): Promise<Profile | null> => {
    try {
      let profileData = await fetchProfile(user.id);

      // If no profile exists (OAuth user), create one
      if (!profileData) {
        profileData = await createProfileForOAuthUser(user);
      }

      return profileData;
    } catch (error) {
      console.error("Error in fetchOrCreateProfile flow:", error);
      return null;
    }
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
    let mounted = true;

    // We define the async logic inside a separate function to use try/finally
    const initializeAuth = async (session: Session | null) => {
      try {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const profileData = await fetchOrCreateProfile(session.user);
          if (mounted) {
            setProfile(profileData);
          }
        } else {
          if (mounted) {
            setProfile(null);
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        // Crucial: This ensures loading stops regardless of success or failure
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        initializeAuth(session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
