import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { openFacebookLogin, getRedirectUri } from "@/lib/facebook-login";

export interface AppUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
  has_completed_onboarding: boolean;
  store_id: string | null;
  role: string | null;
}

interface AuthContextValue {
  user: AppUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function buildAppUser(supabaseUser: SupabaseUser): Promise<AppUser> {
  // Check if user has a store (via user_roles)
  const { data: roles } = await supabase
    .from("user_roles")
    .select("store_id, role")
    .eq("user_id", supabaseUser.id)
    .limit(1);

  const storeId = roles && roles.length > 0 ? roles[0].store_id : null;
  const role = roles && roles.length > 0 ? roles[0].role : null;

  // Check profile
  let name = supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email?.split("@")[0] || "User";
  let avatarUrl = supabaseUser.user_metadata?.avatar_url || `https://i.pravatar.cc/150?u=${supabaseUser.id}`;

  if (storeId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, avatar_url")
      .eq("user_id", supabaseUser.id)
      .eq("store_id", storeId)
      .maybeSingle();

    if (profile) {
      name = profile.name || name;
      avatarUrl = profile.avatar_url || avatarUrl;
    }
  }

  return {
    id: supabaseUser.id,
    email: supabaseUser.email || "",
    name,
    avatar_url: avatarUrl,
    has_completed_onboarding: !!storeId,
    store_id: storeId,
    role,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        // Use setTimeout to avoid deadlock with Supabase client
        setTimeout(async () => {
          const appUser = await buildAppUser(newSession.user);
          setUser(appUser);
          setIsLoading(false);
        }, 0);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      setSession(existingSession);
      if (existingSession?.user) {
        const appUser = await buildAppUser(existingSession.user);
        setUser(appUser);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) throw error;
  }, []);

  const signInWithFacebook = useCallback(async () => {
    const code = await openFacebookLogin();
    const redirectUri = getRedirectUri();

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const res = await fetch(
      `https://${projectId}.supabase.co/functions/v1/facebook-auth`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, redirect_uri: redirectUri }),
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erreur Facebook");

    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: data.token_hash,
      type: "magiclink",
    });
    if (verifyError) throw verifyError;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      const appUser = await buildAppUser(currentUser);
      setUser(appUser);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!session,
        isLoading,
        signUp,
        signIn,
        signInWithGoogle,
        signInWithFacebook,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
