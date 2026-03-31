import {
  clearRememberMePreference,
  REMEMBER_ME_STORAGE_KEY,
  setRememberMePreference,
} from "@/lib/authPreferences";
import { supabase, UserProfile } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Session, User } from "@supabase/supabase-js";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string,
    options?: { rememberMe?: boolean }
  ) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<{ needsEmailVerification: boolean }>;
  signOut: () => Promise<void>;
  getUserProfile: (userIdOverride?: string) => Promise<UserProfile | null>;
  updateUserProfile: (
    data: Partial<UserProfile>
  ) => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchUserProfileById(
  userId: string
): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }

    return data as UserProfile;
  } catch (error) {
    console.error("Error in fetchUserProfileById:", error);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile data (pass user id when React state `user` is not updated yet)
  const getUserProfile = useCallback(
    async (userIdOverride?: string): Promise<UserProfile | null> => {
      const id = userIdOverride ?? user?.id;
      if (!id) return null;
      const profile = await fetchUserProfileById(id);
      if (profile) setUserProfile(profile);
      return profile;
    },
    [user?.id]
  );

  // Update user profile data
  const updateUserProfile = async (
    data: Partial<UserProfile>
  ): Promise<UserProfile | null> => {
    try {
      if (!user) return null;

      // Remove id from data if present as it shouldn't be updated
      const { id, ...updateData } = data;

      const { data: updatedProfile, error } = await supabase
        .from("user_profiles")
        .update(updateData)
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating user profile:", error);
        return null;
      }

      // Update the local state
      setUserProfile(updatedProfile as UserProfile);
      return updatedProfile as UserProfile;
    } catch (error) {
      console.error("Error in updateUserProfile:", error);
      return null;
    }
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      let session = (await supabase.auth.getSession()).data.session;
      const rememberRaw = await AsyncStorage.getItem(REMEMBER_ME_STORAGE_KEY);

      if (session && rememberRaw === "false") {
        await supabase.auth.signOut();
        session = (await supabase.auth.getSession()).data.session;
      }

      if (cancelled) return;

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        const profile = await fetchUserProfileById(session.user.id);
        if (!cancelled && profile) setUserProfile(profile);
      }
    };

    void init();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const profile = await fetchUserProfileById(session.user.id);
          if (profile) setUserProfile(profile);
        } else {
          setUserProfile(null);
        }
      }
    );

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (
    email: string,
    password: string,
    options?: { rememberMe?: boolean }
  ) => {
    try {
      const rememberMe = options?.rememberMe !== false;
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      await setRememberMePreference(rememberMe);
    } catch (error: any) {
      throw error;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName?: string
  ): Promise<{ needsEmailVerification: boolean }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (error) throw error;

      // Supabase returns a user with no identities when the email
      // is already registered for an existing account.
      if (
        data?.user &&
        Array.isArray((data.user as any).identities) &&
        (data.user as any).identities.length === 0
      ) {
        throw new Error("An account with this email already exists.");
      }

      if (data?.user && fullName) {
        // Update user profile with full name
        await supabase
          .from("user_profiles")
          .update({ full_name: fullName })
          .eq("id", data.user.id);
      }

      // No session until the user confirms email (when confirmation is enabled in Supabase).
      return { needsEmailVerification: !data?.session };
    } catch (error: any) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      await clearRememberMePreference();
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userProfile,
        loading,
        signIn,
        signUp,
        signOut,
        getUserProfile,
        updateUserProfile,
      }}
    >
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
