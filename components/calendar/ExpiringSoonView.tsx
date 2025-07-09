import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useThemeColor } from "../../hooks/useThemeColor";
import { ExpiringSoonViewProps } from "../../types/calendar";
import { calculateExpiryStatus } from "../../utils/calendarEnhancedUtils";
import ItemCompactCard from "./ItemCompactCard";
import LoadingStateView from "./LoadingStateView";

const ExpiringSoonView: React.FC<ExpiringSoonViewProps> = ({
  items,
  onItemPress,
  onViewAll,
  loading = false,
}) => {
  const textColor = useThemeColor(
    { light: "#11181C", dark: "#ECEDEE" },
    "text"
  );
  const secondaryTextColor = useThemeColor(
    { light: "#687076", dark: "#9BA1A6" },
    "text"
  );
  const primaryColor = useThemeColor(
    { light: "#0a7ea4", dark: "#0a7ea4" },
    "tint"
  );

  const displayItems = items.slice(0, 5); // Show max 5 items
  const hasMoreItems = items.length > 5;

  const borderColor = useThemeColor(
    { light: "#E5E7EB", dark: "#374151" },
    "text"
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: textColor,
    },
    subtitle: {
      fontSize: 14,
      color: secondaryTextColor,
      marginTop: 2,
    },
    viewAllButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    viewAllText: {
      fontSize: 14,
      color: primaryColor,
      fontWeight: "500",
    },
    content: {
      flex: 1,
    },
    scrollContainer: {
      paddingVertical: 8,
    },
    footer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: borderColor,
    },
    footerText: {
      fontSize: 13,
      color: secondaryTextColor,
      textAlign: "center",
    },
    viewAllFooterButton: {
      backgroundColor: primaryColor,
      marginTop: 8,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 6,
      alignItems: "center",
    },
    viewAllFooterText: {
      fontSize: 14,
      color: "#FFFFFF",
      fontWeight: "500",
    },
  });

  if (loading) {
    return <LoadingStateView itemCount={3} />;
  }

  const getDaysText = () => {
    if (items.length === 0) return "No items expiring soon";
    if (items.length === 1) return "1 item expiring soon";
    return `${items.length} items expiring soon`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Expiring Soon</Text>
            <Text style={styles.subtitle}>{getDaysText()}</Text>
          </View>
          {hasMoreItems && onViewAll && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={onViewAll}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="View all expiring items"
              accessibilityHint="Shows complete list of expiring items"
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.content}>
        {displayItems.length > 0 ? (
          <ScrollView
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {displayItems.map((item) => {
              const expiryStatus = calculateExpiryStatus(item.expiry_date!);
              return (
                <ItemCompactCard
                  key={item.id}
                  item={item}
                  expiryStatus={expiryStatus.status}
                  onPress={onItemPress}
                />
              );
            })}
          </ScrollView>
        ) : (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingVertical: 48,
            }}
          >
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🎉</Text>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: textColor,
                marginBottom: 8,
              }}
            >
              All good!
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: secondaryTextColor,
                textAlign: "center",
              }}
            >
              No items expiring in the next 7 days
            </Text>
          </View>
        )}
      </View>

      {hasMoreItems && onViewAll && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Showing {displayItems.length} of {items.length} items
          </Text>
          <TouchableOpacity
            style={styles.viewAllFooterButton}
            onPress={onViewAll}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`View all ${items.length} expiring items`}
          >
            <Text style={styles.viewAllFooterText}>
              View All {items.length} Items
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default React.memo(ExpiringSoonView);
