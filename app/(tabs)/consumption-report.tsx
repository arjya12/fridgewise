// Enhanced Consumption Report Screen
// Comprehensive consumption analytics with budget analysis, patterns, and insights

import AchievementBadge from '@/components/achievements/AchievementBadge';
import SimpleBarChart from '@/components/charts/SimpleBarChart';
import SimplePieChart from '@/components/charts/SimplePieChart';
import InsightsList from '@/components/insights/InsightsList';
import { SmartInsight } from '@/components/insights/SmartInsightCard';
import { useAuth } from '@/contexts/AuthContext';
import { Achievement, ConsumptionAnalytics } from '@/lib/supabase';
import AchievementService from '@/services/achievementService';
import AnalyticsService from '@/services/analyticsService';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');

export default function ConsumptionReportScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  const [consumptionAnalytics, setConsumptionAnalytics] = useState<ConsumptionAnalytics | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadConsumptionReport();
  }, [selectedPeriod]);

  const loadConsumptionReport = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Calculate date range based on selected period
      const endDate = new Date();
      const startDate = new Date();
      
      switch (selectedPeriod) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Load analytics data
      const analytics = await AnalyticsService.getConsumptionAnalytics(startDate, endDate);
      setConsumptionAnalytics(analytics);

      // Load achievements
      const recentAchievements = await AchievementService.getRecentAchievements(user.id, 3);
      setAchievements(recentAchievements);

    } catch (error) {
      console.error('Error loading consumption report:', error);
      Alert.alert('Error', 'Failed to load consumption report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConsumptionReport();
    setRefreshing(false);
  };

  const handleInsightAction = (insight: SmartInsight) => {
    // Handle insight actions (navigate to tips, meal planning, etc.)
    Alert.alert(
      insight.title,
      'This would navigate to relevant tips or features based on the insight.',
      [{ text: 'OK' }]
    );
  };

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {(['week', 'month', 'year'] as const).map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.selectedPeriod
          ]}
          onPress={() => setSelectedPeriod(period)}
        >
          <Text style={[
            styles.periodText,
            selectedPeriod === period && styles.selectedPeriodText
          ]}>
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSummaryCards = () => {
    if (!consumptionAnalytics) return null;

    const budgetStatus = consumptionAnalytics.budgetAnalysis.variance;
    const isOverBudget = budgetStatus > 0;

    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Ionicons name="restaurant" size={24} color="#059669" />
          <Text style={styles.summaryValue}>
            {consumptionAnalytics.mostConsumedItems.length}
          </Text>
          <Text style={styles.summaryLabel}>Items Consumed</Text>
        </View>

        <View style={styles.summaryCard}>
          <Ionicons 
            name="card" 
            size={24} 
            color={isOverBudget ? "#EF4444" : "#10B981"} 
          />
          <Text style={[
            styles.summaryValue,
            { color: isOverBudget ? "#EF4444" : "#10B981" }
          ]}>
            ${Math.abs(budgetStatus).toFixed(0)}
          </Text>
          <Text style={styles.summaryLabel}>
            {isOverBudget ? 'Over Budget' : 'Under Budget'}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Ionicons name="home" size={24} color="#2563EB" />
          <Text style={styles.summaryValue}>
            {(consumptionAnalytics.cookingVsEatingOut.cookingFrequency * 100).toFixed(0)}%
          </Text>
          <Text style={styles.summaryLabel}>Home Cooking</Text>
        </View>
      </View>
    );
  };

  const renderMostConsumedItems = () => {
    if (!consumptionAnalytics || consumptionAnalytics.mostConsumedItems.length === 0) return null;

    const chartData = consumptionAnalytics.mostConsumedItems.slice(0, 5).map(item => ({
      label: item.name,
      value: item.count,
      color: '#059669'
    }));

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Most Consumed Items</Text>
        <SimpleBarChart
          data={chartData}
          width={screenWidth - 40}
          height={200}
          barColor="#059669"
          backgroundColor="#FFFFFF"
        />
      </View>
    );
  };

  const renderBudgetBreakdown = () => {
    if (!consumptionAnalytics || Object.keys(consumptionAnalytics.budgetAnalysis.categoryBreakdown).length === 0) return null;

    const colors = ['#2563EB', '#059669', '#DC2626', '#D97706', '#7C3AED'];
    const chartData = Object.entries(consumptionAnalytics.budgetAnalysis.categoryBreakdown)
      .map(([category, spending], index) => ({
        label: category,
        value: spending,
        color: colors[index % colors.length]
      }));

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Spending by Category</Text>
        <SimplePieChart
          data={chartData}
          width={screenWidth - 40}
          height={250}
          backgroundColor="#FFFFFF"
          showLegend={true}
        />
      </View>
    );
  };

  const renderNutritionalInsights = () => {
    if (!consumptionAnalytics || consumptionAnalytics.nutritionalInsights.length === 0) return null;

    const chartData = consumptionAnalytics.nutritionalInsights.map(item => ({
      label: item.category,
      value: item.consumptionScore,
      color: item.consumptionScore >= 70 ? '#10B981' : item.consumptionScore >= 50 ? '#F59E0B' : '#EF4444'
    }));

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Nutritional Balance</Text>
        <Text style={styles.chartSubtitle}>Higher scores indicate healthier consumption patterns</Text>
        <SimpleBarChart
          data={chartData}
          width={screenWidth - 40}
          height={200}
          backgroundColor="#FFFFFF"
          maxValue={100}
          showValues={true}
        />
      </View>
    );
  };

  const renderShoppingPatterns = () => {
    if (!consumptionAnalytics || consumptionAnalytics.shoppingPatterns.length === 0) return null;

    return (
      <View style={styles.patternContainer}>
        <Text style={styles.sectionTitle}>Shopping Patterns</Text>
        {consumptionAnalytics.shoppingPatterns.slice(0, 5).map((pattern, index) => (
          <View key={index} style={styles.patternItem}>
            <View style={styles.patternHeader}>
              <Text style={styles.patternCategory}>{pattern.category}</Text>
              <Text style={styles.patternFrequency}>
                {pattern.frequency} times
              </Text>
            </View>
            <View style={styles.patternDetails}>
              <Text style={styles.patternDetail}>
                Avg: {pattern.averageQuantity.toFixed(1)} items
              </Text>
              <View style={[
                styles.trendIndicator,
                { backgroundColor: pattern.seasonalTrend >= 0 ? '#10B981' : '#EF4444' }
              ]}>
                <Ionicons
                  name={pattern.seasonalTrend >= 0 ? 'trending-up' : 'trending-down'}
                  size={16}
                  color="#FFFFFF"
                />
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderMealPlanningEffectiveness = () => {
    if (!consumptionAnalytics) return null;

    const effectiveness = consumptionAnalytics.mealPlanningEffectiveness;
    const getColor = (value: number) => {
      if (value >= 80) return '#10B981';
      if (value >= 60) return '#F59E0B';
      return '#EF4444';
    };

    return (
      <View style={styles.effectivenessContainer}>
        <Text style={styles.sectionTitle}>Meal Planning Effectiveness</Text>
        <View style={styles.effectivenessCard}>
          <View style={styles.effectivenessScore}>
            <Text style={[styles.scoreValue, { color: getColor(effectiveness) }]}>
              {effectiveness.toFixed(0)}%
            </Text>
            <Text style={styles.scoreLabel}>Effectiveness</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${effectiveness}%`,
                    backgroundColor: getColor(effectiveness)
                  }
                ]}
              />
            </View>
            <Text style={styles.progressLabel}>
              {effectiveness >= 80 ? 'Excellent!' : effectiveness >= 60 ? 'Good' : 'Needs Improvement'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderAchievements = () => {
    if (achievements.length === 0) return null;

    return (
      <View style={styles.achievementsContainer}>
        <Text style={styles.sectionTitle}>Recent Achievements</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.achievementsScroll}>
          {achievements.map((achievement) => (
            <AchievementBadge
              key={achievement.id}
              achievement={achievement}
              size="medium"
              style={styles.achievementItem}
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading consumption report...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Consumption Report</Text>
        <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
          <Ionicons 
            name="refresh" 
            size={24} 
            color={refreshing ? "#9CA3AF" : "#374151"} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Period Selector */}
        {renderPeriodSelector()}

        {/* Summary Cards */}
        {renderSummaryCards()}

        {/* Achievements */}
        {renderAchievements()}

        {/* Charts and Analytics */}
        {renderMostConsumedItems()}
        {renderBudgetBreakdown()}
        {renderNutritionalInsights()}
        {renderMealPlanningEffectiveness()}
        {renderShoppingPatterns()}

        {/* Smart Insights */}
        <View style={styles.insightsContainer}>
          <InsightsList
            consumptionAnalytics={consumptionAnalytics}
            maxInsights={3}
            onInsightAction={handleInsightAction}
          />
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  scrollContent: {
    flex: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  selectedPeriod: {
    backgroundColor: '#2563EB',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  selectedPeriodText: {
    color: '#FFFFFF',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  patternContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  patternItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  patternHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  patternCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textTransform: 'capitalize',
  },
  patternFrequency: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  patternDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patternDetail: {
    fontSize: 12,
    color: '#6B7280',
  },
  trendIndicator: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  effectivenessContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  effectivenessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  effectivenessScore: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  progressBarContainer: {
    flex: 1,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  achievementsContainer: {
    marginHorizontal: 20,
    marginTop: 16,
  },
  achievementsScroll: {
    marginHorizontal: -10,
  },
  achievementItem: {
    marginHorizontal: 10,
  },
  insightsContainer: {
    marginHorizontal: 20,
    marginTop: 16,
  },
});