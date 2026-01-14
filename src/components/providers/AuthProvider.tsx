"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Profile } from "@/types/database";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchProfile = async (userId: string) => {
    try {
      const timeoutPromise = new Promise<null>((resolve) => 
        setTimeout(() => resolve(null), 3000)
      );
      const profilePromise = supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()
        .then(r => r.data);
      
      const data = await Promise.race([profilePromise, timeoutPromise]);
      
      if (data) {
        setProfile(data as Profile);
      }
    } catch (error) {
      console.error('Profile fetch failed:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Get initial session with timeout
    const initAuth = async () => {
      try {
        const timeoutPromise = new Promise<null>((resolve) => 
          setTimeout(() => resolve(null), 3000)
        );
        const sessionPromise = supabase.auth.getSession().then(r => r.data.session);
        const session = await Promise.race([sessionPromise, timeoutPromise]);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Don't block on profile fetch
          fetchProfile(session.user.id).catch(console.error);
        }
      } catch (error) {
        console.error('Auth init failed:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    // Always redirect to login page
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};




