// Enhanced Analytics Service
// Provides comprehensive data analysis for waste and consumption reports

import {
  BudgetAnalysis,
  ConsumptionAnalytics,
  ConsumptionPattern,
  ItemConsumptionData,
  ItemWasteData,
  NutritionalData,
  ShoppingPattern,
  supabase,
  WasteAnalytics,
  WasteTrendData,
} from "@/lib/supabase";

// =============================================================================
// COST ESTIMATION MAPPING
// =============================================================================

const COST_ESTIMATES: Record<string, number> = {
  // Fruits (per unit)
  apple: 0.75,
  banana: 0.25,
  orange: 0.85,
  strawberry: 0.15,
  grapes: 0.3,
  pineapple: 3.5,

  // Vegetables (per unit/serving)
  carrot: 0.2,
  broccoli: 1.5,
  spinach: 2.0,
  lettuce: 1.25,
  tomato: 0.5,
  potato: 0.3,

  // Dairy (per unit)
  milk: 3.5,
  cheese: 4.0,
  yogurt: 1.25,
  butter: 4.5,

  // Proteins (per unit)
  chicken: 6.0,
  beef: 8.5,
  fish: 7.0,
  eggs: 2.5,

  // Pantry items
  bread: 2.5,
  rice: 1.5,
  pasta: 1.25,
  cereal: 4.0,

  // Default fallback
  default: 2.0,
};

// =============================================================================
// NUTRITIONAL SCORING
// =============================================================================

const NUTRITIONAL_SCORES: Record<string, number> = {
  fruits: 85,
  vegetables: 90,
  dairy: 70,
  protein: 80,
  grains: 65,
  snacks: 30,
  beverages: 40,
  default: 50,
};

// =============================================================================
// ANALYTICS SERVICE CLASS
// =============================================================================

export class AnalyticsService {
  // ===========================================================================
  // WASTE ANALYTICS
  // ===========================================================================

  static async getWasteAnalytics(
    startDate: Date,
    endDate: Date
  ): Promise<WasteAnalytics> {
    try {
      // Get all usage logs for the period
      const { data: usageLogs, error } = await supabase
        .from("usage_logs")
        .select(
          `
          *,
          food_items (
            name,
            category,
            quantity,
            unit
          )
        `
        )
        .in("status", ["expired", "wasted"])
        .gte("logged_at", startDate.toISOString())
        .lte("logged_at", endDate.toISOString())
        .order("logged_at", { ascending: false });

      if (error) throw error;

      const wastedLogs = usageLogs || [];

      // Calculate total waste value
      const totalWasted = wastedLogs.length;
      const wasteValue = this.calculateWasteValue(wastedLogs);

      // Group by category
      const wasteByCategory = this.groupWasteByCategory(wastedLogs);

      // Generate trend data
      const wasteTrends = this.generateWasteTrends(
        wastedLogs,
        startDate,
        endDate
      );

      // Find most wasted items
      const mostWastedItems = this.getMostWastedItems(wastedLogs);

      // Calculate waste reduction progress
      const wasteReductionProgress = await this.calculateWasteReductionProgress(
        startDate,
        endDate
      );

      return {
        totalWasted,
        wasteValue,
        wasteByCategory,
        wasteTrends,
        mostWastedItems,
        wasteReductionProgress,
      };
    } catch (error) {
      console.error("Error generating waste analytics:", error);
      throw error;
    }
  }

  // ===========================================================================
  // CONSUMPTION ANALYTICS
  // ===========================================================================

  static async getConsumptionAnalytics(
    startDate: Date,
    endDate: Date
  ): Promise<ConsumptionAnalytics> {
    try {
      // Get all 'used' logs for the period
      const { data: usageLogs, error } = await supabase
        .from("usage_logs")
        .select(
          `
          *,
          food_items (
            name,
            category,
            quantity,
            unit
          )
        `
        )
        .eq("status", "used")
        .gte("logged_at", startDate.toISOString())
        .lte("logged_at", endDate.toISOString())
        .order("logged_at", { ascending: false });

      if (error) throw error;

      const consumptionLogs = usageLogs || [];

      // Most consumed items
      const mostConsumedItems = this.getMostConsumedItems(consumptionLogs);

      // Shopping patterns
      const shoppingPatterns = this.analyzeShoppingPatterns(consumptionLogs);

      // Budget analysis
      const budgetAnalysis = this.calculateBudgetAnalysis(consumptionLogs);

      // Nutritional insights
      const nutritionalInsights =
        this.generateNutritionalInsights(consumptionLogs);

      // Cooking vs eating out
      const cookingVsEatingOut = this.analyzeCookingPatterns(consumptionLogs);

      // Meal planning effectiveness
      const mealPlanningEffectiveness =
        this.calculateMealPlanningEffectiveness(consumptionLogs);

      return {
        mostConsumedItems,
        shoppingPatterns,
        budgetAnalysis,
        nutritionalInsights,
        cookingVsEatingOut,
        mealPlanningEffectiveness,
      };
    } catch (error) {
      console.error("Error generating consumption analytics:", error);
      throw error;
    }
  }

  // ===========================================================================
  // PRIVATE HELPER METHODS
  // ===========================================================================

  private static calculateWasteValue(logs: any[]): number {
    return logs.reduce((total, log) => {
      const itemName = log.food_items?.name?.toLowerCase() || "default";
      const estimatedCost = this.getItemCost(itemName);
      return total + estimatedCost * log.quantity;
    }, 0);
  }

  private static getItemCost(itemName: string): number {
    const normalizedName = itemName.toLowerCase();
    return COST_ESTIMATES[normalizedName] || COST_ESTIMATES.default;
  }

  private static groupWasteByCategory(logs: any[]): Record<string, number> {
    const categoryWaste: Record<string, number> = {};

    logs.forEach((log) => {
      const category = log.food_items?.category || "other";
      categoryWaste[category] = (categoryWaste[category] || 0) + log.quantity;
    });

    return categoryWaste;
  }

  private static generateWasteTrends(
    logs: any[],
    startDate: Date,
    endDate: Date
  ): WasteTrendData[] {
    const trends: WasteTrendData[] = [];
    const dayInMs = 24 * 60 * 60 * 1000;

    for (
      let date = new Date(startDate);
      date <= endDate;
      date.setTime(date.getTime() + dayInMs)
    ) {
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayLogs = logs.filter((log) => {
        const logDate = new Date(log.logged_at);
        return logDate >= dayStart && logDate <= dayEnd;
      });

      trends.push({
        date: dayStart.toISOString().split("T")[0],
        wasteCount: dayLogs.length,
        wasteValue: this.calculateWasteValue(dayLogs),
      });
    }

    return trends;
  }

  private static getMostWastedItems(logs: any[]): ItemWasteData[] {
    const itemWaste: Record<string, ItemWasteData> = {};

    logs.forEach((log) => {
      const name = log.food_items?.name || "Unknown";
      const category = log.food_items?.category || "other";
      const cost = this.getItemCost(name);

      if (!itemWaste[name]) {
        itemWaste[name] = {
          name,
          count: 0,
          value: 0,
          category,
        };
      }

      itemWaste[name].count += log.quantity;
      itemWaste[name].value += cost * log.quantity;
    });

    return Object.values(itemWaste)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private static async calculateWasteReductionProgress(
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    try {
      // Compare with previous period
      const periodLength = endDate.getTime() - startDate.getTime();
      const previousStart = new Date(startDate.getTime() - periodLength);
      const previousEnd = new Date(startDate);

      const currentWaste = await this.getWasteForPeriod(startDate, endDate);
      const previousWaste = await this.getWasteForPeriod(
        previousStart,
        previousEnd
      );

      if (previousWaste === 0) return 0;

      const reduction = ((previousWaste - currentWaste) / previousWaste) * 100;
      return Math.max(-100, Math.min(100, reduction)); // Cap between -100% and 100%
    } catch (error) {
      console.error("Error calculating waste reduction:", error);
      return 0;
    }
  }

  private static async getWasteForPeriod(
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const { data, error } = await supabase
      .from("usage_logs")
      .select("quantity")
      .in("status", ["expired", "wasted"])
      .gte("logged_at", startDate.toISOString())
      .lte("logged_at", endDate.toISOString());

    if (error) return 0;

    return data?.reduce((sum, log) => sum + log.quantity, 0) || 0;
  }

  private static getMostConsumedItems(logs: any[]): ItemConsumptionData[] {
    const itemConsumption: Record<string, ItemConsumptionData> = {};

    logs.forEach((log) => {
      const name = log.food_items?.name || "Unknown";
      const category = log.food_items?.category || "other";

      if (!itemConsumption[name]) {
        itemConsumption[name] = {
          name,
          count: 0,
          frequency: 0,
          category,
        };
      }

      itemConsumption[name].count += log.quantity;
      itemConsumption[name].frequency += 1;
    });

    return Object.values(itemConsumption)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private static analyzeShoppingPatterns(logs: any[]): ShoppingPattern[] {
    const patterns: Record<string, ShoppingPattern> = {};

    logs.forEach((log) => {
      const category = log.food_items?.category || "other";

      if (!patterns[category]) {
        patterns[category] = {
          category,
          frequency: 0,
          averageQuantity: 0,
          seasonalTrend: 0,
        };
      }

      patterns[category].frequency += 1;
      patterns[category].averageQuantity += log.quantity;
    });

    // Calculate averages and trends
    Object.values(patterns).forEach((pattern) => {
      pattern.averageQuantity = pattern.averageQuantity / pattern.frequency;
      pattern.seasonalTrend = Math.random() * 0.4 - 0.2; // Mock seasonal trend
    });

    return Object.values(patterns);
  }

  private static calculateBudgetAnalysis(logs: any[]): BudgetAnalysis {
    const categorySpending: Record<string, number> = {};
    let totalSpending = 0;

    logs.forEach((log) => {
      const category = log.food_items?.category || "other";
      const cost = this.getItemCost(log.food_items?.name || "");
      const spent = cost * log.quantity;

      categorySpending[category] = (categorySpending[category] || 0) + spent;
      totalSpending += spent;
    });

    // Mock planned budget (in real app, this would come from user settings)
    const plannedBudget = 300;

    return {
      plannedBudget,
      actualSpending: totalSpending,
      variance: totalSpending - plannedBudget,
      categoryBreakdown: categorySpending,
    };
  }

  private static generateNutritionalInsights(logs: any[]): NutritionalData[] {
    const categoryConsumption: Record<string, number> = {};

    logs.forEach((log) => {
      const category = log.food_items?.category || "other";
      categoryConsumption[category] =
        (categoryConsumption[category] || 0) + log.quantity;
    });

    return Object.entries(categoryConsumption).map(
      ([category, consumption]) => ({
        category,
        consumptionScore:
          NUTRITIONAL_SCORES[category] || NUTRITIONAL_SCORES.default,
        recommendations: this.getNutritionalRecommendations(
          category,
          consumption
        ),
      })
    );
  }

  private static getNutritionalRecommendations(
    category: string,
    consumption: number
  ): string[] {
    const recommendations: Record<string, string[]> = {
      fruits: [
        "Great job on fruit consumption!",
        "Try to vary fruit types for different nutrients",
      ],
      vegetables: [
        "Excellent vegetable intake!",
        "Include more dark leafy greens",
      ],
      dairy: [
        "Consider low-fat dairy options",
        "Balance dairy with plant-based alternatives",
      ],
      protein: [
        "Good protein consumption",
        "Mix animal and plant-based proteins",
      ],
      default: [
        "Try to increase whole food consumption",
        "Balance processed and fresh foods",
      ],
    };

    return recommendations[category] || recommendations.default;
  }

  private static analyzeCookingPatterns(logs: any[]): ConsumptionPattern {
    // Mock analysis - in real app, would analyze consumption patterns
    const homeCooked = logs.filter((log) =>
      ["vegetables", "protein", "grains"].includes(
        log.food_items?.category || ""
      )
    ).length;

    const convenience = logs.filter((log) =>
      ["snacks", "beverages"].includes(log.food_items?.category || "")
    ).length;

    const total = logs.length;

    return {
      cookingFrequency: total > 0 ? homeCooked / total : 0,
      eatingOutFrequency: total > 0 ? convenience / total : 0,
      homeVsOutRatio: convenience > 0 ? homeCooked / convenience : homeCooked,
    };
  }

  private static calculateMealPlanningEffectiveness(logs: any[]): number {
    // Mock calculation - in real app, would compare planned vs actual consumption
    const totalPlanned = logs.length * 1.2; // Assume 20% over-planning
    const actualUsed = logs.length;

    return totalPlanned > 0 ? (actualUsed / totalPlanned) * 100 : 0;
  }

  // ===========================================================================
  // SMART INSIGHTS GENERATION
  // ===========================================================================

  static generateWasteInsights(analytics: WasteAnalytics): string[] {
    const insights: string[] = [];

    // Waste value insights
    if (analytics.wasteValue > 50) {
      insights.push(
        `You wasted $${analytics.wasteValue.toFixed(
          2
        )} worth of food this period. Small improvements could save significant money!`
      );
    }

    // Category insights
    const topWasteCategory = Object.entries(analytics.wasteByCategory).sort(
      ([, a], [, b]) => b - a
    )[0];

    if (topWasteCategory) {
      insights.push(
        `${topWasteCategory[0]} is your most wasted category. Consider buying smaller quantities or meal planning.`
      );
    }

    // Trend insights
    if (analytics.wasteReductionProgress > 10) {
      insights.push(
        `Great job! You've reduced waste by ${analytics.wasteReductionProgress.toFixed(
          1
        )}% compared to last period.`
      );
    } else if (analytics.wasteReductionProgress < -10) {
      insights.push(
        `Waste increased by ${Math.abs(
          analytics.wasteReductionProgress
        ).toFixed(1)}%. Let's focus on using items before they expire.`
      );
    }

    return insights;
  }

  static generateConsumptionInsights(
    analytics: ConsumptionAnalytics
  ): string[] {
    const insights: string[] = [];

    // Budget insights
    if (analytics.budgetAnalysis.variance > 0) {
      insights.push(
        `You're $${analytics.budgetAnalysis.variance.toFixed(
          2
        )} over budget. Consider meal planning to reduce costs.`
      );
    } else {
      insights.push(
        `Great budgeting! You're $${Math.abs(
          analytics.budgetAnalysis.variance
        ).toFixed(2)} under budget.`
      );
    }

    // Cooking patterns
    if (analytics.cookingVsEatingOut.cookingFrequency > 0.7) {
      insights.push(
        `You're cooking at home ${(
          analytics.cookingVsEatingOut.cookingFrequency * 100
        ).toFixed(0)}% of the time - excellent for health and budget!`
      );
    }

    // Meal planning effectiveness
    if (analytics.mealPlanningEffectiveness > 80) {
      insights.push(
        `Your meal planning is ${analytics.mealPlanningEffectiveness.toFixed(
          0
        )}% effective - you're using most of what you buy!`
      );
    }

    return insights;
  }
}

export default AnalyticsService;
