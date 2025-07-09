// components/MealPlanningPanel.tsx
import { useThemeColor } from "@/hooks/useThemeColor";
import { FoodItemWithUrgency } from "@/services/foodItems";
import {
  analyzeMealPlanning,
  formatMealPlanningInsights,
  getMealSuggestions,
  MealOpportunity,
} from "@/utils/mealPlanningUtils";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface MealPlanningPanelProps {
  items: FoodItemWithUrgency[];
  selectedDate?: string;
  onItemPress?: (item: FoodItemWithUrgency) => void;
  onRecipeSelect?: (recipe: MealOpportunity) => void;
  compact?: boolean;
}

type TabType = "overview" | "breakfast" | "lunch" | "dinner" | "snacks";

const MealPlanningPanel: React.FC<MealPlanningPanelProps> = ({
  items,
  selectedDate,
  onItemPress,
  onRecipeSelect,
  compact = false,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const backgroundColor = useThemeColor(
    { light: "#FFFFFF", dark: "#1D1D1D" },
    "background"
  );
  const surfaceColor = useThemeColor(
    { light: "#F8F9FA", dark: "#2C2C2E" },
    "background"
  );
  const textColor = useThemeColor(
    { light: "#11181C", dark: "#ECEDEE" },
    "text"
  );
  const primaryColor = "#007AFF";

  // Analyze meal planning opportunities
  const analysis = useMemo(() => analyzeMealPlanning(items), [items]);
  const insights = useMemo(
    () => formatMealPlanningInsights(analysis),
    [analysis]
  );

  // Get meal-specific suggestions
  const breakfastSuggestions = useMemo(
    () => getMealSuggestions(items, "breakfast"),
    [items]
  );
  const lunchSuggestions = useMemo(
    () => getMealSuggestions(items, "lunch"),
    [items]
  );
  const dinnerSuggestions = useMemo(
    () => getMealSuggestions(items, "dinner"),
    [items]
  );
  const snackSuggestions = useMemo(
    () => getMealSuggestions(items, "snack"),
    [items]
  );

  const getDifficultyColor = (difficulty: MealOpportunity["difficulty"]) => {
    switch (difficulty) {
      case "easy":
        return "#22C55E";
      case "medium":
        return "#F59E0B";
      case "hard":
        return "#EF4444";
      default:
        return textColor;
    }
  };

  const getUrgencyColor = (score: number) => {
    if (score >= 75) return "#EF4444";
    if (score >= 50) return "#F97316";
    if (score >= 25) return "#EAB308";
    return "#22C55E";
  };

  const MealCard: React.FC<{ opportunity: MealOpportunity }> = ({
    opportunity,
  }) => (
    <TouchableOpacity
      style={[styles.mealCard, { backgroundColor: surfaceColor }]}
      onPress={() => onRecipeSelect?.(opportunity)}
      activeOpacity={0.7}
    >
      <View style={styles.mealHeader}>
        <View style={styles.mealTitleRow}>
          <Text style={[styles.mealTitle, { color: textColor }]}>
            {opportunity.title}
          </Text>
          <View style={styles.mealBadges}>
            <View
              style={[
                styles.urgencyBadge,
                { backgroundColor: getUrgencyColor(opportunity.urgencyScore) },
              ]}
            >
              <Text style={styles.badgeText}>
                {opportunity.urgencyScore >= 75
                  ? "URGENT"
                  : opportunity.urgencyScore >= 50
                  ? "SOON"
                  : "GOOD"}
              </Text>
            </View>
            <View
              style={[
                styles.difficultyBadge,
                { backgroundColor: getDifficultyColor(opportunity.difficulty) },
              ]}
            >
              <Text style={styles.badgeText}>
                {opportunity.difficulty.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.mealDescription, { color: textColor }]}>
          {opportunity.description}
        </Text>
      </View>

      <View style={styles.mealStats}>
        <View style={styles.statItem}>
          <Ionicons name="time" size={14} color={textColor} />
          <Text style={[styles.statText, { color: textColor }]}>
            {opportunity.estimatedPrepTime} min
          </Text>
        </View>

        <View style={styles.statItem}>
          <Ionicons name="nutrition" size={14} color={textColor} />
          <Text style={[styles.statText, { color: textColor }]}>
            {opportunity.nutritionScore}/100
          </Text>
        </View>

        {opportunity.wasteReduction > 0 && (
          <View style={styles.statItem}>
            <Ionicons name="leaf" size={14} color="#22C55E" />
            <Text style={[styles.statText, { color: "#22C55E" }]}>
              -{opportunity.wasteReduction}% waste
            </Text>
          </View>
        )}
      </View>

      <View style={styles.ingredients}>
        <Text style={[styles.ingredientsLabel, { color: textColor }]}>
          Ingredients ({opportunity.ingredients.length}):
        </Text>
        <View style={styles.ingredientsList}>
          {opportunity.ingredients.slice(0, 3).map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.ingredientChip,
                { backgroundColor: item.urgency.backgroundColor },
              ]}
              onPress={() => onItemPress?.(item)}
            >
              <Text
                style={[styles.ingredientText, { color: item.urgency.color }]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          ))}
          {opportunity.ingredients.length > 3 && (
            <View
              style={[styles.ingredientChip, { backgroundColor: surfaceColor }]}
            >
              <Text style={[styles.ingredientText, { color: textColor }]}>
                +{opportunity.ingredients.length - 3} more
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.tags}>
        {opportunity.tags.slice(0, 3).map((tag, index) => (
          <View
            key={index}
            style={[styles.tag, { backgroundColor: primaryColor + "20" }]}
          >
            <Text style={[styles.tagText, { color: primaryColor }]}>{tag}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );

  const OverviewTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Summary Section */}
      <View style={[styles.section, { backgroundColor: surfaceColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          Meal Planning Summary
        </Text>
        <Text style={[styles.summaryText, { color: textColor }]}>
          {insights.summary}
        </Text>

        {insights.highlights.length > 0 && (
          <View style={styles.highlights}>
            {insights.highlights.map((highlight, index) => (
              <View key={index} style={styles.highlightItem}>
                <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                <Text style={[styles.highlightText, { color: textColor }]}>
                  {highlight}
                </Text>
              </View>
            ))}
          </View>
        )}

        {insights.alerts.length > 0 && (
          <View style={styles.alerts}>
            {insights.alerts.map((alert, index) => (
              <View key={index} style={styles.alertItem}>
                <Ionicons name="warning" size={16} color="#F59E0B" />
                <Text style={[styles.alertText, { color: textColor }]}>
                  {alert}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Priority Recommendations */}
      {analysis.recommendations.priority.length > 0 && (
        <View style={[styles.section, { backgroundColor: surfaceColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Priority Meals (Use Expiring Items)
          </Text>
          {analysis.recommendations.priority.map((opportunity) => (
            <MealCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </View>
      )}

      {/* Quick Meals */}
      {analysis.recommendations.quick.length > 0 && (
        <View style={[styles.section, { backgroundColor: surfaceColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Quick Meals (≤15 minutes)
          </Text>
          {analysis.recommendations.quick.map((opportunity) => (
            <MealCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </View>
      )}

      {/* Nutritious Options */}
      {analysis.recommendations.nutritious.length > 0 && (
        <View style={[styles.section, { backgroundColor: surfaceColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Nutritious Options
          </Text>
          {analysis.recommendations.nutritious.map((opportunity) => (
            <MealCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </View>
      )}

      {/* Unused Critical Items */}
      {analysis.unusedCritical.length > 0 && (
        <View style={[styles.section, { backgroundColor: surfaceColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Items Needing Attention
          </Text>
          <Text style={[styles.sectionSubtitle, { color: textColor }]}>
            These critical items aren&apos;t used in any suggested meals
          </Text>
          <View style={styles.unusedItems}>
            {analysis.unusedCritical.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.unusedItem,
                  { backgroundColor: item.urgency.backgroundColor },
                ]}
                onPress={() => onItemPress?.(item)}
              >
                <Text
                  style={[styles.unusedItemText, { color: item.urgency.color }]}
                >
                  {item.name}
                </Text>
                <Text
                  style={[
                    styles.unusedItemUrgency,
                    { color: item.urgency.color },
                  ]}
                >
                  {item.urgency.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );

  const MealTypeTab = ({
    suggestions,
    mealType,
  }: {
    suggestions: MealOpportunity[];
    mealType: string;
  }) => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {suggestions.length > 0 ? (
        <View style={[styles.section, { backgroundColor: surfaceColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            {mealType} Ideas
          </Text>
          {suggestions.map((opportunity) => (
            <MealCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons
            name="restaurant"
            size={48}
            color={textColor}
            opacity={0.3}
          />
          <Text style={[styles.emptyStateText, { color: textColor }]}>
            No {mealType.toLowerCase()} suggestions available
          </Text>
          <Text style={[styles.emptyStateSubtext, { color: textColor }]}>
            Try adding more ingredients to your inventory
          </Text>
        </View>
      )}
    </ScrollView>
  );

  const TabButton = ({
    tab,
    label,
    icon,
    count,
  }: {
    tab: TabType;
    label: string;
    icon: string;
    count?: number;
  }) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === tab && { backgroundColor: primaryColor },
      ]}
      onPress={() => setActiveTab(tab)}
    >
      <Ionicons
        name={icon as any}
        size={16}
        color={activeTab === tab ? "#FFFFFF" : textColor}
      />
      <Text
        style={[
          styles.tabButtonText,
          { color: activeTab === tab ? "#FFFFFF" : textColor },
        ]}
      >
        {label}
      </Text>
      {count !== undefined && count > 0 && (
        <View
          style={[
            styles.tabCount,
            {
              backgroundColor:
                activeTab === tab ? "rgba(255,255,255,0.3)" : primaryColor,
            },
          ]}
        >
          <Text style={styles.tabCountText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (compact) {
    return (
      <View
        style={[styles.compactContainer, { backgroundColor: surfaceColor }]}
      >
        <Text style={[styles.compactTitle, { color: textColor }]}>
          Meal Suggestions
        </Text>
        <Text style={[styles.compactSummary, { color: textColor }]}>
          {insights.summary}
        </Text>
        {analysis.recommendations.priority.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.compactScrollView}
          >
            {analysis.recommendations.priority
              .slice(0, 3)
              .map((opportunity) => (
                <View
                  key={opportunity.id}
                  style={[
                    styles.compactMealCard,
                    { backgroundColor: backgroundColor },
                  ]}
                >
                  <Text
                    style={[styles.compactMealTitle, { color: textColor }]}
                    numberOfLines={1}
                  >
                    {opportunity.title}
                  </Text>
                  <Text style={[styles.compactMealTime, { color: textColor }]}>
                    {opportunity.estimatedPrepTime} min
                  </Text>
                </View>
              ))}
          </ScrollView>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: surfaceColor }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContainer}
        >
          <TabButton
            tab="overview"
            label="Overview"
            icon="analytics"
            count={analysis.opportunities.length}
          />
          <TabButton
            tab="breakfast"
            label="Breakfast"
            icon="sunny"
            count={breakfastSuggestions.length}
          />
          <TabButton
            tab="lunch"
            label="Lunch"
            icon="restaurant"
            count={lunchSuggestions.length}
          />
          <TabButton
            tab="dinner"
            label="Dinner"
            icon="moon"
            count={dinnerSuggestions.length}
          />
          <TabButton
            tab="snacks"
            label="Snacks"
            icon="leaf"
            count={snackSuggestions.length}
          />
        </ScrollView>
      </View>

      {/* Tab Content */}
      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "breakfast" && (
        <MealTypeTab suggestions={breakfastSuggestions} mealType="Breakfast" />
      )}
      {activeTab === "lunch" && (
        <MealTypeTab suggestions={lunchSuggestions} mealType="Lunch" />
      )}
      {activeTab === "dinner" && (
        <MealTypeTab suggestions={dinnerSuggestions} mealType="Dinner" />
      )}
      {activeTab === "snacks" && (
        <MealTypeTab suggestions={snackSuggestions} mealType="Snacks" />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  compactContainer: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  compactTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  compactSummary: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 8,
  },
  compactScrollView: {
    marginTop: 8,
  },
  compactMealCard: {
    padding: 8,
    borderRadius: 6,
    marginRight: 8,
    minWidth: 100,
  },
  compactMealTitle: {
    fontSize: 12,
    fontWeight: "500",
  },
  compactMealTime: {
    fontSize: 10,
    opacity: 0.7,
    marginTop: 2,
  },
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  tabScrollContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    gap: 6,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  tabCount: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  tabCountText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    marginBottom: 12,
  },
  highlights: {
    marginBottom: 12,
  },
  highlightItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  highlightText: {
    fontSize: 14,
    flex: 1,
  },
  alerts: {
    marginTop: 8,
  },
  alertItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  alertText: {
    fontSize: 14,
    flex: 1,
  },
  mealCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  mealHeader: {
    marginBottom: 12,
  },
  mealTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  mealBadges: {
    flexDirection: "row",
    gap: 6,
  },
  urgencyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  difficultyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  mealDescription: {
    fontSize: 14,
    opacity: 0.8,
  },
  mealStats: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  ingredients: {
    marginBottom: 12,
  },
  ingredientsLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 6,
  },
  ingredientsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  ingredientChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  ingredientText: {
    fontSize: 11,
    fontWeight: "500",
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "500",
  },
  unusedItems: {
    gap: 8,
  },
  unusedItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  unusedItemText: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  unusedItemUrgency: {
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 16,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
    textAlign: "center",
  },
});

export default MealPlanningPanel;
