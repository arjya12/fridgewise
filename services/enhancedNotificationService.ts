// Enhanced Notification Service
// Provides smart notifications based on analytics data and user behavior patterns

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WasteAnalytics, ConsumptionAnalytics } from '@/lib/supabase';
import AchievementService from './achievementService';
import AnalyticsService from './analyticsService';

// =============================================================================
// NOTIFICATION TYPES AND INTERFACES
// =============================================================================

interface SmartNotification {
  id: string;
  title: string;
  body: string;
  data?: any;
  trigger: NotificationTriggerInput;
  priority: 'high' | 'normal' | 'low';
  category: 'achievement' | 'insight' | 'reminder' | 'alert';
}

interface NotificationTriggerInput {
  seconds?: number;
  repeats?: boolean;
  weekday?: number;
  hour?: number;
  minute?: number;
}

interface NotificationPreferences {
  achievementsEnabled: boolean;
  insightsEnabled: boolean;
  reminderTime: string; // HH:MM format
  frequency: 'daily' | 'weekly' | 'monthly';
  budgetAlerts: boolean;
  wasteAlerts: boolean;
  lastNotificationDate?: string;
}

// =============================================================================
// ENHANCED NOTIFICATION SERVICE
// =============================================================================

export class EnhancedNotificationService {
  private static readonly PREFERENCES_KEY = 'notification_preferences';
  private static readonly LAST_ANALYTICS_KEY = 'last_analytics_notification';

  // ===========================================================================
  // INITIALIZATION AND PERMISSIONS
  // ===========================================================================

  static async initialize(): Promise<boolean> {
    try {
      // Configure notification behavior
      await Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      // Request permissions
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        return newStatus === 'granted';
      }

      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  // ===========================================================================
  // PREFERENCES MANAGEMENT
  // ===========================================================================

  static async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const stored = await AsyncStorage.getItem(`${this.PREFERENCES_KEY}_${userId}`);
      
      if (stored) {
        return JSON.parse(stored);
      }

      // Default preferences
      const defaultPreferences: NotificationPreferences = {
        achievementsEnabled: true,
        insightsEnabled: true,
        reminderTime: '09:00',
        frequency: 'weekly',
        budgetAlerts: true,
        wasteAlerts: true
      };

      await this.saveNotificationPreferences(userId, defaultPreferences);
      return defaultPreferences;
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return {
        achievementsEnabled: false,
        insightsEnabled: false,
        reminderTime: '09:00',
        frequency: 'weekly',
        budgetAlerts: false,
        wasteAlerts: false
      };
    }
  }

  static async saveNotificationPreferences(
    userId: string, 
    preferences: NotificationPreferences
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${this.PREFERENCES_KEY}_${userId}`,
        JSON.stringify(preferences)
      );
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    }
  }

  // ===========================================================================
  // SMART NOTIFICATION GENERATION
  // ===========================================================================

  static async scheduleAnalyticsNotifications(
    userId: string,
    wasteAnalytics?: WasteAnalytics,
    consumptionAnalytics?: ConsumptionAnalytics
  ): Promise<void> {
    try {
      const preferences = await this.getNotificationPreferences(userId);
      
      if (!preferences.insightsEnabled) return;

      // Check if we should send analytics notifications (based on frequency)
      const shouldSend = await this.shouldSendAnalyticsNotification(userId, preferences);
      if (!shouldSend) return;

      const notifications: SmartNotification[] = [];

      // Generate waste-based notifications
      if (wasteAnalytics && preferences.wasteAlerts) {
        notifications.push(...this.generateWasteNotifications(wasteAnalytics));
      }

      // Generate consumption-based notifications
      if (consumptionAnalytics && preferences.budgetAlerts) {
        notifications.push(...this.generateConsumptionNotifications(consumptionAnalytics));
      }

      // Schedule the notifications
      for (const notification of notifications) {
        await this.scheduleNotification(notification);
      }

      // Update last notification date
      await this.updateLastAnalyticsNotification(userId);

    } catch (error) {
      console.error('Error scheduling analytics notifications:', error);
    }
  }

  static async scheduleAchievementNotifications(
    userId: string,
    newAchievements: any[]
  ): Promise<void> {
    try {
      const preferences = await this.getNotificationPreferences(userId);
      
      if (!preferences.achievementsEnabled || newAchievements.length === 0) return;

      for (const achievement of newAchievements) {
        const notification: SmartNotification = {
          id: `achievement_${achievement.id}_${Date.now()}`,
          title: '🏆 Achievement Unlocked!',
          body: `Congratulations! You've earned "${achievement.title}"`,
          data: { 
            type: 'achievement',
            achievementId: achievement.id,
            screen: 'achievements'
          },
          trigger: { seconds: 1 },
          priority: 'high',
          category: 'achievement'
        };

        await this.scheduleNotification(notification);
      }
    } catch (error) {
      console.error('Error scheduling achievement notifications:', error);
    }
  }

  // ===========================================================================
  // NOTIFICATION GENERATORS
  // ===========================================================================

  private static generateWasteNotifications(analytics: WasteAnalytics): SmartNotification[] {
    const notifications: SmartNotification[] = [];

    // High waste alert
    if (analytics.wasteValue > 30) {
      notifications.push({
        id: `waste_alert_${Date.now()}`,
        title: '💸 High Food Waste Alert',
        body: `You've wasted $${analytics.wasteValue.toFixed(0)} worth of food recently. Check your waste report for tips to improve!`,
        data: { 
          type: 'waste_alert',
          screen: 'waste-report'
        },
        trigger: { seconds: 10 },
        priority: 'high',
        category: 'alert'
      });
    }

    // Waste reduction celebration
    if (analytics.wasteReductionProgress > 20) {
      notifications.push({
        id: `waste_improvement_${Date.now()}`,
        title: '🌱 Great Progress!',
        body: `You've reduced food waste by ${analytics.wasteReductionProgress.toFixed(0)}%! Keep up the excellent work.`,
        data: { 
          type: 'celebration',
          screen: 'waste-report'
        },
        trigger: { seconds: 5 },
        priority: 'normal',
        category: 'insight'
      });
    }

    // Category-specific waste tip
    const topWasteCategory = Object.entries(analytics.wasteByCategory)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topWasteCategory && topWasteCategory[1] > 3) {
      notifications.push({
        id: `category_tip_${Date.now()}`,
        title: `🥬 ${topWasteCategory[0]} Waste Tip`,
        body: `You're wasting a lot of ${topWasteCategory[0].toLowerCase()}. Try meal planning or buying smaller quantities.`,
        data: { 
          type: 'tip',
          category: topWasteCategory[0],
          screen: 'waste-report'
        },
        trigger: { seconds: 30 },
        priority: 'normal',
        category: 'insight'
      });
    }

    return notifications;
  }

  private static generateConsumptionNotifications(analytics: ConsumptionAnalytics): SmartNotification[] {
    const notifications: SmartNotification[] = [];

    // Budget alert
    if (analytics.budgetAnalysis.variance > 20) {
      notifications.push({
        id: `budget_alert_${Date.now()}`,
        title: '💳 Budget Alert',
        body: `You're $${analytics.budgetAnalysis.variance.toFixed(0)} over budget this period. Review your consumption report for savings tips.`,
        data: { 
          type: 'budget_alert',
          screen: 'consumption-report'
        },
        trigger: { seconds: 15 },
        priority: 'high',
        category: 'alert'
      });
    }

    // Budget success
    if (analytics.budgetAnalysis.variance < -10) {
      notifications.push({
        id: `budget_success_${Date.now()}`,
        title: '💰 Budget Champion!',
        body: `You're $${Math.abs(analytics.budgetAnalysis.variance).toFixed(0)} under budget! Excellent financial management.`,
        data: { 
          type: 'celebration',
          screen: 'consumption-report'
        },
        trigger: { seconds: 20 },
        priority: 'normal',
        category: 'insight'
      });
    }

    // Healthy eating encouragement
    const healthyCategories = analytics.nutritionalInsights
      .filter(item => ['fruits', 'vegetables'].includes(item.category.toLowerCase()));
    
    if (healthyCategories.length > 0) {
      const avgHealthyScore = healthyCategories.reduce((sum, item) => sum + item.consumptionScore, 0) / healthyCategories.length;
      
      if (avgHealthyScore > 80) {
        notifications.push({
          id: `healthy_eating_${Date.now()}`,
          title: '🥗 Healthy Eating Star!',
          body: 'You\'re doing amazing with fruits and vegetables! Keep prioritizing nutritious foods.',
          data: { 
            type: 'celebration',
            screen: 'consumption-report'
          },
          trigger: { seconds: 25 },
          priority: 'low',
          category: 'insight'
        });
      }
    }

    // Meal planning tip
    if (analytics.mealPlanningEffectiveness < 60) {
      notifications.push({
        id: `meal_planning_tip_${Date.now()}`,
        title: '📅 Meal Planning Tip',
        body: 'Your meal planning could be more effective. Try planning meals around items that expire soon!',
        data: { 
          type: 'tip',
          screen: 'consumption-report'
        },
        trigger: { seconds: 35 },
        priority: 'normal',
        category: 'insight'
      });
    }

    return notifications;
  }

  // ===========================================================================
  // WEEKLY SUMMARY NOTIFICATIONS
  // ===========================================================================

  static async scheduleWeeklySummary(userId: string): Promise<void> {
    try {
      const preferences = await this.getNotificationPreferences(userId);
      
      if (!preferences.insightsEnabled || preferences.frequency !== 'weekly') return;

      // Parse reminder time
      const [hour, minute] = preferences.reminderTime.split(':').map(Number);

      // Schedule for next Sunday at the specified time
      const now = new Date();
      const nextSunday = new Date();
      const daysUntilSunday = (7 - now.getDay()) % 7;
      nextSunday.setDate(now.getDate() + daysUntilSunday);
      nextSunday.setHours(hour, minute, 0, 0);

      const notification: SmartNotification = {
        id: `weekly_summary_${userId}`,
        title: '📊 Your Weekly Food Report',
        body: 'Check out your latest analytics and see how you\'re doing with food management this week!',
        data: { 
          type: 'weekly_summary',
          screen: 'waste-report'
        },
        trigger: {
          weekday: 1, // Sunday
          hour,
          minute,
          repeats: true
        },
        priority: 'normal',
        category: 'reminder'
      };

      await this.scheduleNotification(notification);
    } catch (error) {
      console.error('Error scheduling weekly summary:', error);
    }
  }

  // ===========================================================================
  // HELPER METHODS
  // ===========================================================================

  private static async scheduleNotification(notification: SmartNotification): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: notification.priority === 'high' ? 'default' : undefined,
        },
        trigger: notification.trigger,
        identifier: notification.id,
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  private static async shouldSendAnalyticsNotification(
    userId: string, 
    preferences: NotificationPreferences
  ): Promise<boolean> {
    try {
      const lastNotificationDate = await AsyncStorage.getItem(`${this.LAST_ANALYTICS_KEY}_${userId}`);
      
      if (!lastNotificationDate) return true;

      const lastDate = new Date(lastNotificationDate);
      const now = new Date();
      const daysSinceLastNotification = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);

      switch (preferences.frequency) {
        case 'daily':
          return daysSinceLastNotification >= 1;
        case 'weekly':
          return daysSinceLastNotification >= 7;
        case 'monthly':
          return daysSinceLastNotification >= 30;
        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking notification frequency:', error);
      return false;
    }
  }

  private static async updateLastAnalyticsNotification(userId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${this.LAST_ANALYTICS_KEY}_${userId}`,
        new Date().toISOString()
      );
    } catch (error) {
      console.error('Error updating last notification date:', error);
    }
  }

  // ===========================================================================
  // NOTIFICATION MANAGEMENT
  // ===========================================================================

  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }

  static async cancelNotificationsByCategory(category: string): Promise<void> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      for (const notification of scheduledNotifications) {
        if (notification.content.data?.category === category) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
    } catch (error) {
      console.error('Error canceling notifications by category:', error);
    }
  }

  // ===========================================================================
  // INTEGRATION METHODS
  // ===========================================================================

  static async handleAnalyticsUpdate(
    userId: string,
    wasteAnalytics?: WasteAnalytics,
    consumptionAnalytics?: ConsumptionAnalytics
  ): Promise<void> {
    // Schedule smart notifications based on analytics
    await this.scheduleAnalyticsNotifications(userId, wasteAnalytics, consumptionAnalytics);

    // Check for new achievements and notify
    if (wasteAnalytics && consumptionAnalytics) {
      const newAchievements = await AchievementService.updateAchievementsFromAnalytics(
        userId,
        wasteAnalytics,
        consumptionAnalytics
      );
      
      if (newAchievements.length > 0) {
        await this.scheduleAchievementNotifications(userId, newAchievements);
      }
    }
  }
}

export default EnhancedNotificationService;