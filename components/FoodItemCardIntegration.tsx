import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { foodItemsService } from "../services/foodItems";
import { convertItemsToCardFormat } from "../utils/foodIconMapping";
import { FoodItemCard } from "./FoodItemCard";

// =============================================================================
// INTEGRATION COMPONENT
// =============================================================================

/**
 * Example component showing how to integrate the new FoodItemCard
 * with your existing food items service and data structure
 */
export function FoodItemListWithNewCards() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      // Get items from your existing service
      const foodItems = await foodItemsService.getItems();

      // Convert to new card format with emoji icons
      const cardItems = convertItemsToCardFormat(foodItems);

      setItems(cardItems);
    } catch (error) {
      console.error("Failed to load items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemPress = (item: any) => {
    // Navigate to item details or open modal
    router.push(`/(tabs)/item-details?id=${item.id}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Loading items...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Your Food Items</Text>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No items found</Text>
          <Text style={styles.emptySubtext}>
            Add some food items to get started!
          </Text>
        </View>
      ) : (
        items.map((item) => (
          <FoodItemCard key={item.id} item={item} onPress={handleItemPress} />
        ))
      )}
    </ScrollView>
  );
}

// =============================================================================
// EXPIRING SOON SECTION WITH NEW CARDS
// =============================================================================

/**
 * Updated "Expiring Soon" section using the new card design
 */
export function ExpiringSoonWithNewCards() {
  const [expiringSoonItems, setExpiringSoonItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExpiringSoonItems();
  }, []);

  const loadExpiringSoonItems = async () => {
    try {
      setLoading(true);
      // Get expiring items from your existing service
      const foodItems = await foodItemsService.getExpiringItems(7); // Next 7 days

      // Convert to new card format with emoji icons
      const cardItems = convertItemsToCardFormat(foodItems);

      setExpiringSoonItems(cardItems);
    } catch (error) {
      console.error("Failed to load expiring items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemPress = (item: any) => {
    router.push(`/(tabs)/item-details?id=${item.id}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  return (
    <View style={styles.sectionContainer}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <View
            style={[styles.sectionIndicator, { backgroundColor: "#EA580C" }]}
          />
          <Text style={styles.sectionTitle}>Expiring Soon</Text>
        </View>
        <Text style={styles.itemCount}>
          {expiringSoonItems.length} item
          {expiringSoonItems.length === 1 ? "" : "s"}
        </Text>
      </View>

      {/* Items List */}
      {expiringSoonItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>🎉 Nothing expiring soon!</Text>
          <Text style={styles.emptySubtext}>Your food is well managed</Text>
        </View>
      ) : (
        <View style={styles.itemsList}>
          {expiringSoonItems.slice(0, 5).map((item) => (
            <FoodItemCard
              key={item.id}
              item={item}
              onPress={handleItemPress}
              style={styles.itemCard}
            />
          ))}

          {expiringSoonItems.length > 5 && (
            <View style={styles.moreItemsIndicator}>
              <Text style={styles.moreItemsText}>
                +{expiringSoonItems.length - 5} more items
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// =============================================================================
// REPLACEMENT FOR ENHANCEDSWIPEABLEITEMCARD
// =============================================================================

/**
 * Example showing how to replace EnhancedSwipeableItemCard usage
 * with the new FoodItemCard component
 */
export function UpdatedEnhancedCalendarScreen() {
  const [expiringSoonItems, setExpiringSoonItems] = useState<any[]>([]);

  const loadData = async () => {
    const items = await foodItemsService.getExpiringItems(7);
    const cardItems = convertItemsToCardFormat(items);
    setExpiringSoonItems(cardItems);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleItemPress = (item: any) => {
    router.push(`/(tabs)/item-details?id=${item.id}`);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Your existing calendar component here */}

      {/* Updated Expiring Soon section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Expiring Soon</Text>

        {expiringSoonItems.map((item) => (
          <FoodItemCard key={item.id} item={item} onPress={handleItemPress} />
        ))}
      </View>
    </ScrollView>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    padding: 20,
    paddingBottom: 12,
  },
  sectionContainer: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionIndicator: {
    width: 4,
    height: 16,
    borderRadius: 2,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  itemCount: {
    fontSize: 14,
    fontWeight: "400",
    color: "#8E8E93",
  },
  itemsList: {
    paddingHorizontal: 4,
  },
  itemCard: {
    marginHorizontal: 12,
    marginVertical: 4,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  moreItemsIndicator: {
    alignItems: "center",
    paddingVertical: 12,
    marginHorizontal: 20,
  },
  moreItemsText: {
    fontSize: 14,
    fontWeight: "400",
    fontStyle: "italic",
    color: "#8E8E93",
  },
});

export default FoodItemListWithNewCards;
