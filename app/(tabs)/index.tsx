import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

import AnimatedItemGroupCard from "@/components/AnimatedItemGroupCard";
import DashboardSummary from "@/components/DashboardSummary";
import EditItemModal from "@/components/EditItemModal";
import EmptyStateView from "@/components/EmptyStateView";
import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import TipCard from "@/components/TipCard";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useTips } from "@/contexts/TipsContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { FoodItem } from "@/lib/supabase";
import { foodItemsService } from "@/services/foodItems";
import { formatExpiry } from "@/utils/formatExpiry";

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
  const { user, userProfile, getUserProfile } = useAuth();
  const { helpfulTips } = useSettings();
  const { currentTip, refreshTip } = useTips();

  // State for edit modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState<FoodItem | null>(null);

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

  // Extract first name from full name or email
  const getFirstName = () => {
    if (userProfile?.full_name) {
      // Extract first name from full name
      return userProfile.full_name.split(" ")[0];
    } else if (user?.email) {
      // Use the part before @ in email
      return user.email.split("@")[0];
    }
    return undefined;
  };

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadItems();
        // Fetch user profile if not available
        if (!userProfile) {
          getUserProfile();
        }

        // Refresh the tip when the screen comes into focus
        if (helpfulTips) {
          refreshTip();
        }
      } else {
        router.replace("/(auth)/login");
      }
    }, [user, filter, userProfile, helpfulTips])
  );

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
      setCurrentEditItem(item);
      setEditModalVisible(true);
    }
  };

  // Handle delete for an item entry
  const handleDeleteEntry = async (itemId: string) => {
    try {
      setLoading(true);
      await foodItemsService.deleteItem(itemId);
      await loadItems(); // Refresh the list
    } catch (error) {
      console.error("Failed to delete item:", error);
      Alert.alert("Error", "Failed to delete item.");
    } finally {
      setLoading(false);
      setEditModalVisible(false); // Close modal if open
      setCurrentEditItem(null);
    }
  };

  const handleUpdateItem = (updatedItemData: {
    name: string;
    quantity: number;
    expiryDate: string;
    location: string;
    category: string;
    notes: string;
  }) => {
    if (!currentEditItem) return;

    const updatePayload: Partial<FoodItem> = {
      ...updatedItemData,
      expiry_date: updatedItemData.expiryDate,
      location: updatedItemData.location as "fridge" | "shelf",
    };

    const updateItem = async () => {
      try {
        setLoading(true);
        const updated = await foodItemsService.updateItem(
          currentEditItem.id,
          updatePayload
        );
        if (updated) {
          // Invalidate and refetch
          loadItems();
        }
      } catch (error) {
        console.error("Failed to update item:", error);
        Alert.alert("Error", "Failed to update item.");
      } finally {
        setLoading(false);
        setEditModalVisible(false);
        setCurrentEditItem(null);
      }
    };
    updateItem();
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
          {/* Unified Dashboard Summary */}
          <DashboardSummary
            expiringItems={expiringItems as FoodItem[]}
            lowStockGroups={lowStockGroups}
            wastePercentage={wastePercentage}
            mostConsumedCategory={mostConsumedCategory}
            userName={getFirstName()}
            onItemPress={handleItemPress}
          />

          {/* Tip card - conditionally render based on helpfulTips setting */}
          {helpfulTips && currentTip && <TipCard tip={currentTip} />}

          {/* Inventory items section with integrated search and filters */}
          <View style={styles.inventorySection}>
            {/* Unified inventory header with title and search */}
            <View style={styles.inventoryHeaderContainer}>
              <View style={styles.inventoryHeader}>
                <Text style={styles.sectionTitle}>Your Inventory</Text>
              </View>

              {/* Search bar integrated with header */}
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
            </View>

            {/* Location filter buttons in a pill-style container */}
            <View style={styles.filtersContainer}>
              <View style={styles.locationFilterContainer}>
                <Pressable
                  style={[
                    styles.locationButton,
                    filter === "all" && styles.activeLocationButton,
                  ]}
                  onPress={() => setFilter("all")}
                >
                  <Text
                    style={[
                      styles.locationText,
                      filter === "all" && styles.activeLocationText,
                    ]}
                  >
                    All
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.locationButton,
                    filter === "fridge" && styles.activeLocationButton,
                  ]}
                  onPress={() => setFilter("fridge")}
                >
                  <Text
                    style={[
                      styles.locationText,
                      filter === "fridge" && styles.activeLocationText,
                    ]}
                  >
                    Fridge ({fridgeCount})
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.locationButton,
                    filter === "shelf" && styles.activeLocationButton,
                  ]}
                  onPress={() => setFilter("shelf")}
                >
                  <Text
                    style={[
                      styles.locationText,
                      filter === "shelf" && styles.activeLocationText,
                    ]}
                  >
                    Shelf ({shelfCount})
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Inventory items list */}
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
                message={`You don&apos;t have any items in your ${
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
                    expiryStatus: formatExpiry(entry.expiryDate),
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

        {currentEditItem && (
          <EditItemModal
            visible={editModalVisible}
            onClose={() => {
              setEditModalVisible(false);
              setCurrentEditItem(null);
            }}
            onUpdate={handleUpdateItem}
            onDelete={() => handleDeleteEntry(currentEditItem.id)}
            itemData={{
              ...currentEditItem,
              name: currentEditItem.name || "",
              quantity: currentEditItem.quantity || 0,
              expiryDate:
                currentEditItem.expiry_date || new Date().toISOString(),
              location: currentEditItem.location || "fridge",
              category: currentEditItem.category || "Other",
              notes: currentEditItem.notes || "",
            }}
          />
        )}

        {/* Remove the floating action button since we now have a center tab bar button */}
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
    paddingTop: 10,
  },
  inventorySection: {
    marginTop: 10,
  },
  inventoryHeaderContainer: {
    marginBottom: 12,
  },
  inventoryHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333333",
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
  filtersContainer: {
    marginBottom: 16,
  },
  locationFilterContainer: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    padding: 4,
  },
  locationButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeLocationButton: {
    backgroundColor: "#22C55E",
    shadowColor: "rgba(0,0,0,0.1)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  locationText: {
    fontSize: 13,
    color: "#A1A1AB",
    fontWeight: "500",
  },
  activeLocationText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
