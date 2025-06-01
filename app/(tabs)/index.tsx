// app/(tabs)/index.tsx
import AppHeader from "@/components/AppHeader";
import EditItemModal from "@/components/EditItemModal";
import ItemGroupCard from "@/components/ItemGroupCard";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { FoodItem } from "@/lib/supabase";
import { foodItemsService } from "@/services/foodItems";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
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

const { width, height } = Dimensions.get("window");

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

export default function InventoryScreen() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [itemGroups, setItemGroups] = useState<ItemGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "fridge" | "shelf">("fridge");
  const [searchText, setSearchText] = useState("");
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { user } = useAuth();

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

  // Calculate counts
  const fridgeCount = items.filter((item) => item.location === "fridge").length;
  const shelfCount = items.filter((item) => item.location === "shelf").length;

  // Calculate expiring items
  const today = new Date();
  const expiringItems = items.filter((item) => {
    if (!item.expiry_date) return false;
    const expiryDate = new Date(item.expiry_date);
    const daysUntilExpiry = Math.floor(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 3 && daysUntilExpiry >= 0;
  });

  // Calculate low stock groups (for demo purposes, just count items with quantity <= 2)
  const lowStockGroups = items.filter((item) => item.quantity <= 2).length;

  useEffect(() => {
    if (!user) {
      router.replace("/(auth)/login");
      return;
    }
    loadItems();
  }, [user, filter]);

  // Group items by name whenever items change
  useEffect(() => {
    const groupedItems: { [key: string]: ItemEntry[] } = {};

    items.forEach((item) => {
      if (!groupedItems[item.name]) {
        groupedItems[item.name] = [];
      }

      // Calculate days until expiry for each item
      let daysUntilExpiry: number | undefined;
      let isUseFirst = false;
      let expiryStatus: string | undefined;

      if (item.expiry_date) {
        const expiryDate = new Date(item.expiry_date);
        daysUntilExpiry = Math.floor(
          (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Set isUseFirst flag for items expiring within 3 days
        isUseFirst = daysUntilExpiry <= 3 && daysUntilExpiry >= 0;

        // Format expiry status for display
        if (daysUntilExpiry < 0) {
          expiryStatus = "Expired";
        } else if (daysUntilExpiry === 0) {
          expiryStatus = "Today";
        } else if (daysUntilExpiry === 1) {
          expiryStatus = "Tomorrow";
        } else if (daysUntilExpiry <= 7) {
          expiryStatus = `${daysUntilExpiry} days`;
        }
      }

      groupedItems[item.name].push({
        id: item.id,
        quantity: item.quantity,
        expiryDate: item.expiry_date,
        isUseFirst: isUseFirst,
        daysUntilExpiry: daysUntilExpiry,
        expiryStatus: expiryStatus,
      });
    });

    // Sort entries within each group by expiry date (earliest first)
    Object.keys(groupedItems).forEach((name) => {
      groupedItems[name].sort((a, b) => {
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        return (
          new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
        );
      });

      // Mark only the earliest expiring item as "Use First"
      if (groupedItems[name].length > 0) {
        // Reset all to false first
        groupedItems[name].forEach((entry) => {
          entry.isUseFirst = false;
        });

        // Find the earliest expiring item that is not yet expired
        const earliestValidEntry = groupedItems[name].find(
          (entry) =>
            entry.daysUntilExpiry !== undefined && entry.daysUntilExpiry >= 0
        );

        if (earliestValidEntry) {
          earliestValidEntry.isUseFirst = true;
        }
      }
    });

    const groups: ItemGroup[] = Object.keys(groupedItems).map((name) => ({
      name,
      entries: groupedItems[name],
    }));

    setItemGroups(groups);
  }, [items]);

  const loadItems = async () => {
    try {
      const location = filter === "all" ? undefined : filter;
      const data = await foodItemsService.getItems(location);
      setItems(data);
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
      params: { itemName },
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
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={["#FFFFFF", "#FAFAFA"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <AppHeader />

      {/* Main content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Status summary */}
        <EnhancedText style={styles.statusText}>
          {expiringItems.length} items expiring soon, {lowStockGroups} groups
          low stock
        </EnhancedText>

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
        </View>

        {/* Urgent alert card */}
        <View style={[styles.card, styles.urgentCard]}>
          <Image
            source={require("./../../assets/images/figma/warning_icon.png")}
            style={styles.cardIcon}
            resizeMode="contain"
          />
          <View style={styles.cardContent}>
            <EnhancedText style={styles.urgentCardTitle}>
              Urgent: Items Expiring Soon
            </EnhancedText>
            <EnhancedText style={styles.urgentCardSubtitle}>
              {expiringItems.length} items need immediate attention
            </EnhancedText>
          </View>
        </View>

        {/* Low stock alert card */}
        <View style={[styles.card, styles.lowStockCard]}>
          <Image
            source={require("./../../assets/images/figma/inventory_icon.png")}
            style={styles.cardIcon}
            resizeMode="contain"
          />
          <View style={styles.cardContent}>
            <EnhancedText style={styles.lowStockCardTitle}>
              Low Stock Alert
            </EnhancedText>
            <EnhancedText style={styles.lowStockCardSubtitle}>
              {lowStockGroups} groups running low
            </EnhancedText>
          </View>
        </View>

        {/* Tip card */}
        <View style={[styles.card, styles.tipCard]}>
          <Image
            source={require("./../../assets/images/figma/bulb_icon.png")}
            style={styles.tipCardIcon}
            resizeMode="contain"
          />
          <EnhancedText style={styles.tipText}>
            Store bananas separately to prevent other fruits from ripening too
            quickly
          </EnhancedText>
        </View>

        {/* Expiring soon section */}
        <View style={styles.expiringContainer}>
          <MaterialIcons
            name="bar-chart"
            size={22}
            color="#666666"
            style={styles.expiringIconTop}
          />
          <NumberText style={styles.expiringCount}>
            {expiringItems.length}
          </NumberText>
          <EnhancedText style={styles.expiringTitle}>
            Expiring Soon
          </EnhancedText>
          <View style={styles.dotContainer}>
            <View style={styles.dot} />
            <View style={[styles.dot, styles.activeDot]} />
            <View style={styles.dot} />
          </View>
        </View>

        {/* Location filter */}
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
            <EnhancedText
              style={[
                styles.locationText,
                filter === "fridge" && styles.activeLocationText,
              ]}
            >
              Fridge ({fridgeCount})
            </EnhancedText>
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
            <EnhancedText
              style={[
                styles.locationText,
                filter === "shelf" && styles.activeLocationText,
              ]}
            >
              Shelf ({shelfCount})
            </EnhancedText>
          </Pressable>
        </View>

        {/* Inventory items using ItemGroupCard components */}
        <View style={styles.inventorySection}>
          <EnhancedText style={styles.sectionTitle}>
            Your Inventory
          </EnhancedText>

          {loading ? (
            <View style={styles.emptyState}>
              <EnhancedText style={styles.emptyStateText}>
                Loading items...
              </EnhancedText>
            </View>
          ) : itemGroups.length === 0 ? (
            <View style={styles.emptyState}>
              <EnhancedText style={styles.emptyStateText}>
                No items found. Add some items to your inventory!
              </EnhancedText>
            </View>
          ) : (
            itemGroups
              .filter((group) =>
                group.name.toLowerCase().includes(searchText.toLowerCase())
              )
              .map((group) => (
                <ItemGroupCard
                  key={group.name}
                  itemName={group.name}
                  entries={group.entries.map((entry) => ({
                    ...entry,
                    expiryStatus: entry.expiryStatus,
                  }))}
                  onAddMore={() => handleAddMore(group.name)}
                  onDecrement={handleEntryDecrement}
                  onIncrement={handleEntryIncrement}
                  onUseAll={handleEntryUseAll}
                  onEditEntry={handleEditEntry}
                  onDeleteEntry={handleDeleteEntry}
                  initialExpanded={true}
                />
              ))
          )}
        </View>
      </ScrollView>

      {/* Add button (floating) */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => router.push("/(tabs)/add")}
        accessibilityLabel="Add new item"
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Edit Item Modal */}
      {currentEditItem && (
        <EditItemModal
          visible={editModalVisible}
          onClose={() => setEditModalVisible(false)}
          itemData={{
            name: currentEditItem.name,
            quantity: currentEditItem.quantity,
            daysUntilExpiry: currentEditItem.daysUntilExpiry,
            location: currentEditItem.location,
          }}
          onUpdate={handleUpdateItem}
          onDelete={() => {
            setEditModalVisible(false);
            if (currentEditItem) {
              handleDeleteEntry(currentEditItem.id);
            }
          }}
        />
      )}
    </View>
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
  },
  statusText: {
    fontSize: 13,
    color: "#9BA4A9",
    textAlign: "center",
    marginVertical: 15,
    fontWeight: "500",
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
  },
  emptyStateText: {
    fontSize: 15,
    color: "#666666",
    textAlign: "center",
    fontWeight: "500",
  },
  floatingButton: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
    bottom: 80,
    alignSelf: "center",
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
});
