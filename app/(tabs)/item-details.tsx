import EditItemModal from "@/components/EditItemModal";
import ItemGroupCard from "@/components/ItemGroupCard";
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
      // For now, let's create mock data based on the ID
      if (typeof id === "string" && id.includes("chicken")) {
        setItemName("Chicken Breast");
        setLocation("fridge");

        // Create sample entries for chicken
        const mockEntries: ItemEntry[] = [
          {
            id: "1",
            quantity: 3,
            expiryDate: new Date(Date.now() + 2 * 86400000).toISOString(), // 2 days from now
            addedDate: new Date().toISOString(),
            isUseFirst: true,
          },
        ];

        setEntries(mockEntries);
      } else {
        // Default to milk for other IDs
        setItemName("Milk");
        setLocation("fridge");

        // Create sample entries
        const mockEntries: ItemEntry[] = [
          {
            id: "1",
            quantity: 3,
            expiryDate: new Date(Date.now() + 86400000).toISOString(), // tomorrow
            addedDate: new Date().toISOString(),
            isUseFirst: true,
          },
          {
            id: "2",
            quantity: 1,
            expiryDate: new Date(Date.now() + 3 * 86400000).toISOString(), // 3 days from now
            addedDate: new Date().toISOString(),
            isUseFirst: false,
          },
        ];

        setEntries(mockEntries);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMore = () => {
    router.push({
      pathname: "/(tabs)/add",
      params: { itemName },
    });
  };

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
    // Show confirmation dialog
    Alert.alert(
      "Use All",
      "Are you sure you want to remove all of this item?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Use All",
          onPress: () => {
            setEntries((prevEntries) =>
              prevEntries.filter((entry) => entry.id !== entryId)
            );
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleEntryOptions = (entryId: string) => {
    // Show options menu
    console.log("Entry options pressed for entry ID:", entryId);
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
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top > 0 ? 0 : 16 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{itemName}</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() =>
            router.push({
              pathname: "/(tabs)/add",
              params: { edit: "true", id },
            })
          }
        >
          <Ionicons name="pencil" size={20} color="#374151" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.locationInfo}>
          <Ionicons
            name={location === "fridge" ? "snow" : "cube"}
            size={16}
            color="#6B7280"
          />
          <Text style={styles.locationText}>
            Stored in {location === "fridge" ? "Fridge" : "Shelf"}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Item Entries</Text>

        {!loading && (
          <ItemGroupCard
            itemName={itemName}
            entries={entries}
            onAddMore={handleAddMore}
            onDecrement={handleDecrement}
            onIncrement={handleIncrement}
            onUseAll={handleUseAll}
            onEntryOptions={handleEntryOptions}
            onEditEntry={handleEditEntry}
            onDeleteEntry={handleDeleteEntry}
          />
        )}

        {entries.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No entries found for this item.
            </Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddMore}>
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.addButtonText}>Add New Entry</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Edit Item Modal */}
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
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    backgroundColor: "white",
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  locationText: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  emptyState: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#22C55E",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "white",
    marginLeft: 8,
  },
});
