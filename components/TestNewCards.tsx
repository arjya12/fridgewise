import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { foodItemsService } from "../services/foodItems";
import { convertItemsToCardFormat } from "../utils/foodIconMapping";
import { FoodItemCard } from "./FoodItemCard";

/**
 * Test component to see your actual food items with the new card design
 * Add this to any screen to preview the new cards with your real data
 */
export function TestNewCards() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get your actual food items
      const foodItems = await foodItemsService.getItems();
      console.log("Loaded food items:", foodItems.length);

      // Convert to new card format with emoji icons
      const cardItems = convertItemsToCardFormat(foodItems);
      console.log("Converted to card format:", cardItems);

      setItems(cardItems);
    } catch (err: any) {
      console.error("Failed to load items:", err);
      setError(err.message || "Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  const handleItemPress = (item: any) => {
    console.log("Item pressed:", item);
    // You can add navigation here if needed
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>Loading your food items...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Your Food Items (New Card Design)</Text>
        <Text style={styles.subtitle}>
          {items.length} items loaded from your database
        </Text>

        {items.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No items found</Text>
            <Text style={styles.emptySubtext}>
              Add some food items to see them here!
            </Text>
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            {items.map((item, index) => (
              <View key={item.id} style={styles.cardWrapper}>
                <Text style={styles.cardLabel}>
                  Item {index + 1}: {item.name} ({item.status})
                </Text>
                <FoodItemCard item={item} onPress={handleItemPress} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    textAlign: "center",
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
  cardsContainer: {
    paddingBottom: 40,
  },
  cardWrapper: {
    marginBottom: 20,
  },
  cardLabel: {
    fontSize: 12,
    color: "#8B5CF6",
    marginLeft: 16,
    marginBottom: 4,
    fontWeight: "500",
  },
});

export default TestNewCards;
