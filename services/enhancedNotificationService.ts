// services/enhancedNotificationService.ts
import { analyzeMealPlanning } from "@/utils/mealPlanningUtils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { FoodItemWithUrgency } from "./foodItems";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationPreferences {
  enabled: boolean;
  expiryAlerts: {
    enabled: boolean;
    criticalHours: number; // Hours before expiry for critical alerts
    warningHours: number; // Hours before expiry for warning alerts
    dailyReminder: boolean;
    dailyReminderTime: string; // HH:MM format
  };
  mealSuggestions: {
    enabled: boolean;
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
    beforeMealMinutes: number; // Minutes before typical meal time
  };
  shoppingReminders: {
    enabled: boolean;
    lowStockThreshold: number;
    weeklyReminder: boolean;
    reminderDay: number; // 0 = Sunday, 1 = Monday, etc.
  };
  wasteReduction: {
    enabled: boolean;
    aggressiveMode: boolean; // More frequent notifications when waste is high
  };
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
  };
}

export interface UserPattern {
  id: string;
  type: "meal_time" | "shopping_day" | "cooking_frequency" | "waste_level";
  value: any;
  confidence: number; // 0-1 scale
  lastUpdated: string;
  occurrences: number;
}

export interface NotificationContext {
  currentTime: Date;
  dayOfWeek: number;
  isWeekend: boolean;
  weatherCondition?: string;
  userLocation?: string;
  recentActivity?: string[];
}

export interface SmartNotification {
  id: string;
  type:
    | "expiry_alert"
    | "meal_suggestion"
    | "shopping_reminder"
    | "waste_warning"
    | "achievement";
  title: string;
  body: string;
  data: any;
  scheduledTime?: Date;
  priority: "low" | "normal" | "high" | "critical";
  category: string;
  actions?: NotificationAction[];
  contextualRelevance: number; // 0-1 score
}

export interface NotificationAction {
  id: string;
  title: string;
  options?: {
    foreground?: boolean;
    destructive?: boolean;
    authenticationRequired?: boolean;
  };
}

class EnhancedNotificationService {
  private readonly STORAGE_KEYS = {
    PREFERENCES: "notification_preferences",
    USER_PATTERNS: "user_patterns",
    NOTIFICATION_HISTORY: "notification_history",
    INTERACTION_STATS: "notification_interaction_stats",
  };

  private readonly DEFAULT_PREFERENCES: NotificationPreferences = {
    enabled: true,
    expiryAlerts: {
      enabled: true,
      criticalHours: 24,
      warningHours: 48,
      dailyReminder: true,
      dailyReminderTime: "09:00",
    },
    mealSuggestions: {
      enabled: true,
      breakfast: true,
      lunch: true,
      dinner: true,
      beforeMealMinutes: 30,
    },
    shoppingReminders: {
      enabled: true,
      lowStockThreshold: 3,
      weeklyReminder: true,
      reminderDay: 0, // Sunday
    },
    wasteReduction: {
      enabled: true,
      aggressiveMode: false,
    },
    quietHours: {
      enabled: true,
      startTime: "22:00",
      endTime: "07:00",
    },
  };

  private readonly TYPICAL_MEAL_TIMES = {
    breakfast: { hour: 8, minute: 0 },
    lunch: { hour: 12, minute: 30 },
    dinner: { hour: 18, minute: 30 },
  };

  /**
   * Initialize the notification service
   */
  async initialize(): Promise<void> {
    // Request permissions
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("Notification permissions not granted");
      return;
    }

    // Set up notification categories
    await this.setupNotificationCategories();

    // Initialize user patterns if first time
    const patterns = await this.getUserPatterns();
    if (patterns.length === 0) {
      await this.initializeDefaultPatterns();
    }
  }

  /**
   * Set up notification categories with actions
   */
  private async setupNotificationCategories(): Promise<void> {
    await Notifications.setNotificationCategoryAsync("expiry_alert", [
      {
        identifier: "mark_used",
        buttonTitle: "Mark as Used",
        options: { foreground: true },
      },
      {
        identifier: "extend_expiry",
        buttonTitle: "Extend Expiry",
        options: { foreground: true },
      },
      {
        identifier: "snooze",
        buttonTitle: "Remind Later",
        options: { foreground: false },
      },
    ]);

    await Notifications.setNotificationCategoryAsync("meal_suggestion", [
      {
        identifier: "view_recipe",
        buttonTitle: "View Recipe",
        options: { foreground: true },
      },
      {
        identifier: "mark_ingredients_used",
        buttonTitle: "Use Ingredients",
        options: { foreground: true },
      },
    ]);

    await Notifications.setNotificationCategoryAsync("shopping_reminder", [
      {
        identifier: "add_to_list",
        buttonTitle: "Add to List",
        options: { foreground: true },
      },
      {
        identifier: "dismiss",
        buttonTitle: "Not Now",
        options: { foreground: false },
      },
    ]);
  }

  /**
   * Initialize default user patterns
   */
  private async initializeDefaultPatterns(): Promise<void> {
    const defaultPatterns: UserPattern[] = [
      {
        id: "breakfast_time",
        type: "meal_time",
        value: this.TYPICAL_MEAL_TIMES.breakfast,
        confidence: 0.5,
        lastUpdated: new Date().toISOString(),
        occurrences: 1,
      },
      {
        id: "lunch_time",
        type: "meal_time",
        value: this.TYPICAL_MEAL_TIMES.lunch,
        confidence: 0.5,
        lastUpdated: new Date().toISOString(),
        occurrences: 1,
      },
      {
        id: "dinner_time",
        type: "meal_time",
        value: this.TYPICAL_MEAL_TIMES.dinner,
        confidence: 0.5,
        lastUpdated: new Date().toISOString(),
        occurrences: 1,
      },
      {
        id: "cooking_frequency",
        type: "cooking_frequency",
        value: "moderate", // low, moderate, high
        confidence: 0.3,
        lastUpdated: new Date().toISOString(),
        occurrences: 1,
      },
      {
        id: "waste_level",
        type: "waste_level",
        value: "low", // low, moderate, high
        confidence: 0.3,
        lastUpdated: new Date().toISOString(),
        occurrences: 1,
      },
    ];

    await AsyncStorage.setItem(
      this.STORAGE_KEYS.USER_PATTERNS,
      JSON.stringify(defaultPatterns)
    );
  }

  /**
   * Get user notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEYS.PREFERENCES);
      if (stored) {
        return { ...this.DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error("Error loading notification preferences:", error);
    }
    return this.DEFAULT_PREFERENCES;
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    try {
      const current = await this.getPreferences();
      const updated = { ...current, ...preferences };
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.PREFERENCES,
        JSON.stringify(updated)
      );
    } catch (error) {
      console.error("Error saving notification preferences:", error);
    }
  }

  /**
   * Get user patterns
   */
  async getUserPatterns(): Promise<UserPattern[]> {
    try {
      const stored = await AsyncStorage.getItem(
        this.STORAGE_KEYS.USER_PATTERNS
      );
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error loading user patterns:", error);
      return [];
    }
  }

  /**
   * Update user pattern based on behavior
   */
  async updateUserPattern(
    patternId: string,
    newValue: any,
    confidence?: number
  ): Promise<void> {
    try {
      const patterns = await this.getUserPatterns();
      const existingIndex = patterns.findIndex((p) => p.id === patternId);

      if (existingIndex >= 0) {
        const existing = patterns[existingIndex];
        patterns[existingIndex] = {
          ...existing,
          value: newValue,
          confidence: confidence ?? Math.min(existing.confidence + 0.1, 1.0),
          lastUpdated: new Date().toISOString(),
          occurrences: existing.occurrences + 1,
        };
      } else {
        patterns.push({
          id: patternId,
          type: patternId.includes("time") ? "meal_time" : "cooking_frequency",
          value: newValue,
          confidence: confidence ?? 0.6,
          lastUpdated: new Date().toISOString(),
          occurrences: 1,
        });
      }

      await AsyncStorage.setItem(
        this.STORAGE_KEYS.USER_PATTERNS,
        JSON.stringify(patterns)
      );
    } catch (error) {
      console.error("Error updating user pattern:", error);
    }
  }

  /**
   * Learn from user behavior (when they cook, shop, etc.)
   */
  async learnFromBehavior(
    action: string,
    context: NotificationContext
  ): Promise<void> {
    const { currentTime, dayOfWeek } = context;
    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();

    switch (action) {
      case "cook_breakfast":
        await this.updateUserPattern("breakfast_time", { hour, minute });
        break;
      case "cook_lunch":
        await this.updateUserPattern("lunch_time", { hour, minute });
        break;
      case "cook_dinner":
        await this.updateUserPattern("dinner_time", { hour, minute });
        break;
      case "shop_groceries":
        await this.updateUserPattern("shopping_day", dayOfWeek);
        break;
      case "use_item":
        await this.updateUserPattern("cooking_frequency", "high");
        break;
      case "waste_item":
        await this.updateUserPattern("waste_level", "high");
        break;
    }
  }

  /**
   * Generate context-aware notifications
   */
  async generateSmartNotifications(
    items: FoodItemWithUrgency[],
    context: NotificationContext
  ): Promise<SmartNotification[]> {
    const preferences = await this.getPreferences();
    const patterns = await this.getUserPatterns();
    const notifications: SmartNotification[] = [];

    if (
      !preferences.enabled ||
      this.isQuietHours(context.currentTime, preferences)
    ) {
      return notifications;
    }

    // Expiry alerts
    if (preferences.expiryAlerts.enabled) {
      notifications.push(
        ...(await this.generateExpiryAlerts(items, context, preferences))
      );
    }

    // Meal suggestions
    if (preferences.mealSuggestions.enabled) {
      notifications.push(
        ...(await this.generateMealSuggestions(
          items,
          context,
          preferences,
          patterns
        ))
      );
    }

    // Shopping reminders
    if (preferences.shoppingReminders.enabled) {
      notifications.push(
        ...(await this.generateShoppingReminders(items, context, preferences))
      );
    }

    // Waste reduction alerts
    if (preferences.wasteReduction.enabled) {
      notifications.push(
        ...(await this.generateWasteReductionAlerts(
          items,
          context,
          preferences
        ))
      );
    }

    // Sort by priority and contextual relevance
    return notifications.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
      const priorityDiff =
        priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.contextualRelevance - a.contextualRelevance;
    });
  }

  /**
   * Generate expiry alerts
   */
  private async generateExpiryAlerts(
    items: FoodItemWithUrgency[],
    context: NotificationContext,
    preferences: NotificationPreferences
  ): Promise<SmartNotification[]> {
    const notifications: SmartNotification[] = [];
    const now = context.currentTime;

    const criticalItems = items.filter(
      (item) => item.urgency.level === "critical"
    );
    const warningItems = items.filter(
      (item) => item.urgency.level === "warning"
    );

    // Critical items (expired or expiring today)
    if (criticalItems.length > 0) {
      notifications.push({
        id: `critical_expiry_${now.getTime()}`,
        type: "expiry_alert",
        title: `🚨 ${criticalItems.length} item${
          criticalItems.length > 1 ? "s" : ""
        } need immediate attention!`,
        body: `${criticalItems
          .slice(0, 3)
          .map((item) => item.name)
          .join(", ")}${
          criticalItems.length > 3
            ? ` and ${criticalItems.length - 3} more`
            : ""
        } ${
          criticalItems.length > 1 ? "are" : "is"
        } expired or expiring today.`,
        data: { itemIds: criticalItems.map((item) => item.id) },
        priority: "critical",
        category: "expiry_alert",
        contextualRelevance: 0.95,
        actions: [
          { id: "mark_used", title: "Mark as Used" },
          { id: "extend_expiry", title: "Extend Expiry" },
        ],
      });
    }

    // Warning items (expiring in 1-2 days)
    if (warningItems.length > 0 && context.currentTime.getHours() >= 9) {
      notifications.push({
        id: `warning_expiry_${now.getTime()}`,
        type: "expiry_alert",
        title: `⚠️ ${warningItems.length} item${
          warningItems.length > 1 ? "s" : ""
        } expiring soon`,
        body: `${warningItems
          .slice(0, 3)
          .map((item) => item.name)
          .join(", ")} ${
          warningItems.length > 1 ? "are" : "is"
        } expiring within 2 days. Consider using ${
          warningItems.length > 1 ? "them" : "it"
        } soon!`,
        data: { itemIds: warningItems.map((item) => item.id) },
        priority: "high",
        category: "expiry_alert",
        contextualRelevance: 0.8,
        actions: [
          { id: "view_recipe", title: "View Recipe Ideas" },
          { id: "snooze", title: "Remind Later" },
        ],
      });
    }

    return notifications;
  }

  /**
   * Generate meal suggestions
   */
  private async generateMealSuggestions(
    items: FoodItemWithUrgency[],
    context: NotificationContext,
    preferences: NotificationPreferences,
    patterns: UserPattern[]
  ): Promise<SmartNotification[]> {
    const notifications: SmartNotification[] = [];
    const analysis = analyzeMealPlanning(items);

    if (analysis.recommendations.priority.length === 0) {
      return notifications;
    }

    const currentHour = context.currentTime.getHours();
    const currentMinute = context.currentTime.getMinutes();

    // Determine if it's near a meal time
    const mealTimes = {
      breakfast:
        this.getMealTimeFromPatterns(patterns, "breakfast_time") ||
        this.TYPICAL_MEAL_TIMES.breakfast,
      lunch:
        this.getMealTimeFromPatterns(patterns, "lunch_time") ||
        this.TYPICAL_MEAL_TIMES.lunch,
      dinner:
        this.getMealTimeFromPatterns(patterns, "dinner_time") ||
        this.TYPICAL_MEAL_TIMES.dinner,
    };

    const beforeMealMinutes = preferences.mealSuggestions.beforeMealMinutes;

    for (const [mealType, mealTime] of Object.entries(mealTimes)) {
      if (
        !preferences.mealSuggestions[
          mealType as keyof typeof preferences.mealSuggestions
        ]
      ) {
        continue;
      }

      const targetTime = new Date(context.currentTime);
      targetTime.setHours(mealTime.hour, mealTime.minute, 0, 0);

      const timeDiff = targetTime.getTime() - context.currentTime.getTime();
      const minutesUntilMeal = timeDiff / (1000 * 60);

      // Suggest meals 30 minutes before typical meal time
      if (minutesUntilMeal > 0 && minutesUntilMeal <= beforeMealMinutes) {
        const relevantSuggestions = analysis.recommendations.priority.filter(
          (suggestion) =>
            suggestion.type === mealType ||
            (mealType === "lunch" && suggestion.type === "snack") ||
            (mealType === "dinner" && suggestion.estimatedPrepTime <= 30)
        );

        if (relevantSuggestions.length > 0) {
          const topSuggestion = relevantSuggestions[0];

          notifications.push({
            id: `meal_suggestion_${mealType}_${context.currentTime.getTime()}`,
            type: "meal_suggestion",
            title: `🍳 Perfect time for ${topSuggestion.title}!`,
            body: `Use ${topSuggestion.ingredients.length} ingredients expiring soon. Prep time: ${topSuggestion.estimatedPrepTime} minutes.`,
            data: {
              recipeId: topSuggestion.id,
              mealType,
              ingredients: topSuggestion.ingredients,
            },
            priority: topSuggestion.urgencyScore >= 75 ? "high" : "normal",
            category: "meal_suggestion",
            contextualRelevance:
              0.85 + (topSuggestion.urgencyScore / 100) * 0.15,
            actions: [
              { id: "view_recipe", title: "View Recipe" },
              { id: "mark_ingredients_used", title: "Use Ingredients" },
            ],
          });
        }
      }
    }

    return notifications;
  }

  /**
   * Generate shopping reminders
   */
  private async generateShoppingReminders(
    items: FoodItemWithUrgency[],
    context: NotificationContext,
    preferences: NotificationPreferences
  ): Promise<SmartNotification[]> {
    const notifications: SmartNotification[] = [];

    const lowStockCount = items.filter(
      (item) => item.quantity <= preferences.shoppingReminders.lowStockThreshold
    ).length;

    // Weekly shopping reminder
    if (
      preferences.shoppingReminders.weeklyReminder &&
      context.dayOfWeek === preferences.shoppingReminders.reminderDay &&
      context.currentTime.getHours() === 10
    ) {
      notifications.push({
        id: `weekly_shopping_${context.currentTime.getTime()}`,
        type: "shopping_reminder",
        title: "🛒 Time for your weekly grocery run!",
        body:
          lowStockCount > 0
            ? `You have ${lowStockCount} items running low. Perfect time to restock!`
            : "Consider restocking your favorite items.",
        data: { lowStockCount },
        priority: lowStockCount > 5 ? "high" : "normal",
        category: "shopping_reminder",
        contextualRelevance: 0.7,
        actions: [
          { id: "add_to_list", title: "Add to List" },
          { id: "dismiss", title: "Not Now" },
        ],
      });
    }

    // Low stock alert
    if (lowStockCount >= preferences.shoppingReminders.lowStockThreshold * 2) {
      notifications.push({
        id: `low_stock_${context.currentTime.getTime()}`,
        type: "shopping_reminder",
        title: `📦 ${lowStockCount} items running low`,
        body: "Several items in your inventory are running low. Consider adding them to your shopping list.",
        data: { lowStockCount },
        priority: "normal",
        category: "shopping_reminder",
        contextualRelevance: 0.6,
        actions: [{ id: "add_to_list", title: "Add to List" }],
      });
    }

    return notifications;
  }

  /**
   * Generate waste reduction alerts
   */
  private async generateWasteReductionAlerts(
    items: FoodItemWithUrgency[],
    context: NotificationContext,
    preferences: NotificationPreferences
  ): Promise<SmartNotification[]> {
    const notifications: SmartNotification[] = [];

    const analysis = analyzeMealPlanning(items);
    const wasteRisk = analysis.unusedCritical.length;

    if (
      wasteRisk > 0 &&
      (preferences.wasteReduction.aggressiveMode ||
        context.currentTime.getHours() === 18)
    ) {
      notifications.push({
        id: `waste_warning_${context.currentTime.getTime()}`,
        type: "waste_warning",
        title: `♻️ ${wasteRisk} item${
          wasteRisk > 1 ? "s" : ""
        } at risk of being wasted`,
        body: `${analysis.unusedCritical
          .slice(0, 2)
          .map((item) => item.name)
          .join(", ")} ${wasteRisk > 2 ? `and ${wasteRisk - 2} more` : ""} ${
          wasteRisk > 1 ? "are" : "is"
        } expiring but not used in any meal plans.`,
        data: { unusedItems: analysis.unusedCritical },
        priority: "high",
        category: "waste_warning",
        contextualRelevance: 0.9,
        actions: [
          { id: "find_recipes", title: "Find Recipes" },
          { id: "mark_used", title: "Mark as Used" },
        ],
      });
    }

    return notifications;
  }

  /**
   * Schedule notifications
   */
  async scheduleNotifications(
    notifications: SmartNotification[]
  ): Promise<void> {
    // Cancel existing scheduled notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    for (const notification of notifications) {
      try {
        const scheduledTime =
          notification.scheduledTime || new Date(Date.now() + 5000); // Default 5 seconds

        await Notifications.scheduleNotificationAsync({
          content: {
            title: notification.title,
            body: notification.body,
            data: notification.data,
            categoryIdentifier: notification.category,
          },
          trigger: scheduledTime,
        });
      } catch (error) {
        console.error("Error scheduling notification:", error);
      }
    }
  }

  /**
   * Send immediate notification
   */
  async sendImmediateNotification(
    notification: SmartNotification
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          categoryIdentifier: notification.category,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error("Error sending immediate notification:", error);
    }
  }

  /**
   * Handle notification response
   */
  async handleNotificationResponse(
    actionIdentifier: string,
    notification: Notifications.Notification
  ): Promise<void> {
    const data = notification.request.content.data;

    // Learn from user interaction
    await this.recordInteraction(actionIdentifier, data);

    // Handle specific actions
    switch (actionIdentifier) {
      case "mark_used":
        // Handle marking items as used
        if (data.itemIds) {
          console.log("Marking items as used:", data.itemIds);
        }
        break;
      case "extend_expiry":
        // Handle extending expiry
        if (data.itemIds) {
          console.log("Extending expiry for items:", data.itemIds);
        }
        break;
      case "view_recipe":
        // Handle viewing recipe
        if (data.recipeId) {
          console.log("Viewing recipe:", data.recipeId);
        }
        break;
      case "snooze":
        // Reschedule for later
        await this.snoozeNotification(notification, 2 * 60 * 60 * 1000); // 2 hours
        break;
    }
  }

  /**
   * Record user interaction for learning
   */
  private async recordInteraction(action: string, data: any): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(
        this.STORAGE_KEYS.INTERACTION_STATS
      );
      const stats = stored ? JSON.parse(stored) : {};

      const key = `${action}_${new Date().toISOString().split("T")[0]}`;
      stats[key] = (stats[key] || 0) + 1;

      await AsyncStorage.setItem(
        this.STORAGE_KEYS.INTERACTION_STATS,
        JSON.stringify(stats)
      );
    } catch (error) {
      console.error("Error recording interaction:", error);
    }
  }

  /**
   * Snooze notification
   */
  private async snoozeNotification(
    notification: Notifications.Notification,
    delayMs: number
  ): Promise<void> {
    const scheduleTime = new Date(Date.now() + delayMs);

    await Notifications.scheduleNotificationAsync({
      content: notification.request.content,
      trigger: scheduleTime,
    });
  }

  /**
   * Check if current time is in quiet hours
   */
  private isQuietHours(
    currentTime: Date,
    preferences: NotificationPreferences
  ): boolean {
    if (!preferences.quietHours.enabled) return false;

    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = preferences.quietHours.startTime
      .split(":")
      .map(Number);
    const [endHour, endMinute] = preferences.quietHours.endTime
      .split(":")
      .map(Number);

    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    if (startTotalMinutes <= endTotalMinutes) {
      // Same day quiet hours
      return (
        currentTotalMinutes >= startTotalMinutes &&
        currentTotalMinutes <= endTotalMinutes
      );
    } else {
      // Overnight quiet hours
      return (
        currentTotalMinutes >= startTotalMinutes ||
        currentTotalMinutes <= endTotalMinutes
      );
    }
  }

  /**
   * Get meal time from user patterns
   */
  private getMealTimeFromPatterns(
    patterns: UserPattern[],
    patternId: string
  ): { hour: number; minute: number } | null {
    const pattern = patterns.find(
      (p) => p.id === patternId && p.confidence > 0.6
    );
    return pattern ? pattern.value : null;
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(): Promise<{
    totalSent: number;
    interactionRate: number;
    topActions: Array<{ action: string; count: number }>;
    patternConfidence: number;
  }> {
    try {
      const interactions = await AsyncStorage.getItem(
        this.STORAGE_KEYS.INTERACTION_STATS
      );
      const patterns = await this.getUserPatterns();

      const stats = interactions ? JSON.parse(interactions) : {};
      const totalInteractions = Object.values(stats).reduce(
        (sum: number, count: number) => sum + count,
        0
      );

      const topActions = Object.entries(stats)
        .map(([key, count]) => ({
          action: key.split("_")[0],
          count: count as number,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const avgConfidence =
        patterns.length > 0
          ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length
          : 0;

      return {
        totalSent: totalInteractions,
        interactionRate: totalInteractions > 0 ? totalInteractions / 100 : 0, // Placeholder calculation
        topActions,
        patternConfidence: avgConfidence,
      };
    } catch (error) {
      console.error("Error getting notification stats:", error);
      return {
        totalSent: 0,
        interactionRate: 0,
        topActions: [],
        patternConfidence: 0,
      };
    }
  }
}

export const enhancedNotificationService = new EnhancedNotificationService();
