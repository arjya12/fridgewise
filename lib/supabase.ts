import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables - check your .env file");
}

function summarizeSupabaseAuthRequest(input: Parameters<typeof fetch>[0]) {
  const rawUrl =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;

  try {
    const parsed = new URL(rawUrl);
    const isSupabaseAuth = parsed.href.startsWith(`${supabaseUrl}/auth/v1`);
    const isResetRelevant =
      parsed.pathname.includes("/recover") ||
      parsed.pathname.includes("/verify") ||
      parsed.pathname.includes("/token") ||
      parsed.pathname.includes("/user");

    if (!isSupabaseAuth || !isResetRelevant) return null;

    const redirectTo = parsed.searchParams.get("redirect_to");
    const grantType = parsed.searchParams.get("grant_type");

    return {
      path: parsed.pathname,
      hasRedirectTo: Boolean(redirectTo),
      redirectTo,
      grantType,
    };
  } catch {
    return null;
  }
}

// Custom fetch with retry for Android "Network request failed" (common on RN + Supabase)
const fetchWithRetry: typeof fetch = async (input, init) => {
  const maxRetries = 3;
  let lastError: unknown;
  const authRequestSummary = __DEV__
    ? summarizeSupabaseAuthRequest(input)
    : null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      if (authRequestSummary) {
        console.log("[SupabaseAuthFetch] request", {
          ...authRequestSummary,
          method: init?.method ?? "GET",
          attempt: i + 1,
        });
      }

      // Some environments can hang indefinitely on fetch. Add a hard timeout
      // so auth flows (reset/verification) don't get stuck forever.
      const controller = new AbortController();
      const TIMEOUT_MS = 8000;
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const response = await fetch(input, {
          ...(init ?? {}),
          signal: controller.signal,
        });
        if (authRequestSummary) {
          console.log("[SupabaseAuthFetch] response", {
            path: authRequestSummary.path,
            status: response.status,
            ok: response.ok,
            attempt: i + 1,
          });
        }
        return response;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (e) {
      lastError = e;
      if (authRequestSummary) {
        console.log("[SupabaseAuthFetch] error", {
          path: authRequestSummary.path,
          attempt: i + 1,
          name: e instanceof Error ? e.name : undefined,
          message: e instanceof Error ? e.message : String(e),
        });
      }

      const isAbortError =
        typeof e === "object" &&
        e !== null &&
        "name" in e &&
        e.name === "AbortError";

      const isNetworkError =
        (e instanceof TypeError &&
          (e.message === "Network request failed" ||
            e.message?.includes("Network request failed"))) ||
        isAbortError;
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
