// Enhanced Waste Report Screen
// Comprehensive waste analytics with visualizations, insights, and gamification

import AchievementBadge from '@/components/achievements/AchievementBadge';
import SimpleBarChart from '@/components/charts/SimpleBarChart';
import SimpleLineChart from '@/components/charts/SimpleLineChart';
import SimplePieChart from '@/components/charts/SimplePieChart';
import InsightsList from '@/components/insights/InsightsList';
import { SmartInsight } from '@/components/insights/SmartInsightCard';
import { useAuth } from '@/contexts/AuthContext';
import { Achievement, WasteAnalytics } from '@/lib/supabase';
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

export default function WasteReportScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  const [wasteAnalytics, setWasteAnalytics] = useState<WasteAnalytics | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadWasteReport();
  }, [selectedPeriod]);

  const loadWasteReport = async () => {
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
      const analytics = await AnalyticsService.getWasteAnalytics(startDate, endDate);
      setWasteAnalytics(analytics);

      // Load achievements
      const userAchievements = await AchievementService.getUserAchievements(user.id);
      const recentAchievements = await AchievementService.getRecentAchievements(user.id, 3);
      setAchievements(recentAchievements);

    } catch (error) {
      console.error('Error loading waste report:', error);
      Alert.alert('Error', 'Failed to load waste report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWasteReport();
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
    if (!wasteAnalytics) return null;

    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Ionicons name="trash" size={24} color="#EF4444" />
          <Text style={styles.summaryValue}>{wasteAnalytics.totalWasted}</Text>
          <Text style={styles.summaryLabel}>Items Wasted</Text>
        </View>

        <View style={styles.summaryCard}>
          <Ionicons name="cash" size={24} color="#F59E0B" />
          <Text style={styles.summaryValue}>${wasteAnalytics.wasteValue.toFixed(0)}</Text>
          <Text style={styles.summaryLabel}>Value Lost</Text>
        </View>

        <View style={styles.summaryCard}>
          <Ionicons 
            name={wasteAnalytics.wasteReductionProgress >= 0 ? "trending-up" : "trending-down"} 
            size={24} 
            color={wasteAnalytics.wasteReductionProgress >= 0 ? "#10B981" : "#EF4444"} 
          />
          <Text style={[
            styles.summaryValue,
            { color: wasteAnalytics.wasteReductionProgress >= 0 ? "#10B981" : "#EF4444" }
          ]}>
            {wasteAnalytics.wasteReductionProgress >= 0 ? '+' : ''}{wasteAnalytics.wasteReductionProgress.toFixed(1)}%
          </Text>
          <Text style={styles.summaryLabel}>Change</Text>
        </View>
      </View>
    );
  };

  const renderWasteTrendChart = () => {
    if (!wasteAnalytics || wasteAnalytics.wasteTrends.length === 0) return null;

    const chartData = wasteAnalytics.wasteTrends.map(trend => ({
      x: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      y: trend.wasteCount
    }));

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Waste Trends</Text>
        <SimpleLineChart
          data={chartData}
          width={screenWidth - 40}
          height={200}
          lineColor="#EF4444"
          pointColor="#DC2626"
          backgroundColor="#FFFFFF"
        />
      </View>
    );
  };

  const renderCategoryBreakdown = () => {
    if (!wasteAnalytics || Object.keys(wasteAnalytics.wasteByCategory).length === 0) return null;

    const colors = ['#EF4444', '#F59E0B', '#8B5CF6', '#06B6D4', '#84CC16'];
    const chartData = Object.entries(wasteAnalytics.wasteByCategory).map(([category, count], index) => ({
      label: category,
      value: count,
      color: colors[index % colors.length]
    }));

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Waste by Category</Text>
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

  const renderMostWastedItems = () => {
    if (!wasteAnalytics || wasteAnalytics.mostWastedItems.length === 0) return null;

    const chartData = wasteAnalytics.mostWastedItems.slice(0, 5).map(item => ({
      label: item.name,
      value: item.count,
      color: '#EF4444'
    }));

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Most Wasted Items</Text>
        <SimpleBarChart
          data={chartData}
          width={screenWidth - 40}
          height={200}
          barColor="#EF4444"
          backgroundColor="#FFFFFF"
        />
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
        <Text style={styles.loadingText}>Loading waste report...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Waste Report</Text>
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

        {/* Charts */}
        {renderWasteTrendChart()}
        {renderCategoryBreakdown()}
        {renderMostWastedItems()}

        {/* Smart Insights */}
        <View style={styles.insightsContainer}>
          <InsightsList
            wasteAnalytics={wasteAnalytics}
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
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
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