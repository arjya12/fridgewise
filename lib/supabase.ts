import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types
export interface FoodItem {
  id: string;
  user_id: string;
  name: string;
  quantity: number;
  unit?: string;
  location: "fridge" | "shelf";
  expiry_date?: string;
  category?: string;
  barcode?: string;
  image_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface UsageLog {
  id: string;
  item_id: string;
  user_id: string;
  status: "used" | "expired" | "wasted";
  quantity: number;
  logged_at: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  item_id: string;
  type: "expiry" | "low_stock";
  message: string;
  scheduled_for: string;
  is_read: boolean;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  notification_preferences: {
    expiry_days_before: number;
    low_stock_threshold: number;
    notification_time: string;
  };
  created_at: string;
  updated_at: string;
}
