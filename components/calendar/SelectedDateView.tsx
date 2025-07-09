import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useThemeColor } from "../../hooks/useThemeColor";
import { SelectedDateViewProps } from "../../types/calendar";
import {
  calculateExpiryStatus,
  formatDateForDisplay,
} from "../../utils/calendarEnhancedUtils";
import EmptyStateView from "./EmptyStateView";
import ItemDetailCard from "./ItemDetailCard";
import LoadingStateView from "./LoadingStateView";

const SelectedDateView: React.FC<SelectedDateViewProps> = ({
  selectedDate,
  items,
  onItemPress,
  onMarkUsed,
  onDelete,
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
    content: {
      flex: 1,
    },
    scrollContainer: {
      paddingVertical: 8,
    },
  });

  if (loading) {
    return <LoadingStateView itemCount={2} />;
  }

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{formatDateForDisplay(selectedDate)}</Text>
          <Text style={styles.subtitle}>No items expire on this date</Text>
        </View>
        <EmptyStateView type="no-items-on-date" selectedDate={selectedDate} />
      </View>
    );
  }

  const getItemCountText = () => {
    if (items.length === 1) return "1 item expires";
    return `${items.length} items expire`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{formatDateForDisplay(selectedDate)}</Text>
        <Text style={styles.subtitle}>{getItemCountText()}</Text>
      </View>

      <View style={styles.content}>
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
        >
          {items.map((item) => {
            const expiryStatus = calculateExpiryStatus(item.expiry_date!);
            return (
              <ItemDetailCard
                key={item.id}
                item={item}
                expiryStatus={expiryStatus.status}
                onPress={onItemPress}
                onMarkUsed={onMarkUsed}
                onDelete={onDelete}
                showActions={true}
                compact={false}
              />
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

export default React.memo(SelectedDateView);
