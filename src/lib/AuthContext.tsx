"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

interface SignUpDetails {
  fullName: string;
  dateOfBirth: string;
  stateId: number | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    details: SignUpDetails
  ) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  // "Cuba demo — tanpa akaun": anonymous sign-in so a visitor can try the
  // queue flow instantly. No sample data is seeded (unlike duitduit's
  // demo, MyBeratur's queue numbers are meant to reflect a real booking,
  // so there's nothing meaningful to pre-fill) — the anonymous user just
  // gets a real session and can use the app like any signed-up user.
  startDemo: () => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, details: SignUpDetails) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: details.fullName } },
      });
      if (error) {
        return { error: error.message, needsEmailConfirmation: false };
      }

      const userId = data.user?.id;
      if (userId) {
        // Same table prefix and field names as the app's existing
        // (pre-auth) scaffolding: src/lib/supabaseApi.ts's nogipin_*
        // tables, and src/data/branches.ts's/states.ts's state_id — so
        // the queue-eligibility/category-selection code can read a
        // user's profile without any changes there. If email
        // confirmation is required there is no active session yet, so
        // RLS rejects this insert — that's expected, not an error we
        // surface to the user.
        const { error: profileError } = await supabase.from("nogipin_profiles").insert([
          {
            id: userId,
            full_name: details.fullName || null,
            date_of_birth: details.dateOfBirth || null,
            state_id: details.stateId,
          },
        ]);
        if (profileError) {
          console.error("Error saving profile:", profileError.message);
        }
      }

      return { error: null, needsEmailConfirmation: !data.session };
    },
    []
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const startDemo = useCallback(async () => {
    const { error } = await supabase.auth.signInAnonymously();
    return { error: error ? error.message : null };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      startDemo,
    }),
    [session, loading, signIn, signUp, signOut, startDemo]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
