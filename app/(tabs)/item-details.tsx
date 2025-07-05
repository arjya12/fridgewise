import EditItemModal from "@/components/EditItemModal";
import ItemGroupCard from "@/components/ItemGroupCard";
import RealisticFoodImage from "@/components/RealisticFoodImage";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Helper function to format expiry date text
const getExpiryStatusText = (dateString: string): string => {
  const expiryDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Expired";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays <= 7) return `${diffDays} days`;

  return `${diffDays} days`;
};

type ItemEntry = {
  id: string;
  quantity: number;
  expiryDate?: string;
  addedDate: string;
  isUseFirst: boolean;
};

export default function ItemDetailsScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [itemName, setItemName] = useState("");
  const [location, setLocation] = useState("");
  const [entries, setEntries] = useState<ItemEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState<{
    id: string;
    name: string;
    quantity: number;
    daysUntilExpiry: number;
    location: string;
  } | null>(null);

  useEffect(() => {
    if (!id) {
      router.back();
      return;
    }

    loadItemDetails();
  }, [id]);

  const loadItemDetails = async () => {
    try {
      setLoading(true);
      // In a real app, this would fetch from your backend
      // For now, we'll show an empty state since this is a placeholder screen

      // TODO: Implement actual data loading from your backend/database
      // const itemData = await fetchItemDetails(id);
      // setItemName(itemData.name);
      // setLocation(itemData.location);
      // setEntries(itemData.entries);

      // For now, show empty state
      setItemName("Item");
      setLocation("fridge");
      setEntries([]);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handlers for entries
  const handleDecrement = (entryId: string) => {
    setEntries((prevEntries) =>
      prevEntries.map((entry) => {
        if (entry.id === entryId && entry.quantity > 1) {
          return { ...entry, quantity: entry.quantity - 1 };
        }
        return entry;
      })
    );
  };

  const handleIncrement = (entryId: string) => {
    setEntries((prevEntries) =>
      prevEntries.map((entry) => {
        if (entry.id === entryId) {
          return { ...entry, quantity: entry.quantity + 1 };
        }
        return entry;
      })
    );
  };

  const handleUseAll = (entryId: string) => {
    // Find the entry to be used
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;

    // Remove the entry
    setEntries((prevEntries) => prevEntries.filter((e) => e.id !== entryId));

    // Show confirmation
    Alert.alert(
      "Item Used",
      `You've used ${entry.quantity} ${
        entry.quantity > 1 ? "units" : "unit"
      } of ${itemName}`,
      [{ text: "OK" }]
    );
  };

  const handleEntryOptions = (entryId: string) => {
    // This is a placeholder for any additional options menu functionality
    console.log("Options for entry", entryId);
  };

  const handleEditEntry = (entryId: string) => {
    const entry = entries.find((entry) => entry.id === entryId);
    if (entry) {
      // Calculate days until expiry
      const expiryDate = entry.expiryDate
        ? new Date(entry.expiryDate)
        : new Date();
      const today = new Date();
      const diffTime = expiryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      setCurrentEditItem({
        id: entryId,
        name: itemName,
        quantity: entry.quantity,
        daysUntilExpiry: diffDays,
        location: location === "fridge" ? "Fridge" : "Shelf",
      });
      setEditModalVisible(true);
    }
  };

  const handleDeleteEntry = (entryId: string) => {
    Alert.alert("Delete Item", "Are you sure you want to delete this item?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        onPress: () => {
          // Remove the entry from our state
          setEntries((prevEntries) =>
            prevEntries.filter((entry) => entry.id !== entryId)
          );
          // Show confirmation
          Alert.alert("Success", "Item deleted successfully");
        },
        style: "destructive",
      },
    ]);
  };

  // Handle modal update
  const handleUpdateItem = (updatedItemData: {
    name: string;
    quantity: number;
    daysUntilExpiry: number;
    location: string;
  }) => {
    if (!currentEditItem) return;

    // Calculate new expiry date
    const today = new Date();
    const expiryDate = new Date(today);
    expiryDate.setDate(today.getDate() + updatedItemData.daysUntilExpiry);

    // Update item name if changed
    if (updatedItemData.name !== itemName) {
      setItemName(updatedItemData.name);
    }

    // Update location if changed
    const newLocation = updatedItemData.location.toLowerCase();
    if (newLocation !== location) {
      setLocation(newLocation);
    }

    // Update the entry
    setEntries((prevEntries) =>
      prevEntries.map((entry) => {
        if (entry.id === currentEditItem.id) {
          return {
            ...entry,
            quantity: updatedItemData.quantity,
            expiryDate: expiryDate.toISOString(),
          };
        }
        return entry;
      })
    );

    // Show success message
    Alert.alert("Success", "Item updated successfully");
  };

  // Handle modal delete
  const handleDeleteFromModal = () => {
    if (!currentEditItem) return;
    handleDeleteEntry(currentEditItem.id);
    setEditModalVisible(false);
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <View style={styles.titleWithIcon}>
            <RealisticFoodImage
              foodName={itemName}
              size={24}
              style={styles.foodIcon}
            />
            <Text style={styles.title}>{itemName}</Text>
          </View>
          <Text style={styles.subtitle}>
            {location === "fridge" ? "Refrigerator" : "Shelf"} •{" "}
            {entries.reduce((total, entry) => total + entry.quantity, 0)} total
            items
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {loading ? (
          <Text style={styles.loadingText}>Loading item details...</Text>
        ) : (
          <ItemGroupCard
            itemName={itemName}
            entries={entries.map((entry) => ({
              ...entry,
              expiryStatus: entry.expiryDate
                ? getExpiryStatusText(entry.expiryDate)
                : undefined,
            }))}
            onDecrement={handleDecrement}
            onIncrement={handleIncrement}
            onUseAll={handleUseAll}
            onAddMore={() => router.push(`/(tabs)/add`)}
            onEntryOptions={handleEntryOptions}
            onEditEntry={handleEditEntry}
            onDeleteEntry={handleDeleteEntry}
            initialExpanded={true}
          />
        )}
      </ScrollView>

      {/* Edit Modal */}
      {currentEditItem && (
        <EditItemModal
          visible={editModalVisible}
          onClose={() => setEditModalVisible(false)}
          onUpdate={handleUpdateItem}
          onDelete={handleDeleteFromModal}
          itemData={currentEditItem}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  titleContainer: {
    flex: 1,
  },
  titleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  foodIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 24,
  },
});
