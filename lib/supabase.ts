import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables - check your .env file");
}

// Custom fetch with retry for Android "Network request failed" (common on RN + Supabase)
const fetchWithRetry: typeof fetch = async (input, init) => {
  const maxRetries = 3;
  let lastError: unknown;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetch(input, init);
    } catch (e) {
      lastError = e;
      const isNetworkError =
        e instanceof TypeError &&
        (e.message === "Network request failed" || e.message?.includes("Network request failed"));
      if (isNetworkError && i < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, 500 * (i + 1)));
        continue;
      }
      throw e;
    }
  }
  throw lastError;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: { fetch: fetchWithRetry },
});

// Database types
export interface FoodItem {
  id: string;
  user_id: string;
  name: string;
  /** Lowercase trimmed single-spaced name for matching; set on create/update. */
  normalized_name?: string;
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

// Enhanced Analytics Types
export interface WasteAnalytics {
  totalWasted: number;
  wasteValue: number;
  wasteByCategory: Record<string, number>;
  wasteTrends: WasteTrendData[];
  mostWastedItems: ItemWasteData[];
  wasteReductionProgress: number;
}

export interface ConsumptionAnalytics {
  mostConsumedItems: ItemConsumptionData[];
  shoppingPatterns: ShoppingPattern[];
  budgetAnalysis: BudgetAnalysis;
  nutritionalInsights: NutritionalData[];
  cookingVsEatingOut: ConsumptionPattern;
  mealPlanningEffectiveness: number;
}

export interface WasteTrendData {
  date: string;
  wasteCount: number;
  wasteValue: number;
}

export interface ItemWasteData {
  name: string;
  count: number;
  value: number;
  category: string;
}

export interface ItemConsumptionData {
  name: string;
  count: number;
  frequency: number;
  category: string;
}

export interface ShoppingPattern {
  category: string;
  frequency: number;
  averageQuantity: number;
  seasonalTrend: number;
}

export interface BudgetAnalysis {
  plannedBudget: number;
  actualSpending: number;
  variance: number;
  categoryBreakdown: Record<string, number>;
}

export interface NutritionalData {
  category: string;
  consumptionScore: number;
  recommendations: string[];
}

export interface ConsumptionPattern {
  cookingFrequency: number;
  eatingOutFrequency: number;
  homeVsOutRatio: number;
}

// Achievement System Types
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'waste_reduction' | 'consumption' | 'streak' | 'milestone';
  threshold: number;
  progress: number;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface UserAchievements {
  userId: string;
  achievements: Achievement[];
  currentStreak: number;
  bestStreak: number;
  totalPoints: number;
  level: number;
}

// Enhanced Food Item with cost data
export interface FoodItemWithCost extends FoodItem {
  cost?: number;
  estimatedCost?: number;
}
