import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AchievementCard from "@/components/AchievementCard";
import AnimatedCounter from "@/components/AnimatedCounter";
import AnimatedItemGroupCard from "@/components/AnimatedItemGroupCard";
import EmptyStateView from "@/components/EmptyStateView";
import InsightsCarousel from "@/components/InsightsCarousel";
import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import TipCard from "@/components/TipCard";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useTips } from "@/contexts/TipsContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { FoodItem } from "@/lib/supabase";
import { foodItemsService } from "@/services/foodItems";

const { width, height } = Dimensions.get("window");

// Utility function to ensure text props are properly handled
const ensureTextSafety = (text: string | number | undefined): string => {
  if (text === undefined || text === null) {
    return "";
  }
  return String(text);
};

// Use React Native's Text component with enhanced styling to fix rendering issues
const EnhancedText = ({
  style,
  children,
  ...props
}: React.ComponentProps<typeof Text>) => (
  <Text
    {...props}
    style={[
      {
        fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
        includeFontPadding: false,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 0,
        opacity: 1,
        fontWeight: "500",
      },
      style,
    ]}
    allowFontScaling={false}
  >
    {children}
  </Text>
);

// Special component for numbers to fix "0" rendering issues
const NumberText = ({
  style,
  children,
  ...props
}: React.ComponentProps<typeof Text>) => (
  <Text
    {...props}
    style={[
      {
        fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
        fontWeight: "900",
        includeFontPadding: true,
        lineHeight: Platform.OS === "ios" ? 60 : 65,
        padding: 0,
        margin: 0,
        color: "#424753",
        textAlign: "center",
        textAlignVertical: "center",
      },
      style,
    ]}
    allowFontScaling={false}
  >
    {children}
  </Text>
);

// Type for an individual food item entry
type ItemEntry = {
  id: string;
  quantity: number;
  expiryDate?: string;
  isUseFirst?: boolean;
  daysUntilExpiry?: number;
  expiryStatus?: string;
};

// Type for a group of food items
type ItemGroup = {
  name: string;
  entries: ItemEntry[];
};

// Helper function to calculate days until expiry
const getDaysUntilExpiry = (expiryDate?: string): number | undefined => {
  if (!expiryDate) return undefined;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  return Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
};

export default function InventoryScreen() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [itemGroups, setItemGroups] = useState<ItemGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "fridge" | "shelf">("fridge");
  const [searchText, setSearchText] = useState("");
  const [wastePercentage, setWastePercentage] = useState(15); // Default value, should be calculated from actual data
  const [mostConsumedCategory, setMostConsumedCategory] = useState("");
  const [newItemGroups, setNewItemGroups] = useState<Set<string>>(new Set());
  const prevItemGroupsRef = useRef<ItemGroup[]>([]);
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const { helpfulTips } = useSettings();
  const { currentTip } = useTips();

  // State for edit modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState<{
    id: string;
    groupName: string;
    name: string;
    quantity: number;
    daysUntilExpiry: number;
    location: "fridge" | "shelf";
  } | null>(null);

  // State for filtered groups and search results
  const [filteredGroups, setFilteredGroups] = useState<ItemGroup[]>([]);
  const [hasFilteredResults, setHasFilteredResults] = useState(true);

  const {
    itemGroups: allItemGroups,
    expiringItems,
    lowStockGroups,
    fridgeCount,
    shelfCount,
  } = useMemo(() => {
    // Group items by name
    const grouped = items.reduce<{ [key: string]: ItemGroup }>((acc, item) => {
      if (!acc[item.name]) {
        acc[item.name] = { name: item.name, entries: [] };
      }

      const daysUntilExpiry = getDaysUntilExpiry(item.expiry_date);
      // Show "Use First" only for items expiring in 0-3 days
      const isUseFirst =
        daysUntilExpiry !== undefined &&
        daysUntilExpiry >= 0 &&
        daysUntilExpiry <= 3;

      acc[item.name].entries.push({
        id: item.id,
        quantity: item.quantity,
        expiryDate: item.expiry_date,
        isUseFirst, // Apply the new logic here
        daysUntilExpiry,
      });

      return acc;
    }, {});

    // Sort entries within each group
    Object.values(grouped).forEach((group) => {
      group.entries.sort(
        (a, b) => (a.daysUntilExpiry ?? 999) - (b.daysUntilExpiry ?? 999)
      );
    });

    const allGroups = Object.values(grouped);

    // Calculate stats
    const expiring = items.filter((item) => {
      const days = getDaysUntilExpiry(item.expiry_date);
      return days !== undefined && days <= 3;
    });

    const lowStock = allGroups.filter(
      (group) =>
        group.entries.reduce((total, entry) => total + entry.quantity, 0) <= 2
    );

    const fridge = items.filter((item) => item.location === "fridge").length;
    const shelf = items.filter((item) => item.location === "shelf").length;

    return {
      itemGroups: allGroups,
      expiringItems: expiring,
      lowStockGroups: lowStock.length,
      fridgeCount: fridge,
      shelfCount: shelf,
    };
  }, [items]);

  useEffect(() => {
    if (!user) {
      router.replace("/(auth)/login");
      return;
    }
    loadItems();
  }, [user, filter]);

  // Effect to filter items based on search text
  useEffect(() => {
    if (searchText.trim() === "") {
      setFilteredGroups(allItemGroups);
      setHasFilteredResults(allItemGroups.length > 0);
    } else {
      const filtered = allItemGroups.filter((group) =>
        group.name.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredGroups(filtered);
      setHasFilteredResults(filtered.length > 0);
    }
  }, [searchText, allItemGroups]);

  // Effect to filter items based on location filter
  useEffect(() => {
    let filtered = [...allItemGroups];

    // Apply location filter
    if (filter !== "all") {
      filtered = allItemGroups.filter((group) => {
        // Check if any entry in the group belongs to the selected location
        const item = items.find(
          (item) => item.name === group.name && item.location === filter
        );
        return item !== undefined;
      });
    }

    // Apply search filter
    if (searchText.trim() !== "") {
      filtered = filtered.filter((group) =>
        group.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredGroups(filtered);
    setHasFilteredResults(filtered.length > 0);
  }, [filter, searchText, allItemGroups, items]);

  // Clear search handler
  const handleClearSearch = () => {
    setSearchText("");
  };

  // Track new item groups for animation
  useEffect(() => {
    const prevItemNames = new Set(
      prevItemGroupsRef.current.map((group) => group.name)
    );
    const currentItemNames = new Set(allItemGroups.map((group) => group.name));

    // Find new item groups that weren't in the previous render
    const newItems = new Set<string>();
    currentItemNames.forEach((name) => {
      if (!prevItemNames.has(name)) {
        newItems.add(name);
      }
    });

    if (newItems.size > 0) {
      setNewItemGroups(newItems);

      // Clear the new items after animation (3 seconds)
      const timer = setTimeout(() => {
        setNewItemGroups(new Set());
      }, 3000);

      return () => clearTimeout(timer);
    }

    // Update the ref for the next comparison
    prevItemGroupsRef.current = [...allItemGroups];
  }, [allItemGroups]);

  // Handle item press in the carousel
  const handleItemPress = (itemId: string) => {
    // Find the item group that contains this item
    const group = allItemGroups.find((g) =>
      g.entries.some((entry) => entry.id === itemId)
    );

    if (group) {
      // Scroll to the item group (this would require additional implementation)
      // For now, we'll just log it
      console.log(`Scrolling to item: ${group.name}`);

      // You could also navigate to a details page
      // router.push({
      //   pathname: "/(tabs)/item-details",
      //   params: { id: itemId },
      // });
    }
  };

  // Load usage statistics
  const loadUsageStats = async () => {
    try {
      // Get the current date
      const today = new Date();

      // Get the date from 7 days ago
      const lastWeek = new Date();
      lastWeek.setDate(today.getDate() - 7);

      // For now, we'll use placeholder data since getUsageStats isn't implemented
      // In a real implementation, you would call the actual service
      // const stats = await foodItemsService.getUsageStats(lastWeek, today);

      // Update state with the statistics
      setWastePercentage(15); // Placeholder value
      setMostConsumedCategory("dairy products"); // Placeholder value
    } catch (error: any) {
      console.error("Error loading usage statistics:", error);
    }
  };

  // Update the loadItems function to also load usage statistics
  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await foodItemsService.getItems();
      setItems(data);

      // Also load usage statistics
      await loadUsageStats();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  };

  // Handle entry quantity decrement
  const handleEntryDecrement = async (itemId: string) => {
    try {
      const item = items.find((i) => i.id === itemId);
      if (item && item.quantity > 1) {
        await foodItemsService.updateItem(itemId, {
          quantity: item.quantity - 1,
        });
        setItems((prevItems) =>
          prevItems.map((i) =>
            i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
          )
        );
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  // Handle entry quantity increment
  const handleEntryIncrement = async (itemId: string) => {
    try {
      const item = items.find((i) => i.id === itemId);
      if (item) {
        await foodItemsService.updateItem(itemId, {
          quantity: item.quantity + 1,
        });
        setItems((prevItems) =>
          prevItems.map((i) =>
            i.id === itemId ? { ...i, quantity: i.quantity + 1 } : i
          )
        );
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  // Handle use all for an item entry
  const handleEntryUseAll = async (itemId: string) => {
    try {
      const item = items.find((i) => i.id === itemId);
      if (item) {
        await foodItemsService.logUsage(itemId, "used", item.quantity);
        await loadItems(); // Reload items as the item should be removed
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  // Handle add more for a food item group
  const handleAddMore = (itemName: string) => {
    router.push({
      pathname: "/(tabs)/add",
      params: { name: itemName },
    });
  };

  // Handle edit for an item entry
  const handleEditEntry = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (item) {
      // Calculate days until expiry
      const expiryDate = item.expiry_date
        ? new Date(item.expiry_date)
        : new Date();
      const today = new Date();
      const diffTime = expiryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      setCurrentEditItem({
        id: itemId,
        groupName: item.name,
        name: item.name,
        quantity: item.quantity,
        daysUntilExpiry: diffDays,
        location: item.location as "fridge" | "shelf",
      });
      setEditModalVisible(true);
    }
  };

  // Handle delete for an item entry
  const handleDeleteEntry = (itemId: string) => {
    Alert.alert("Delete Item", "Are you sure you want to delete this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await foodItemsService.deleteItem(itemId);
            await loadItems(); // Reload items after deletion
          } catch (error: any) {
            Alert.alert("Error", error.message);
          }
        },
      },
    ]);
  };

  // Handle update from edit modal
  const handleUpdateItem = (updatedItemData: {
    name: string;
    quantity: number;
    daysUntilExpiry: number;
    location: string;
  }) => {
    if (currentEditItem) {
      const updateItem = async () => {
        try {
          const expiryDate = new Date();
          expiryDate.setDate(
            expiryDate.getDate() + updatedItemData.daysUntilExpiry
          );

          await foodItemsService.updateItem(currentEditItem.id, {
            name: updatedItemData.name,
            quantity: updatedItemData.quantity,
            expiry_date: expiryDate.toISOString(),
            location: updatedItemData.location as "fridge" | "shelf",
          });

          setEditModalVisible(false);
          await loadItems(); // Reload all items to reflect changes
        } catch (error: any) {
          Alert.alert("Error", error.message);
        }
      };

      updateItem();
    }
  };

  return (
    <SafeAreaWrapper usePadding edges={["top"]}>
      <View style={styles.container}>
        {/* Background gradient */}
        <LinearGradient
          colors={["#FFFFFF", "#FAFAFA"]}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Main content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Status summary with animated counters */}
          <View style={styles.statusTextContainer}>
            <AnimatedCounter
              value={expiringItems.length}
              style={styles.statusTextHighlight}
            />
            <EnhancedText style={styles.statusText}>
              {" "}
              items expiring soon,{" "}
            </EnhancedText>
            <AnimatedCounter
              value={lowStockGroups}
              style={styles.statusTextHighlight}
            />
            <EnhancedText style={styles.statusText}>
              {" "}
              groups low stock
            </EnhancedText>
          </View>

          {/* Search bar */}
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={18}
              color="#BBBBBB"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search your inventory.."
              placeholderTextColor="#BBBBBB"
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch}>
                <Ionicons name="close-circle" size={18} color="#BBBBBB" />
              </TouchableOpacity>
            )}
          </View>

          {/* Conditional rendering based on expiring items */}
          {expiringItems.length > 0 ? (
            // Urgent alert card with animated counter
            <View style={[styles.card, styles.urgentCard]}>
              <MaterialIcons
                name="warning"
                size={22}
                color="#FF3B30"
                style={styles.cardIcon}
              />
              <View style={styles.cardContent}>
                <EnhancedText style={styles.urgentCardTitle}>
                  Urgent: Items Expiring Soon
                </EnhancedText>
                <View style={styles.cardCountContainer}>
                  <AnimatedCounter
                    value={expiringItems.length}
                    style={styles.urgentCardSubtitle}
                  />
                  <EnhancedText style={styles.urgentCardSubtitle}>
                    {" items need immediate attention"}
                  </EnhancedText>
                </View>
              </View>
            </View>
          ) : (
            // Achievement card for no expiring items
            <AchievementCard
              title="All Clear!"
              message="No items are expiring soon. Great job managing your inventory!"
              iconName="check-circle"
              iconColor="#22C55E"
            />
          )}

          {/* Low stock alert card with animated counter */}
          <View style={[styles.card, styles.lowStockCard]}>
            <MaterialIcons
              name="inventory"
              size={22}
              color="#FF9500"
              style={styles.cardIcon}
            />
            <View style={styles.cardContent}>
              <EnhancedText style={styles.lowStockCardTitle}>
                Low Stock Alert
              </EnhancedText>
              <View style={styles.cardCountContainer}>
                <AnimatedCounter
                  value={lowStockGroups}
                  style={styles.lowStockCardSubtitle}
                />
                <EnhancedText style={styles.lowStockCardSubtitle}>
                  {" groups running low"}
                </EnhancedText>
              </View>
            </View>
          </View>

          {/* Tip card - conditionally render based on helpfulTips setting */}
          {helpfulTips && currentTip && <TipCard tip={currentTip} />}

          {/* Insights Carousel - replaces the static Expiring Soon card */}
          <InsightsCarousel
            expiringItems={expiringItems as FoodItem[]}
            wastePercentage={wastePercentage}
            mostConsumedCategory={mostConsumedCategory}
            onItemPress={handleItemPress}
          />

          {/* Location filter with animated counters */}
          <View style={styles.locationFilterContainer}>
            <Pressable
              style={[
                styles.locationButton,
                filter === "all" && styles.activeLocationButton,
              ]}
              onPress={() => setFilter("all")}
            >
              <Ionicons
                name="apps"
                size={18}
                color={filter === "all" ? "#333" : "#999"}
                style={styles.locationIcon}
              />
              <EnhancedText
                style={[
                  styles.locationText,
                  filter === "all" && styles.activeLocationText,
                ]}
              >
                All
              </EnhancedText>
            </Pressable>

            <Pressable
              style={[
                styles.locationButton,
                filter === "fridge" && styles.activeLocationButton,
              ]}
              onPress={() => setFilter("fridge")}
            >
              <Ionicons
                name="home"
                size={18}
                color={filter === "fridge" ? "#333" : "#999"}
                style={styles.locationIcon}
              />
              <View style={styles.locationTextContainer}>
                <EnhancedText
                  style={[
                    styles.locationText,
                    filter === "fridge" && styles.activeLocationText,
                  ]}
                >
                  Fridge (
                </EnhancedText>
                <AnimatedCounter
                  value={fridgeCount}
                  style={{
                    fontSize: 14,
                    color: filter === "fridge" ? "#333333" : "#A1A1AB",
                    fontWeight: filter === "fridge" ? "600" : "500",
                  }}
                />
                <EnhancedText
                  style={[
                    styles.locationText,
                    filter === "fridge" && styles.activeLocationText,
                  ]}
                >
                  )
                </EnhancedText>
              </View>
            </Pressable>

            <Pressable
              style={[
                styles.locationButton,
                filter === "shelf" && styles.activeLocationButton,
              ]}
              onPress={() => setFilter("shelf")}
            >
              <Ionicons
                name="cube"
                size={18}
                color={filter === "shelf" ? "#333" : "#999"}
                style={styles.locationIcon}
              />
              <View style={styles.locationTextContainer}>
                <EnhancedText
                  style={[
                    styles.locationText,
                    filter === "shelf" && styles.activeLocationText,
                  ]}
                >
                  Shelf (
                </EnhancedText>
                <AnimatedCounter
                  value={shelfCount}
                  style={{
                    fontSize: 14,
                    color: filter === "shelf" ? "#333333" : "#A1A1AB",
                    fontWeight: filter === "shelf" ? "600" : "500",
                  }}
                />
                <EnhancedText
                  style={[
                    styles.locationText,
                    filter === "shelf" && styles.activeLocationText,
                  ]}
                >
                  )
                </EnhancedText>
              </View>
            </Pressable>
          </View>

          {/* Inventory items section */}
          <View style={styles.inventorySection}>
            <EnhancedText style={styles.sectionTitle}>
              Your Inventory
            </EnhancedText>

            {loading ? (
              <EmptyStateView
                title=""
                message="Loading items..."
                isLoading={true}
              />
            ) : allItemGroups.length === 0 ? (
              <EmptyStateView
                title="No Items Found"
                message="Add some items to your inventory!"
                icon="cube-outline"
                actionLabel="Add Your First Item"
                onAction={() => router.push("/(tabs)/add")}
              />
            ) : !hasFilteredResults && searchText.trim() !== "" ? (
              <EmptyStateView
                title="No Matching Items"
                message={`No items found matching "${searchText}". Try adjusting your search or filters.`}
                icon="search"
                actionLabel="Clear Search"
                onAction={handleClearSearch}
                isFiltered={true}
                searchQuery={searchText}
              />
            ) : !hasFilteredResults ? (
              <EmptyStateView
                title={`No ${
                  filter === "shelf"
                    ? "Shelf"
                    : filter === "fridge"
                    ? "Fridge"
                    : ""
                } Items Found`}
                message={`You don't have any items in your ${
                  filter === "shelf"
                    ? "shelf"
                    : filter === "fridge"
                    ? "fridge"
                    : "inventory"
                }.`}
                icon="cube-outline"
                actionLabel={`Add ${
                  filter === "shelf"
                    ? "Shelf"
                    : filter === "fridge"
                    ? "Fridge"
                    : ""
                } Item`}
                onAction={() => router.push("/(tabs)/add")}
              />
            ) : (
              filteredGroups.map((group) => (
                <AnimatedItemGroupCard
                  key={group.name}
                  itemName={group.name}
                  entries={group.entries.map((entry) => ({
                    ...entry,
                    expiryStatus: entry.expiryStatus,
                  }))}
                  onDecrement={handleEntryDecrement}
                  onIncrement={handleEntryIncrement}
                  onUseAll={handleEntryUseAll}
                  onEditEntry={handleEditEntry}
                  onDeleteEntry={handleDeleteEntry}
                  onAddMore={() => handleAddMore(group.name)}
                  initialExpanded={true}
                  isNew={newItemGroups.has(group.name)}
                />
              ))
            )}
          </View>
        </ScrollView>

        {/* Add button (floating) - only show if there are items */}
        {filteredGroups.length > 0 && (
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={() => router.push("/(tabs)/add")}
            accessibilityLabel="Add new item"
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 90,
    paddingTop: 10, // Add some padding at the top for better spacing
  },
  statusTextContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 15,
  },
  statusText: {
    fontSize: 13,
    color: "#9BA4A9",
    fontWeight: "500",
  },
  statusTextHighlight: {
    fontSize: 13,
    color: "#22C55E",
    fontWeight: "700",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    height: 48,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#333333",
    fontWeight: "400",
  },
  card: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "transparent",
    borderWidth: 0,
    elevation: 0,
  },
  urgentCard: {
    backgroundColor: "#FEF2F2",
    paddingVertical: 18,
    borderLeftWidth: 4,
    borderLeftColor: "#FF3B30",
  },
  lowStockCard: {
    backgroundColor: "#FFF5EB",
    paddingVertical: 18,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9500",
  },
  tipCard: {
    backgroundColor: "#FFFBE5",
    paddingVertical: 18,
    borderLeftWidth: 4,
    borderLeftColor: "#FFCC00",
  },
  cardIcon: {
    width: 22,
    height: 22,
    marginRight: 14,
    marginTop: 2,
  },
  tipCardIcon: {
    width: 22,
    height: 22,
    marginRight: 14,
    marginTop: 2,
  },
  cardContent: {
    flex: 1,
  },
  urgentCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#CC6667",
    marginBottom: 4,
  },
  urgentCardSubtitle: {
    fontSize: 14,
    color: "#E88B8D",
    fontWeight: "500",
    opacity: 1,
  },
  lowStockCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#D17E59",
    marginBottom: 4,
  },
  lowStockCardSubtitle: {
    fontSize: 14,
    color: "#F0A076",
    fontWeight: "500",
    opacity: 1,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#BA9F7C",
    flex: 1,
    fontWeight: "600",
  },
  expiringContainer: {
    backgroundColor: "#FFF7ED",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    alignItems: "center",
    height: 140,
    justifyContent: "center",
  },
  expiringIconTop: {
    marginBottom: 8,
  },
  expiringCount: {
    fontSize: 48,
    fontWeight: "900",
    color: "#424753",
    marginVertical: 0,
    height: 60,
    textAlignVertical: "center",
  },
  expiringTitle: {
    fontSize: 13,
    color: "#9E9FA3",
    marginTop: 5,
    marginBottom: 10,
    fontWeight: "500",
  },
  dotContainer: {
    flexDirection: "row",
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EEEEEE",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#AAAAAA",
  },
  locationFilterContainer: {
    flexDirection: "row",
    marginBottom: 15,
    borderRadius: 8,
    overflow: "hidden",
  },
  locationButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: "#F8F8F8",
    marginHorizontal: 4,
    borderRadius: 8,
  },
  activeLocationButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  locationIcon: {
    marginRight: 8,
  },
  locationText: {
    fontSize: 14,
    color: "#A1A1AB",
    fontWeight: "500",
  },
  activeLocationText: {
    color: "#333333",
    fontWeight: "600",
  },
  inventorySection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 15,
  },
  emptyState: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    fontWeight: "500",
    marginTop: 16,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: "#22C55E",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
  },
  emptyStateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  floatingButton: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
    bottom: 30,
    right: 30,
    elevation: 10,
    shadowColor: "rgba(0,0,0,0.3)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 100,
  },
  foodIcon: {
    padding: 0,
    margin: 0,
  },
  cardCountContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationTextContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});
