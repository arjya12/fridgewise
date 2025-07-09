// services/smartNotificationService.ts
import { FoodItemWithUrgency } from "@/services/foodItems";
import {
  generateMealSuggestions,
  getBestMealForTime,
} from "@/utils/mealPlanningUtils";
import { UrgencyLevel } from "@/utils/urgencyUtils";
import * as Notifications from "expo-notifications";

export interface NotificationSettings {
  enabled: boolean;
  criticalItems: boolean;
  warningItems: boolean;
  soonItems: boolean;
  mealSuggestions: boolean;
  morningReminder: boolean;
  eveningPlanning: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string; // "07:00"
  };
  frequency: "realtime" | "daily" | "twice-daily" | "custom";
}

export interface NotificationTemplate {
  id: string;
  type: "expiry" | "meal-suggestion" | "planning" | "achievement";
  urgency: "low" | "normal" | "high" | "critical";
  title: string;
  body: string;
  data?: any;
  categoryId?: string;
  actions?: NotificationAction[];
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

export interface UserNotificationPattern {
  userId: string;
  bestTimeToNotify: string; // "07:30"
  avgResponseTime: number; // minutes
  preferredNotificationTypes: string[];
  dismissalRate: number; // 0-1
  actionTakenRate: number; // 0-1
  lastUpdated: Date;
}

class SmartNotificationService {
  private settings: NotificationSettings;
  private userPattern: UserNotificationPattern | null = null;
  private isInitialized = false;

  constructor() {
    this.settings = this.getDefaultSettings();
  }

  private getDefaultSettings(): NotificationSettings {
    return {
      enabled: true,
      criticalItems: true,
      warningItems: true,
      soonItems: false,
      mealSuggestions: true,
      morningReminder: true,
      eveningPlanning: false,
      quietHours: {
        enabled: true,
        start: "22:00",
        end: "07:00",
      },
      frequency: "daily",
    };
  }

  /**
   * Initialize the notification service
   */
  async initialize(): Promise<boolean> {
    try {
      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();

      if (status !== "granted") {
        console.warn("Notification permission not granted");
        return false;
      }

      // Configure notification categories with actions
      await this.setupNotificationCategories();

      // Set notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error("Failed to initialize notifications:", error);
      return false;
    }
  }

  /**
   * Set up notification categories with action buttons
   */
  private async setupNotificationCategories(): Promise<void> {
    await Notifications.setNotificationCategoryAsync("EXPIRY_WARNING", {
      actions: [
        {
          identifier: "MARK_USED",
          buttonTitle: "Mark as Used",
          options: { foreground: false },
        },
        {
          identifier: "EXTEND_EXPIRY",
          buttonTitle: "Extend Date",
          options: { foreground: true },
        },
        {
          identifier: "VIEW_RECIPES",
          buttonTitle: "See Recipes",
          options: { foreground: true },
        },
      ],
    });

    await Notifications.setNotificationCategoryAsync("MEAL_SUGGESTION", {
      actions: [
        {
          identifier: "VIEW_RECIPE",
          buttonTitle: "View Recipe",
          options: { foreground: true },
        },
        {
          identifier: "DISMISS",
          buttonTitle: "Not Now",
          options: { foreground: false },
        },
      ],
    });

    await Notifications.setNotificationCategoryAsync("PLANNING_REMINDER", {
      actions: [
        {
          identifier: "OPEN_CALENDAR",
          buttonTitle: "Open Calendar",
          options: { foreground: true },
        },
        {
          identifier: "VIEW_EXPIRING",
          buttonTitle: "Expiring Soon",
          options: { foreground: true },
        },
      ],
    });
  }

  /**
   * Schedule smart notifications based on food items and user patterns
   */
  async scheduleSmartNotifications(
    items: FoodItemWithUrgency[]
  ): Promise<void> {
    if (!this.isInitialized || !this.settings.enabled) {
      return;
    }

    // Cancel existing notifications first
    await this.cancelAllNotifications();

    // Group items by urgency
    const criticalItems = items.filter(
      (item) => item.urgency.level === "critical"
    );
    const warningItems = items.filter(
      (item) => item.urgency.level === "warning"
    );
    const soonItems = items.filter((item) => item.urgency.level === "soon");

    // Schedule expiry notifications
    if (this.settings.criticalItems && criticalItems.length > 0) {
      await this.scheduleExpiryNotifications(criticalItems, "critical");
    }

    if (this.settings.warningItems && warningItems.length > 0) {
      await this.scheduleExpiryNotifications(warningItems, "warning");
    }

    if (this.settings.soonItems && soonItems.length > 0) {
      await this.scheduleExpiryNotifications(soonItems, "soon");
    }

    // Schedule meal suggestions
    if (this.settings.mealSuggestions) {
      await this.scheduleMealSuggestions(items);
    }

    // Schedule daily reminders
    if (this.settings.morningReminder) {
      await this.scheduleMorningReminder(items);
    }

    if (this.settings.eveningPlanning) {
      await this.scheduleEveningPlanning(items);
    }
  }

  /**
   * Schedule expiry-based notifications
   */
  private async scheduleExpiryNotifications(
    items: FoodItemWithUrgency[],
    urgencyLevel: UrgencyLevel
  ): Promise<void> {
    const now = new Date();

    for (const item of items) {
      const notification = this.createExpiryNotification(item, urgencyLevel);

      let trigger: Notifications.NotificationTriggerInput;

      if (urgencyLevel === "critical") {
        // Critical items: notify immediately and every 4 hours
        trigger = {
          seconds: 1, // Immediate
        };
        await Notifications.scheduleNotificationAsync({
          content: notification,
          trigger,
        });

        // Schedule follow-up notifications every 4 hours
        for (let i = 1; i <= 3; i++) {
          trigger = {
            seconds: i * 4 * 60 * 60, // 4, 8, 12 hours
          };
          await Notifications.scheduleNotificationAsync({
            content: {
              ...notification,
              title: `⚠️ Still Expiring: ${item.name}`,
              body: `${item.name} ${
                urgencyLevel === "critical"
                  ? "expired or expires today"
                  : "expires soon"
              }. Take action now!`,
            },
            trigger,
          });
        }
      } else if (urgencyLevel === "warning") {
        // Warning items: notify at optimal time
        const optimalTime = this.getOptimalNotificationTime();
        trigger = {
          hour: optimalTime.hour,
          minute: optimalTime.minute,
          repeats: false,
        };
        await Notifications.scheduleNotificationAsync({
          content: notification,
          trigger,
        });
      } else {
        // Soon items: notify once at user's preferred time
        const preferredTime = this.getUserPreferredTime();
        trigger = {
          hour: preferredTime.hour,
          minute: preferredTime.minute,
          repeats: false,
        };
        await Notifications.scheduleNotificationAsync({
          content: notification,
          trigger,
        });
      }
    }
  }

  /**
   * Create expiry notification content
   */
  private createExpiryNotification(
    item: FoodItemWithUrgency,
    urgencyLevel: UrgencyLevel
  ): Notifications.NotificationContent {
    const urgencyEmoji = {
      critical: "🚨",
      warning: "⚠️",
      soon: "📅",
      safe: "ℹ️",
    };

    const urgencyText = {
      critical: "expires today or has expired",
      warning: "expires in 1-2 days",
      soon: "expires this week",
      safe: "expires later",
    };

    return {
      title: `${urgencyEmoji[urgencyLevel]} ${item.name} ${urgencyText[urgencyLevel]}`,
      body: `${item.quantity} ${item.unit} in ${item.location}. ${item.urgency.description}`,
      categoryIdentifier: "EXPIRY_WARNING",
      data: {
        itemId: item.id,
        urgencyLevel,
        type: "expiry",
      },
      badge: this.getBadgeCount(urgencyLevel),
    };
  }

  /**
   * Schedule meal suggestion notifications
   */
  private async scheduleMealSuggestions(
    items: FoodItemWithUrgency[]
  ): Promise<void> {
    const suggestions = generateMealSuggestions(items, 3);

    if (suggestions.length === 0) return;

    // Schedule suggestions for meal times
    const mealTimes = [
      { hour: 7, minute: 30, timeOfDay: "morning" as const },
      { hour: 11, minute: 30, timeOfDay: "midday" as const },
      { hour: 17, minute: 0, timeOfDay: "evening" as const },
    ];

    for (const { hour, minute, timeOfDay } of mealTimes) {
      const bestMeal = getBestMealForTime(items, timeOfDay);

      if (bestMeal) {
        const notification: Notifications.NotificationContent = {
          title: `🍽️ Recipe Suggestion: ${bestMeal.title}`,
          body: `Perfect for ${timeOfDay}! Uses: ${bestMeal.items
            .slice(0, 3)
            .map((item) => item.name)
            .join(", ")}`,
          categoryIdentifier: "MEAL_SUGGESTION",
          data: {
            suggestion: bestMeal,
            type: "meal-suggestion",
            timeOfDay,
          },
        };

        await Notifications.scheduleNotificationAsync({
          content: notification,
          trigger: {
            hour,
            minute,
            repeats: true,
          },
        });
      }
    }
  }

  /**
   * Schedule morning reminder notification
   */
  private async scheduleMorningReminder(
    items: FoodItemWithUrgency[]
  ): Promise<void> {
    const criticalCount = items.filter(
      (item) => item.urgency.level === "critical"
    ).length;
    const warningCount = items.filter(
      (item) => item.urgency.level === "warning"
    ).length;

    if (criticalCount === 0 && warningCount === 0) return;

    const notification: Notifications.NotificationContent = {
      title: "🌅 Good Morning! Food Check",
      body: `You have ${criticalCount} critical and ${warningCount} warning items to review today.`,
      categoryIdentifier: "PLANNING_REMINDER",
      data: {
        type: "morning-reminder",
        criticalCount,
        warningCount,
      },
    };

    await Notifications.scheduleNotificationAsync({
      content: notification,
      trigger: {
        hour: 8,
        minute: 0,
        repeats: true,
      },
    });
  }

  /**
   * Schedule evening planning notification
   */
  private async scheduleEveningPlanning(
    items: FoodItemWithUrgency[]
  ): Promise<void> {
    const expiringTomorrow = items.filter(
      (item) => item.urgency.daysUntilExpiry === 1
    );

    if (expiringTomorrow.length === 0) return;

    const notification: Notifications.NotificationContent = {
      title: "🌙 Plan Tomorrow's Meals",
      body: `${expiringTomorrow.length} items expire tomorrow. Plan your meals now!`,
      categoryIdentifier: "PLANNING_REMINDER",
      data: {
        type: "evening-planning",
        expiringTomorrow,
      },
    };

    await Notifications.scheduleNotificationAsync({
      content: notification,
      trigger: {
        hour: 19,
        minute: 0,
        repeats: true,
      },
    });
  }

  /**
   * Handle notification action responses
   */
  async handleNotificationAction(
    actionId: string,
    notificationData: any
  ): Promise<void> {
    switch (actionId) {
      case "MARK_USED":
        // Handle marking item as used
        // This would integrate with foodItemsService
        break;

      case "EXTEND_EXPIRY":
        // Handle extending expiry date
        break;

      case "VIEW_RECIPES":
        // Navigate to recipes for the item
        break;

      case "VIEW_RECIPE":
        // Show specific recipe details
        break;

      case "OPEN_CALENDAR":
        // Navigate to calendar view
        break;

      case "VIEW_EXPIRING":
        // Show expiring items list
        break;

      default:
        console.log("Unknown notification action:", actionId);
    }

    // Update user patterns based on action taken
    await this.updateUserPattern(actionId, notificationData);
  }

  /**
   * Update notification settings
   */
  async updateSettings(
    newSettings: Partial<NotificationSettings>
  ): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    // Save to persistent storage
    // await AsyncStorage.setItem('notificationSettings', JSON.stringify(this.settings));
  }

  /**
   * Get current notification settings
   */
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get badge count based on urgency level
   */
  private getBadgeCount(urgencyLevel: UrgencyLevel): number {
    switch (urgencyLevel) {
      case "critical":
        return 3;
      case "warning":
        return 2;
      case "soon":
        return 1;
      default:
        return 0;
    }
  }

  /**
   * Get optimal notification time based on user patterns
   */
  private getOptimalNotificationTime(): { hour: number; minute: number } {
    if (this.userPattern?.bestTimeToNotify) {
      const [hour, minute] = this.userPattern.bestTimeToNotify
        .split(":")
        .map(Number);
      return { hour, minute };
    }

    // Default to 9 AM if no pattern data
    return { hour: 9, minute: 0 };
  }

  /**
   * Get user's preferred notification time
   */
  private getUserPreferredTime(): { hour: number; minute: number } {
    // Could be based on user settings or learned patterns
    return { hour: 10, minute: 0 };
  }

  /**
   * Update user notification patterns based on interactions
   */
  private async updateUserPattern(
    actionId: string,
    notificationData: any
  ): Promise<void> {
    // This would track user behavior to improve notification timing
    // and relevance over time

    if (!this.userPattern) {
      this.userPattern = {
        userId: "current-user", // Would get from auth
        bestTimeToNotify: "09:00",
        avgResponseTime: 15,
        preferredNotificationTypes: [],
        dismissalRate: 0,
        actionTakenRate: 0,
        lastUpdated: new Date(),
      };
    }

    // Update patterns based on action
    const now = new Date();
    this.userPattern.lastUpdated = now;

    if (actionId !== "DISMISS") {
      this.userPattern.actionTakenRate = Math.min(
        this.userPattern.actionTakenRate + 0.1,
        1.0
      );
    }

    // Save updated pattern
    // await AsyncStorage.setItem('userNotificationPattern', JSON.stringify(this.userPattern));
  }

  /**
   * Check if current time is within quiet hours
   */
  private isQuietHours(): boolean {
    if (!this.settings.quietHours.enabled) return false;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = this.settings.quietHours.start
      .split(":")
      .map(Number);
    const [endHour, endMinute] = this.settings.quietHours.end
      .split(":")
      .map(Number);

    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (startTime <= endTime) {
      // Same day quiet hours (e.g., 14:00 - 18:00)
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Overnight quiet hours (e.g., 22:00 - 07:00)
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  /**
   * Send immediate notification for critical items
   */
  async sendCriticalAlert(item: FoodItemWithUrgency): Promise<void> {
    if (!this.isInitialized || this.isQuietHours()) return;

    const notification = this.createExpiryNotification(item, "critical");

    await Notifications.scheduleNotificationAsync({
      content: {
        ...notification,
        title: `🚨 URGENT: ${item.name}`,
        body: `${item.name} has expired or expires today! Take immediate action.`,
      },
      trigger: null, // Send immediately
    });
  }

  /**
   * Get notification statistics
   */
  getNotificationStats(): {
    totalScheduled: number;
    userPattern: UserNotificationPattern | null;
    settings: NotificationSettings;
  } {
    return {
      totalScheduled: 0, // Would get from Notifications.getAllScheduledNotificationsAsync()
      userPattern: this.userPattern,
      settings: this.settings,
    };
  }
}

// Export singleton instance
export const smartNotificationService = new SmartNotificationService();
