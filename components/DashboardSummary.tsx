import { FoodItem } from "@/lib/supabase";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

function formatName(username: string): string {
  if (!username) return "";
  const match = username.match(/[A-Za-z]+/);
  const alphabetic = match ? match[0] : "";
  if (!alphabetic) return "";
  const lower = alphabetic.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

interface DashboardSummaryProps {
  expiringItems: FoodItem[];
  lowStockGroups: number;
  wastePercentage?: number;
  mostConsumedCategory?: string;
  userName?: string;
  onItemPress?: (itemId: string) => void;
}

/**
 * A unified dashboard component that provides a clear summary of the user's inventory status
 */
const DashboardSummary: React.FC<DashboardSummaryProps> = ({
  expiringItems,
  lowStockGroups,
  wastePercentage = 0,
  mostConsumedCategory = "",
  userName,
  onItemPress,
}) => {
  // Format expiry date into a readable string
  const formatExpiryStatus = (expiryDate: string | undefined) => {
    if (!expiryDate) return "No expiry date";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Expired";
    if (diffDays === 0) return "Expires Today";
    if (diffDays === 1) return "Expires Tomorrow";
    return `Expires in ${diffDays} days`;
  };

  // Get the appropriate icon for the item
  const getItemIcon = (itemName: string) => {
    const name = itemName.toLowerCase();

    if (
      name.includes("milk") ||
      name.includes("yogurt") ||
      name.includes("cheese")
    ) {
      return "local-drink";
    } else if (
      name.includes("meat") ||
      name.includes("chicken") ||
      name.includes("beef")
    ) {
      return "restaurant";
    } else if (
      name.includes("fruit") ||
      name.includes("apple") ||
      name.includes("banana")
    ) {
      return "eco";
    } else if (
      name.includes("vegetable") ||
      name.includes("carrot") ||
      name.includes("broccoli")
    ) {
      return "spa";
    } else {
      return "fastfood";
    }
  };

  // Determine which items need attention (expiring soon or low stock)
  const itemsNeedingAttention = [...expiringItems].slice(0, 3); // Take top 3 expiring items

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <View style={styles.container}>
      {/* Personalized greeting */}
      {userName && (
        <Text style={styles.greeting}>
          {getGreeting()}, {formatName(userName)}
        </Text>
      )}

      {/* Dashboard header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Here&apos;s your status</Text>
        <Text style={styles.headerSubtitle}>
          {expiringItems.length > 0 || lowStockGroups > 0
            ? "Items that need your attention"
            : "Everything looks good!"}
        </Text>
      </View>

      {/* Items needing attention */}
      {expiringItems.length > 0 || lowStockGroups > 0 ? (
        <View style={styles.attentionItems}>
          {itemsNeedingAttention.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.attentionItem}
              onPress={() => onItemPress && onItemPress(item.id)}
            >
              <MaterialIcons
                name={getItemIcon(item.name)}
                size={24}
                color="#666666"
                style={styles.itemIcon}
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.expiryStatus}>
                  {formatExpiryStatus(item.expiry_date)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#BBBBBB" />
            </TouchableOpacity>
          ))}

          {lowStockGroups > 0 && itemsNeedingAttention.length < 3 && (
            <View style={styles.attentionItem}>
              <MaterialIcons
                name="inventory"
                size={24}
                color="#FF9500"
                style={styles.itemIcon}
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>Low Stock Alert</Text>
                <Text style={styles.expiryStatus}>
                  {lowStockGroups} {lowStockGroups === 1 ? "group" : "groups"}{" "}
                  running low
                </Text>
              </View>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.allClearContainer}>
          <MaterialIcons
            name="check-circle"
            size={48}
            color="#22C55E"
            style={styles.achievementIcon}
          />
          <Text style={styles.achievementText}>
            No items need attention. Great job managing your inventory!
          </Text>
        </View>
      )}

      {/* Waste reduction stat */}
      <View style={styles.statContainer}>
        <View style={styles.statHeader}>
          <MaterialIcons name="pie-chart" size={20} color="#22C55E" />
          <Text style={styles.statTitle}>Food Waste Reduction</Text>
        </View>

        <View style={styles.statContent}>
          <Text style={styles.statValue}>{100 - wastePercentage}%</Text>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${100 - wastePercentage}%` },
              ]}
            />
          </View>
          <Text style={styles.statDescription}>
            of your items were used before expiring this week
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 16,
  },
  header: {
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666666",
  },
  attentionItems: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  attentionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  itemIcon: {
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 2,
  },
  expiryStatus: {
    fontSize: 13,
    color: "#666666",
  },
  allClearContainer: {
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  achievementIcon: {
    marginBottom: 12,
  },
  achievementText: {
    fontSize: 15,
    color: "#166534",
    textAlign: "center",
    lineHeight: 22,
  },
  statContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333333",
    marginLeft: 8,
  },
  statContent: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#22C55E",
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    width: "100%",
    marginBottom: 8,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#22C55E",
    borderRadius: 4,
  },
  statDescription: {
    fontSize: 13,
    color: "#666666",
    textAlign: "center",
  },
});

export default DashboardSummary;
