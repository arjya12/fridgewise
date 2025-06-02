import AppHeader from "@/components/AppHeader";
import EditItemModal from "@/components/EditItemModal";
import ItemGroupCard from "@/components/ItemGroupCard";
import React, { useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ItemEntry = {
  id: string;
  quantity: number;
  expiryDate?: string;
  isUseFirst?: boolean;
};

export default function DemoScreen() {
  const insets = useSafeAreaInsets();

  // Demo data
  const [chickenEntries, setChickenEntries] = useState<ItemEntry[]>([
    {
      id: "1",
      quantity: 3,
      expiryDate: new Date(Date.now() + 2 * 86400000).toISOString(), // 2 days from now
      isUseFirst: true,
    },
  ]);

  const [milkEntries, setMilkEntries] = useState<ItemEntry[]>([
    {
      id: "1",
      quantity: 2,
      expiryDate: new Date(Date.now() + 86400000).toISOString(), // tomorrow
      isUseFirst: true,
    },
    {
      id: "2",
      quantity: 1,
      expiryDate: new Date(Date.now() + 3 * 86400000).toISOString(), // 3 days from now
      isUseFirst: false,
    },
  ]);

  // State for edit modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState<{
    id: string;
    groupName: string;
    name: string;
    quantity: number;
    daysUntilExpiry: number;
    location: string;
  } | null>(null);

  // Handlers for chicken entries
  const handleChickenAddMore = () => {
    console.log("Add more chicken");
  };

  const handleChickenDecrement = (entryId: string) => {
    setChickenEntries((prevEntries) =>
      prevEntries.map((entry) => {
        if (entry.id === entryId && entry.quantity > 1) {
          return { ...entry, quantity: entry.quantity - 1 };
        }
        return entry;
      })
    );
  };

  const handleChickenIncrement = (entryId: string) => {
    setChickenEntries((prevEntries) =>
      prevEntries.map((entry) => {
        if (entry.id === entryId) {
          return { ...entry, quantity: entry.quantity + 1 };
        }
        return entry;
      })
    );
  };

  const handleChickenUseAll = (entryId: string) => {
    setChickenEntries((prevEntries) =>
      prevEntries.filter((entry) => entry.id !== entryId)
    );
  };

  const handleChickenOptions = (entryId: string) => {
    console.log("Chicken entry options", entryId);
  };

  const handleChickenEdit = (entryId: string) => {
    const entry = chickenEntries.find((entry) => entry.id === entryId);
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
        groupName: "chicken",
        name: "Chicken Breast",
        quantity: entry.quantity,
        daysUntilExpiry: diffDays,
        location: "Fridge", // Assuming fridge for demo
      });
      setEditModalVisible(true);
    }
  };

  const handleChickenDelete = (entryId: string) => {
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this chicken entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setChickenEntries((prevEntries) =>
              prevEntries.filter((entry) => entry.id !== entryId)
            );
          },
        },
      ]
    );
  };

  // Handlers for milk entries
  const handleMilkAddMore = () => {
    console.log("Add more milk");
  };

  const handleMilkDecrement = (entryId: string) => {
    setMilkEntries((prevEntries) =>
      prevEntries.map((entry) => {
        if (entry.id === entryId && entry.quantity > 1) {
          return { ...entry, quantity: entry.quantity - 1 };
        }
        return entry;
      })
    );
  };

  const handleMilkIncrement = (entryId: string) => {
    setMilkEntries((prevEntries) =>
      prevEntries.map((entry) => {
        if (entry.id === entryId) {
          return { ...entry, quantity: entry.quantity + 1 };
        }
        return entry;
      })
    );
  };

  const handleMilkUseAll = (entryId: string) => {
    setMilkEntries((prevEntries) =>
      prevEntries.filter((entry) => entry.id !== entryId)
    );
  };

  const handleMilkOptions = (entryId: string) => {
    console.log("Milk entry options", entryId);
  };

  const handleMilkEdit = (entryId: string) => {
    const entry = milkEntries.find((entry) => entry.id === entryId);
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
        groupName: "milk",
        name: "Milk",
        quantity: entry.quantity,
        daysUntilExpiry: diffDays,
        location: "Fridge", // Assuming fridge for demo
      });
      setEditModalVisible(true);
    }
  };

  const handleMilkDelete = (entryId: string) => {
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this milk entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setMilkEntries((prevEntries) =>
              prevEntries.filter((entry) => entry.id !== entryId)
            );
          },
        },
      ]
    );
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

    if (currentEditItem.groupName === "chicken") {
      setChickenEntries((prevEntries) =>
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
    } else if (currentEditItem.groupName === "milk") {
      setMilkEntries((prevEntries) =>
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
    }

    // Show success message
    Alert.alert("Success", "Item updated successfully");
  };

  // Handle modal delete
  const handleDeleteFromModal = () => {
    if (!currentEditItem) return;

    if (currentEditItem.groupName === "chicken") {
      handleChickenDelete(currentEditItem.id);
    } else if (currentEditItem.groupName === "milk") {
      handleMilkDelete(currentEditItem.id);
    }

    setEditModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="FridgeWise Demo" subtitle="Component Examples" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.sectionTitle}>Expandable Item Groups</Text>
        <Text style={styles.description}>
          Tap the arrow to expand or collapse each item group. Try the three-dot
          menu to edit or delete items.
        </Text>

        {/* Chicken item group */}
        <ItemGroupCard
          itemName="Chicken Breast"
          entries={chickenEntries}
          onAddMore={handleChickenAddMore}
          onDecrement={handleChickenDecrement}
          onIncrement={handleChickenIncrement}
          onUseAll={handleChickenUseAll}
          onEntryOptions={handleChickenOptions}
          onEditEntry={handleChickenEdit}
          onDeleteEntry={handleChickenDelete}
          initialExpanded={true}
        />

        {/* Milk item group */}
        <ItemGroupCard
          itemName="Milk"
          entries={milkEntries}
          onAddMore={handleMilkAddMore}
          onDecrement={handleMilkDecrement}
          onIncrement={handleMilkIncrement}
          onUseAll={handleMilkUseAll}
          onEntryOptions={handleMilkOptions}
          onEditEntry={handleMilkEdit}
          onDeleteEntry={handleMilkDelete}
        />
      </ScrollView>

      {/* Edit Item Modal */}
      {currentEditItem && (
        <EditItemModal
          visible={editModalVisible}
          onClose={() => setEditModalVisible(false)}
          onUpdate={handleUpdateItem}
          onDelete={handleDeleteFromModal}
          itemData={{
            name: currentEditItem.name,
            quantity: currentEditItem.quantity,
            daysUntilExpiry: currentEditItem.daysUntilExpiry,
            location: currentEditItem.location,
          }}
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
  },
});
