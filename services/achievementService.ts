// Achievement System Service
// Handles badge logic, progress tracking, and gamification elements

import { Achievement, ConsumptionAnalytics, UserAchievements, WasteAnalytics } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// =============================================================================
// ACHIEVEMENT DEFINITIONS
// =============================================================================

const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'progress' | 'unlocked' | 'unlockedAt'>[] = [
  // Waste Reduction Achievements
  {
    id: 'first_week_no_waste',
    title: 'Waste-Free Week',
    description: 'Complete a full week without wasting any food',
    icon: '🏆',
    type: 'waste_reduction',
    threshold: 7
  },
  {
    id: 'waste_warrior',
    title: 'Waste Warrior',
    description: 'Reduce waste by 50% compared to previous month',
    icon: '⚔️',
    type: 'waste_reduction',
    threshold: 50
  },
  {
    id: 'penny_saver',
    title: 'Penny Saver',
    description: 'Save $20 by reducing food waste',
    icon: '💰',
    type: 'waste_reduction',
    threshold: 20
  },
  {
    id: 'eco_champion',
    title: 'Eco Champion',
    description: 'Maintain zero waste for 30 days',
    icon: '🌱',
    type: 'waste_reduction',
    threshold: 30
  },

  // Consumption Achievements
  {
    id: 'healthy_eater',
    title: 'Healthy Eater',
    description: 'Consume 80% fruits and vegetables for a week',
    icon: '🥗',
    type: 'consumption',
    threshold: 80
  },
  {
    id: 'budget_master',
    title: 'Budget Master',
    description: 'Stay under budget for 3 consecutive months',
    icon: '💸',
    type: 'consumption',
    threshold: 3
  },
  {
    id: 'meal_planner',
    title: 'Meal Planning Pro',
    description: 'Achieve 90% meal planning effectiveness',
    icon: '📅',
    type: 'consumption',
    threshold: 90
  },
  {
    id: 'home_chef',
    title: 'Home Chef',
    description: 'Cook at home 80% of the time for a month',
    icon: '👨‍🍳',
    type: 'consumption',
    threshold: 80
  },

  // Streak Achievements
  {
    id: 'streak_starter',
    title: 'Streak Starter',
    description: 'Begin your journey with a 3-day streak',
    icon: '🔥',
    type: 'streak',
    threshold: 3
  },
  {
    id: 'streak_keeper',
    title: 'Streak Keeper',
    description: 'Maintain a 10-day streak',
    icon: '⭐',
    type: 'streak',
    threshold: 10
  },
  {
    id: 'streak_legend',
    title: 'Streak Legend',
    description: 'Achieve an incredible 30-day streak',
    icon: '👑',
    type: 'streak',
    threshold: 30
  },

  // Milestone Achievements
  {
    id: 'first_report',
    title: 'Data Explorer',
    description: 'View your first analytics report',
    icon: '📊',
    type: 'milestone',
    threshold: 1
  },
  {
    id: 'hundred_items',
    title: 'Inventory Master',
    description: 'Track 100 food items',
    icon: '📦',
    type: 'milestone',
    threshold: 100
  },
  {
    id: 'month_user',
    title: 'Dedicated User',
    description: 'Use FridgeWise for 30 consecutive days',
    icon: '🎯',
    type: 'milestone',
    threshold: 30
  }
];

// =============================================================================
// ACHIEVEMENT SERVICE CLASS
// =============================================================================

export class AchievementService {
  private static readonly STORAGE_KEY = 'user_achievements';
  private static readonly STREAK_KEY = 'waste_streak';

  // ===========================================================================
  // ACHIEVEMENT MANAGEMENT
  // ===========================================================================

  static async getUserAchievements(userId: string): Promise<UserAchievements> {
    try {
      const stored = await AsyncStorage.getItem(`${this.STORAGE_KEY}_${userId}`);
      
      if (stored) {
        return JSON.parse(stored);
      }

      // Initialize new user achievements
      const newAchievements: UserAchievements = {
        userId,
        achievements: ACHIEVEMENT_DEFINITIONS.map(def => ({
          ...def,
          progress: 0,
          unlocked: false
        })),
        currentStreak: 0,
        bestStreak: 0,
        totalPoints: 0,
        level: 1
      };

      await this.saveUserAchievements(newAchievements);
      return newAchievements;
    } catch (error) {
      console.error('Error loading user achievements:', error);
      throw error;
    }
  }

  static async saveUserAchievements(achievements: UserAchievements): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${this.STORAGE_KEY}_${achievements.userId}`,
        JSON.stringify(achievements)
      );
    } catch (error) {
      console.error('Error saving user achievements:', error);
      throw error;
    }
  }

  // ===========================================================================
  // PROGRESS TRACKING
  // ===========================================================================

  static async updateAchievementsFromAnalytics(
    userId: string,
    wasteAnalytics: WasteAnalytics,
    consumptionAnalytics: ConsumptionAnalytics
  ): Promise<Achievement[]> {
    try {
      const userAchievements = await this.getUserAchievements(userId);
      const newlyUnlocked: Achievement[] = [];

      // Update waste reduction achievements
      this.updateWasteAchievements(userAchievements, wasteAnalytics, newlyUnlocked);

      // Update consumption achievements
      this.updateConsumptionAchievements(userAchievements, consumptionAnalytics, newlyUnlocked);

      // Update streak achievements
      await this.updateStreakAchievements(userId, userAchievements, newlyUnlocked);

      // Update milestone achievements
      await this.updateMilestoneAchievements(userId, userAchievements, newlyUnlocked);

      // Calculate points and level
      this.calculatePointsAndLevel(userAchievements);

      // Save updated achievements
      await this.saveUserAchievements(userAchievements);

      return newlyUnlocked;
    } catch (error) {
      console.error('Error updating achievements:', error);
      return [];
    }
  }

  // ===========================================================================
  // SPECIFIC ACHIEVEMENT UPDATERS
  // ===========================================================================

  private static updateWasteAchievements(
    userAchievements: UserAchievements,
    analytics: WasteAnalytics,
    newlyUnlocked: Achievement[]
  ): void {
    // Waste Warrior - waste reduction progress
    this.updateAchievement(
      userAchievements,
      'waste_warrior',
      analytics.wasteReductionProgress,
      newlyUnlocked
    );

    // Penny Saver - money saved from waste reduction
    const moneySaved = Math.max(0, 50 - analytics.wasteValue); // Assume $50 baseline
    this.updateAchievement(
      userAchievements,
      'penny_saver',
      moneySaved,
      newlyUnlocked
    );
  }

  private static updateConsumptionAchievements(
    userAchievements: UserAchievements,
    analytics: ConsumptionAnalytics,
    newlyUnlocked: Achievement[]
  ): void {
    // Healthy Eater - fruits and vegetables consumption
    const healthyCategories = analytics.nutritionalInsights
      .filter(item => ['fruits', 'vegetables'].includes(item.category.toLowerCase()))
      .reduce((sum, item) => sum + item.consumptionScore, 0) / 2;
    
    this.updateAchievement(
      userAchievements,
      'healthy_eater',
      healthyCategories,
      newlyUnlocked
    );

    // Budget Master - staying under budget
    const budgetPerformance = analytics.budgetAnalysis.variance <= 0 ? 100 : 0;
    this.updateAchievement(
      userAchievements,
      'budget_master',
      budgetPerformance,
      newlyUnlocked
    );

    // Meal Planning Pro
    this.updateAchievement(
      userAchievements,
      'meal_planner',
      analytics.mealPlanningEffectiveness,
      newlyUnlocked
    );

    // Home Chef
    const homeChefScore = analytics.cookingVsEatingOut.cookingFrequency * 100;
    this.updateAchievement(
      userAchievements,
      'home_chef',
      homeChefScore,
      newlyUnlocked
    );
  }

  private static async updateStreakAchievements(
    userId: string,
    userAchievements: UserAchievements,
    newlyUnlocked: Achievement[]
  ): Promise<void> {
    const currentStreak = await this.getCurrentStreak(userId);
    userAchievements.currentStreak = currentStreak;
    userAchievements.bestStreak = Math.max(userAchievements.bestStreak, currentStreak);

    // Update streak achievements
    ['streak_starter', 'streak_keeper', 'streak_legend'].forEach(achievementId => {
      this.updateAchievement(
        userAchievements,
        achievementId,
        currentStreak,
        newlyUnlocked
      );
    });

    // Special handling for week/month no waste achievements
    if (currentStreak >= 7) {
      this.updateAchievement(
        userAchievements,
        'first_week_no_waste',
        currentStreak,
        newlyUnlocked
      );
    }

    if (currentStreak >= 30) {
      this.updateAchievement(
        userAchievements,
        'eco_champion',
        currentStreak,
        newlyUnlocked
      );
    }
  }

  private static async updateMilestoneAchievements(
    userId: string,
    userAchievements: UserAchievements,
    newlyUnlocked: Achievement[]
  ): Promise<void> {
    // First report achievement
    this.updateAchievement(
      userAchievements,
      'first_report',
      1,
      newlyUnlocked
    );

    // These would typically check actual app usage data
    // For now, we'll use placeholder logic
    
    // Inventory Master - track 100 items (mock)
    const totalItemsTracked = 50; // This would come from actual data
    this.updateAchievement(
      userAchievements,
      'hundred_items',
      totalItemsTracked,
      newlyUnlocked
    );

    // Dedicated User - 30 days usage (mock)
    const daysUsed = 15; // This would come from actual usage tracking
    this.updateAchievement(
      userAchievements,
      'month_user',
      daysUsed,
      newlyUnlocked
    );
  }

  // ===========================================================================
  // HELPER METHODS
  // ===========================================================================

  private static updateAchievement(
    userAchievements: UserAchievements,
    achievementId: string,
    currentValue: number,
    newlyUnlocked: Achievement[]
  ): void {
    const achievement = userAchievements.achievements.find(a => a.id === achievementId);
    
    if (!achievement) return;

    const previousProgress = achievement.progress;
    achievement.progress = Math.min(currentValue, achievement.threshold);

    // Check if newly unlocked
    if (!achievement.unlocked && achievement.progress >= achievement.threshold) {
      achievement.unlocked = true;
      achievement.unlockedAt = new Date().toISOString();
      newlyUnlocked.push({ ...achievement });
    }
  }

  private static calculatePointsAndLevel(userAchievements: UserAchievements): void {
    // Calculate total points based on unlocked achievements
    userAchievements.totalPoints = userAchievements.achievements
      .filter(a => a.unlocked)
      .reduce((sum, achievement) => {
        const points = this.getAchievementPoints(achievement);
        return sum + points;
      }, 0);

    // Calculate level based on total points
    userAchievements.level = Math.floor(userAchievements.totalPoints / 100) + 1;
  }

  private static getAchievementPoints(achievement: Achievement): number {
    const pointsMap: Record<Achievement['type'], number> = {
      'waste_reduction': 50,
      'consumption': 40,
      'streak': 30,
      'milestone': 20
    };

    return pointsMap[achievement.type] || 10;
  }

  // ===========================================================================
  // STREAK MANAGEMENT
  // ===========================================================================

  static async getCurrentStreak(userId: string): Promise<number> {
    try {
      const stored = await AsyncStorage.getItem(`${this.STREAK_KEY}_${userId}`);
      if (!stored) return 0;

      const streakData = JSON.parse(stored);
      const today = new Date().toDateString();
      const lastUpdate = new Date(streakData.lastUpdate).toDateString();

      // Check if streak is still valid (last update was yesterday or today)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();

      if (lastUpdate === today || lastUpdate === yesterdayStr) {
        return streakData.count;
      }

      return 0; // Streak broken
    } catch (error) {
      console.error('Error getting current streak:', error);
      return 0;
    }
  }

  static async updateStreak(userId: string, hadWasteToday: boolean): Promise<number> {
    try {
      const currentStreak = await this.getCurrentStreak(userId);
      const today = new Date().toDateString();

      let newStreak = currentStreak;

      if (!hadWasteToday) {
        // Increment streak if no waste today
        newStreak = currentStreak + 1;
      } else {
        // Reset streak if there was waste
        newStreak = 0;
      }

      const streakData = {
        count: newStreak,
        lastUpdate: new Date().toISOString()
      };

      await AsyncStorage.setItem(
        `${this.STREAK_KEY}_${userId}`,
        JSON.stringify(streakData)
      );

      return newStreak;
    } catch (error) {
      console.error('Error updating streak:', error);
      return 0;
    }
  }

  // ===========================================================================
  // ACHIEVEMENT QUERIES
  // ===========================================================================

  static async getRecentAchievements(userId: string, limit: number = 5): Promise<Achievement[]> {
    const userAchievements = await this.getUserAchievements(userId);
    
    return userAchievements.achievements
      .filter(a => a.unlocked && a.unlockedAt)
      .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
      .slice(0, limit);
  }

  static async getProgressAchievements(userId: string): Promise<Achievement[]> {
    const userAchievements = await this.getUserAchievements(userId);
    
    return userAchievements.achievements
      .filter(a => !a.unlocked && a.progress > 0)
      .sort((a, b) => (b.progress / b.threshold) - (a.progress / a.threshold));
  }

  static async getNextAchievements(userId: string, limit: number = 3): Promise<Achievement[]> {
    const userAchievements = await this.getUserAchievements(userId);
    
    return userAchievements.achievements
      .filter(a => !a.unlocked)
      .sort((a, b) => (b.progress / b.threshold) - (a.progress / a.threshold))
      .slice(0, limit);
  }
}

export default AchievementService;