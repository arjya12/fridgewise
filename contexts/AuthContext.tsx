import { supabase, UserProfile } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  getUserProfile: () => Promise<UserProfile | null>;
  updateUserProfile: (
    data: Partial<UserProfile>
  ) => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile data
  const getUserProfile = async (): Promise<UserProfile | null> => {
    try {
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        return null;
      }

      setUserProfile(data as UserProfile);
      return data as UserProfile;
    } catch (error) {
      console.error("Error in getUserProfile:", error);
      return null;
    }
  };

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
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // If user exists, fetch their profile
      if (session?.user) {
        getUserProfile();
      }
    });

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // If user exists, fetch their profile
        if (session?.user) {
          await getUserProfile();
        } else {
          setUserProfile(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error: any) {
      Alert.alert("Error", error.message);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (error) throw error;

      if (data?.user && fullName) {
        // Update user profile with full name
        await supabase
          .from("user_profiles")
          .update({ full_name: fullName })
          .eq("id", data.user.id);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      Alert.alert("Error", error.message);
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
