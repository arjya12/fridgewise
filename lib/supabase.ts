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

  const url =
    typeof input === "string"
      ? input
      : input instanceof Request
        ? input.url
        : String(input);
  const method =
    (init as any)?.method ??
    (input instanceof Request ? input.method : undefined) ??
    "GET";
  // Avoid logging query/fragment (can contain auth tokens).
  const safeUrl = url.split("?")[0]?.split("#")[0] ?? url;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const attempt = i + 1;
      // On some RN/Expo environments, `fetch()` can hang indefinitely and AbortController
      // may not reliably cancel the underlying request. Use a Promise.race timeout
      // so callers always get a resolve/reject, and also attempt abort when supported.
      const TIMEOUT_MS = 30000;
      const controller =
        typeof AbortController !== "undefined" ? new AbortController() : null;

      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          try {
            controller?.abort();
          } catch {
            // ignore abort failures
          }
          const err = new Error("Fetch timeout");
          (err as any).name = "TimeoutError";
          reject(err);
        }, TIMEOUT_MS);
      });

      const fetchPromise = fetch(input, {
        ...(init ?? {}),
        ...(controller ? { signal: controller.signal } : null),
      });

      try {
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        return response;
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    } catch (e) {
      lastError = e;
      const isAbortError =
        typeof e === "object" &&
        e !== null &&
        "name" in e &&
        e.name === "AbortError";
      const isTimeoutError =
        typeof e === "object" && e !== null && "name" in e && e.name === "TimeoutError";

      const isNetworkError =
        (e instanceof TypeError &&
          (e.message === "Network request failed" ||
            e.message?.includes("Network request failed"))) ||
        isAbortError ||
        isTimeoutError;

      if (isNetworkError && i < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, 500 * (i + 1)));
        continue;
      }
      throw e;
    }
  }
  throw lastError;
};

// RN AsyncStorage can occasionally deadlock/hang under concurrent access.
// Wrap it to (1) serialize operations and (2) emit timings for debugging.
const createSerializedStorage = () => {
  let chain: Promise<unknown> = Promise.resolve();
  const enqueue = <T,>(opName: string, key: string, fn: () => Promise<T>) => {
    const safeKey = key.startsWith("sb-") ? "sb-…" : key;
    const run = async () => {
      try {
        const result = await fn();
        return result;
      } catch (e: any) {
        throw e;
      }
    };
    const p = chain.then(run, run);
    // keep chain alive but don't leak typed errors into it
    chain = p.catch(() => undefined);
    return p;
  };

  return {
    getItem: (key: string) => enqueue("getItem", key, () => AsyncStorage.getItem(key)),
    setItem: (key: string, value: string) =>
      enqueue("setItem", key, () => AsyncStorage.setItem(key, value)),
    removeItem: (key: string) =>
      enqueue("removeItem", key, () => AsyncStorage.removeItem(key)),
  };
};

const supabaseStorage = createSerializedStorage();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: supabaseStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: { fetch: fetchWithRetry },
});

// Ephemeral auth client for credential checks that must NOT mutate the app session.
// (Using the main client for signInWithPassword can trigger auth state changes and logout.)
export const supabaseEphemeralAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  global: { fetch: fetchWithRetry },
});

async function withOpTimeout<T>(promise: Promise<T>, ms: number, name: string) {
  return await Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${name}-timeout`)), ms)
    ),
  ]);
}

/**
 * Direct password update via Supabase Auth REST endpoint.
 *
 * We use this instead of `supabase.auth.updateUser()` because in some RN/Expo
 * environments the supabase-js promise can hang even after the HTTP request and
 * AsyncStorage writes complete.
 */
export async function updatePasswordDirect(newPassword: string) {
  const session = (await supabase.auth.getSession()).data.session;
  const accessToken = session?.access_token;
  if (!accessToken) {
    throw new Error("Missing session");
  }

  const res = await fetchWithRetry(`${supabaseUrl}/auth/v1/user`, {
    method: "PUT",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password: newPassword }),
  });

  const text = await withOpTimeout(res.text(), 10000, "auth-user-body");
  let payload: any = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const message =
      payload?.msg ||
      payload?.message ||
      payload?.error_description ||
      payload?.error ||
      text ||
      `Auth update failed (${res.status})`;
    throw new Error(message);
  }

  return payload;
}

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
  /** When false, no per-item expiry notifications are scheduled. */
  notifications_enabled?: boolean | null;
  /** Calendar days before expiry for the first reminder. */
  notification_reminder_days?: number | null;
  /** Local reminder time, 24h `HH:mm`. */
  notification_time?: string | null;
  /** `none` | `daily` | `weekly` | `monthly` */
  notification_repeat?: string | null;
  /** Expo scheduled notification identifiers for this item (JSON array in DB). */
  notification_ids?: string[] | null;
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
