import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useThemeColor } from "../../hooks/useThemeColor";
import { EmptyStateViewProps } from "../../types/calendar";
import { formatDateForDisplay } from "../../utils/calendarEnhancedUtils";

const EmptyStateView: React.FC<EmptyStateViewProps> = ({
  type,
  selectedDate,
  onAddItem,
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

  const getContent = () => {
    if (type === "no-date-selected") {
      return {
        title: "Select a date",
        subtitle: "Tap on a calendar date to see items expiring that day",
        emoji: "📅",
        showAddButton: false,
      };
    } else {
      const dateDisplay = selectedDate
        ? formatDateForDisplay(selectedDate)
        : "this date";
      return {
        title: `No items expire ${dateDisplay.toLowerCase()}`,
        subtitle: "Great! Your food is lasting longer.",
        emoji: "✨",
        showAddButton: true,
        buttonText: "Add new item",
      };
    }
  };

  const content = getContent();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
      paddingVertical: 48,
    },
    emoji: {
      fontSize: 48,
      marginBottom: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: "600",
      color: textColor,
      textAlign: "center",
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: secondaryTextColor,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: content.showAddButton ? 24 : 0,
    },
    addButton: {
      backgroundColor: primaryColor,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      minHeight: 44,
      justifyContent: "center",
      alignItems: "center",
    },
    addButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "500",
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.emoji} accessibilityLabel="decorative emoji">
        {content.emoji}
      </Text>

      <Text style={styles.title}>{content.title}</Text>

      <Text style={styles.subtitle}>{content.subtitle}</Text>

      {content.showAddButton && onAddItem && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={onAddItem}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={content.buttonText}
          accessibilityHint="Navigates to add new item screen"
        >
          <Text style={styles.addButtonText}>{content.buttonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default React.memo(EmptyStateView);
