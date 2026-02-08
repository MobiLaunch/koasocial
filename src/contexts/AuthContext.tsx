import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
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

  // Prevent repeated heavy profile work during token refreshes / rapid auth events
  const lastProfileLoadedForUserIdRef = useRef<string | null>(null);
  const initializingRef = useRef(false);
  const pendingSessionRef = useRef<Session | null | undefined>(undefined);

  const fetchProfile = async (userId: string) => {
    try {
      // Prefer lookup by primary key (profiles.id = auth.users.id)
      const byId = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .limit(1)
        .maybeSingle();

      if (byId.error) {
        console.error("Error fetching profile (by id):", byId.error);
        return null;
      }

      if (byId.data) {
        return byId.data as Profile;
      }

      // Fallback to legacy mapping (profiles.user_id)
      const byUserId = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (byUserId.error) {
        console.error("Error fetching profile (by user_id):", byUserId.error);
        return null;
      }

      return (byUserId.data ?? null) as Profile | null;
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
      const baseUsername = email
        ? email
            .split("@")[0]
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, "_")
        : `user_${user.id.slice(0, 8)}`;

      // Ensure unique username
      let attempts = 0;
      let finalUsername = baseUsername;

      while (attempts < 5) {
        const { data: existing } = await supabase
          .from("profiles")
          .select("username")
          .eq("username", finalUsername)
          .limit(1)
          .maybeSingle();

        if (!existing) break;
        finalUsername = `${baseUsername}_${Math.floor(Math.random() * 1000)}`;
        attempts++;
      }

      const displayName = metadata?.full_name || metadata?.name || finalUsername;
      const avatarUrl = metadata?.avatar_url || metadata?.picture || null;

      const { data, error } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          user_id: user.id,
          username: finalUsername,
          display_name: displayName,
          avatar_url: avatarUrl,
        } as any)
        .select()
        .single();

      if (error) {
        console.error("Error creating profile for OAuth user:", error);

        // If creation failed because it already exists (or due to a race), fall back to fetch.
        const existing = await fetchProfile(user.id);
        return existing;
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

      // If no profile exists, try to create one
      if (!profileData) {
        console.log("Profile missing, attempting to recreate...");
        profileData = await createProfileForOAuthUser(user);
      }

      // If we still don't have a profile, do NOT sign the user out.
      // Signing out here can cause an auth redirect loop if profile creation is failing for any reason.
      if (!profileData) {
        console.error("User authenticated but profile fetch/create failed; continuing without profile.");
        return null;
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

    const initializeAuth = async (nextSession: Session | null) => {
      if (!mounted) return;

      // Prevent overlapping runs (can happen during rapid auth events / refresh)
      if (initializingRef.current) {
        pendingSessionRef.current = nextSession;
        return;
      }

      initializingRef.current = true;
      pendingSessionRef.current = undefined;

      try {
        setSession((prev) => (prev?.access_token === nextSession?.access_token ? prev : nextSession));
        setUser((prev) => (prev?.id === (nextSession?.user?.id ?? null) ? prev : nextSession?.user ?? null));

        const nextUserId = nextSession?.user?.id ?? null;

        if (!nextUserId) {
          lastProfileLoadedForUserIdRef.current = null;
          setProfile(null);
          return;
        }

        // Only fetch profile when the user changes (avoid heavy work on token refresh)
        if (lastProfileLoadedForUserIdRef.current !== nextUserId) {
          const profileData = await fetchOrCreateProfile(nextSession!.user);
          if (mounted) {
            setProfile(profileData);
          }
          lastProfileLoadedForUserIdRef.current = nextUserId;
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        initializingRef.current = false;
        if (mounted) {
          setLoading(false);
        }

        // If an auth event arrived while we were initializing, immediately process the latest.
        const pending = pendingSessionRef.current;
        if (pending !== undefined) {
          pendingSessionRef.current = undefined;
          void initializeAuth(pending);
        }
      }
    };

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void initializeAuth(nextSession);
    });

    // Prime initial session state
    supabase.auth
      .getSession()
      .then(({ data }) => {
        void initializeAuth(data.session);
      })
      .catch((error) => {
        console.error("Error getting initial session:", error);
        if (mounted) setLoading(false);
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

// Ensure this export is OUTSIDE the AuthProvider function
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
