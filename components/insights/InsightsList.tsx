// Insights List Component
// Manages and displays multiple smart insights with recommendations

import { ConsumptionAnalytics, WasteAnalytics } from '@/lib/supabase';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import SmartInsightCard, { SmartInsight } from './SmartInsightCard';

interface InsightsListProps {
  wasteAnalytics?: WasteAnalytics;
  consumptionAnalytics?: ConsumptionAnalytics;
  maxInsights?: number;
  style?: ViewStyle;
  onInsightAction?: (insight: SmartInsight) => void;
}

export function InsightsList({
  wasteAnalytics,
  consumptionAnalytics,
  maxInsights = 5,
  style,
  onInsightAction
}: InsightsListProps) {
  const [insights, setInsights] = useState<SmartInsight[]>([]);
  const [dismissedInsights, setDismissedInsights] = useState<Set<string>>(new Set());

  useEffect(() => {
    generateInsights();
  }, [wasteAnalytics, consumptionAnalytics]);

  const generateInsights = () => {
    const generatedInsights: SmartInsight[] = [];

    // Generate waste insights
    if (wasteAnalytics) {
      const wasteInsights = generateWasteInsights(wasteAnalytics);
      generatedInsights.push(...wasteInsights);
    }

    // Generate consumption insights
    if (consumptionAnalytics) {
      const consumptionInsights = generateConsumptionInsights(consumptionAnalytics);
      generatedInsights.push(...consumptionInsights);
    }

    // Sort by priority and limit
    const sortedInsights = generatedInsights
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, maxInsights);

    setInsights(sortedInsights);
  };

  const generateWasteInsights = (analytics: WasteAnalytics): SmartInsight[] => {
    const insights: SmartInsight[] = [];

    // High waste value warning
    if (analytics.wasteValue > 30) {
      insights.push({
        id: 'high_waste_value',
        type: 'warning',
        title: 'High Waste Cost',
        message: `You've wasted $${analytics.wasteValue.toFixed(2)} worth of food this period. Consider meal planning to reduce costs.`,
        actionText: 'Start Meal Planning',
        onAction: () => onInsightAction?.({
          id: 'high_waste_value',
          type: 'warning',
          title: 'High Waste Cost',
          message: '',
          priority: 'high'
        }),
        priority: 'high',
        icon: 'cash',
        data: {
          value: Math.round(analytics.wasteValue),
          unit: '$'
        }
      });
    }

    // Waste reduction celebration
    if (analytics.wasteReductionProgress > 20) {
      insights.push({
        id: 'waste_reduction_success',
        type: 'celebration',
        title: 'Great Progress!',
        message: `You've reduced waste by ${analytics.wasteReductionProgress.toFixed(1)}% compared to last period. Keep up the excellent work!`,
        priority: 'medium',
        icon: 'trophy',
        data: {
          change: Math.round(analytics.wasteReductionProgress)
        }
      });
    }

    // Category-specific waste insight
    const topWasteCategory = Object.entries(analytics.wasteByCategory)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topWasteCategory && topWasteCategory[1] > 3) {
      insights.push({
        id: 'category_waste_tip',
        type: 'suggestion',
        title: `${topWasteCategory[0]} Waste`,
        message: `${topWasteCategory[0]} is your most wasted category. Try buying smaller quantities or using these items first.`,
        actionText: 'See Tips',
        onAction: () => onInsightAction?.({
          id: 'category_waste_tip',
          type: 'suggestion',
          title: `${topWasteCategory[0]} Waste`,
          message: '',
          priority: 'medium'
        }),
        priority: 'medium',
        icon: 'leaf'
      });
    }

    // Most wasted item insight
    if (analytics.mostWastedItems.length > 0) {
      const topWastedItem = analytics.mostWastedItems[0];
      insights.push({
        id: 'top_wasted_item',
        type: 'tip',
        title: 'Frequently Wasted Item',
        message: `${topWastedItem.name} is your most wasted item. Consider using it in meal prep or buying smaller quantities.`,
        actionText: 'Recipe Ideas',
        onAction: () => onInsightAction?.({
          id: 'top_wasted_item',
          type: 'tip',
          title: 'Frequently Wasted Item',
          message: '',
          priority: 'medium'
        }),
        priority: 'medium',
        icon: 'restaurant'
      });
    }

    return insights;
  };

  const generateConsumptionInsights = (analytics: ConsumptionAnalytics): SmartInsight[] => {
    const insights: SmartInsight[] = [];

    // Budget performance
    if (analytics.budgetAnalysis.variance > 20) {
      insights.push({
        id: 'over_budget',
        type: 'warning',
        title: 'Over Budget',
        message: `You're $${analytics.budgetAnalysis.variance.toFixed(2)} over budget this period. Consider adjusting your shopping habits.`,
        actionText: 'Budget Tips',
        onAction: () => onInsightAction?.({
          id: 'over_budget',
          type: 'warning',
          title: 'Over Budget',
          message: '',
          priority: 'high'
        }),
        priority: 'high',
        icon: 'card',
        data: {
          value: Math.round(Math.abs(analytics.budgetAnalysis.variance)),
          unit: '$'
        }
      });
    } else if (analytics.budgetAnalysis.variance < -10) {
      insights.push({
        id: 'under_budget',
        type: 'celebration',
        title: 'Budget Hero!',
        message: `You're $${Math.abs(analytics.budgetAnalysis.variance).toFixed(2)} under budget. Excellent financial management!`,
        priority: 'medium',
        icon: 'trophy',
        data: {
          value: Math.round(Math.abs(analytics.budgetAnalysis.variance)),
          unit: '$'
        }
      });
    }

    // Cooking habits
    if (analytics.cookingVsEatingOut.cookingFrequency > 0.8) {
      insights.push({
        id: 'home_cooking_champion',
        type: 'celebration',
        title: 'Home Cooking Champion!',
        message: `You're cooking at home ${(analytics.cookingVsEatingOut.cookingFrequency * 100).toFixed(0)}% of the time. Great for health and budget!`,
        priority: 'low',
        icon: 'home',
        data: {
          value: Math.round(analytics.cookingVsEatingOut.cookingFrequency * 100),
          unit: '%'
        }
      });
    } else if (analytics.cookingVsEatingOut.cookingFrequency < 0.4) {
      insights.push({
        id: 'increase_home_cooking',
        type: 'suggestion',
        title: 'Cook More at Home',
        message: 'You could save money and eat healthier by cooking at home more often. Start with simple recipes!',
        actionText: 'Easy Recipes',
        onAction: () => onInsightAction?.({
          id: 'increase_home_cooking',
          type: 'suggestion',
          title: 'Cook More at Home',
          message: '',
          priority: 'medium'
        }),
        priority: 'medium',
        icon: 'restaurant'
      });
    }

    // Meal planning effectiveness
    if (analytics.mealPlanningEffectiveness > 85) {
      insights.push({
        id: 'meal_planning_success',
        type: 'celebration',
        title: 'Meal Planning Pro!',
        message: `Your meal planning is ${analytics.mealPlanningEffectiveness.toFixed(0)}% effective. You're using most of what you buy!`,
        priority: 'low',
        icon: 'calendar',
        data: {
          value: Math.round(analytics.mealPlanningEffectiveness),
          unit: '%'
        }
      });
    } else if (analytics.mealPlanningEffectiveness < 60) {
      insights.push({
        id: 'improve_meal_planning',
        type: 'suggestion',
        title: 'Improve Meal Planning',
        message: 'Your meal planning could be more effective. Try planning meals around items that expire soon.',
        actionText: 'Planning Tips',
        onAction: () => onInsightAction?.({
          id: 'improve_meal_planning',
          type: 'suggestion',
          title: 'Improve Meal Planning',
          message: '',
          priority: 'medium'
        }),
        priority: 'medium',
        icon: 'calendar'
      });
    }

    // Nutritional insights
    const healthyCategories = analytics.nutritionalInsights
      .filter(item => ['fruits', 'vegetables'].includes(item.category.toLowerCase()));
    
    if (healthyCategories.length > 0) {
      const avgHealthyScore = healthyCategories.reduce((sum, item) => sum + item.consumptionScore, 0) / healthyCategories.length;
      
      if (avgHealthyScore > 80) {
        insights.push({
          id: 'healthy_eating',
          type: 'celebration',
          title: 'Healthy Eating Star!',
          message: 'You\'re doing great with fruits and vegetables consumption. Keep prioritizing healthy foods!',
          priority: 'low',
          icon: 'leaf'
        });
      } else if (avgHealthyScore < 50) {
        insights.push({
          id: 'increase_healthy_foods',
          type: 'suggestion',
          title: 'More Fruits & Veggies',
          message: 'Try to include more fruits and vegetables in your meals for better nutrition.',
          actionText: 'Healthy Tips',
          onAction: () => onInsightAction?.({
            id: 'increase_healthy_foods',
            type: 'suggestion',
            title: 'More Fruits & Veggies',
            message: '',
            priority: 'medium'
          }),
          priority: 'medium',
          icon: 'leaf'
        });
      }
    }

    return insights;
  };

  const handleDismissInsight = (insightId: string) => {
    setDismissedInsights(prev => new Set([...prev, insightId]));
  };

  const visibleInsights = insights.filter(insight => !dismissedInsights.has(insight.id));

  if (visibleInsights.length === 0) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.emptyText}>No insights available yet. Keep tracking your food to get personalized recommendations!</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.header}>Smart Insights</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {visibleInsights.map((insight) => (
          <SmartInsightCard
            key={insight.id}
            insight={insight}
            onDismiss={handleDismissInsight}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
});

export default InsightsList;