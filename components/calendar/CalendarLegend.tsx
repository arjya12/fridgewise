import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useThemeColor } from "../../hooks/useThemeColor";
import { CalendarLegendProps, LegendItem } from "../../types/calendar";
import { EXPIRY_COLORS } from "../../utils/calendarEnhancedUtils";

const CalendarLegend: React.FC<CalendarLegendProps> = ({
  compact = false,
  style,
}) => {
  const textColor = useThemeColor(
    { light: "#687076", dark: "#9BA1A6" },
    "text"
  );

  const legendItems: LegendItem[] = [
    {
      color: EXPIRY_COLORS.expired,
      label: compact ? "Expired" : "Red: Expired",
      key: "expired",
    },
    {
      color: EXPIRY_COLORS.today,
      label: compact ? "Today" : "Orange: Today",
      key: "today",
    },
    {
      color: EXPIRY_COLORS.soon,
      label: compact ? "Future" : "Green: Future expiry",
      key: "future",
    },
  ];

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 16,
      paddingVertical: compact ? 6 : 8,
      backgroundColor: "transparent",
      minHeight: compact ? 24 : 32,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 4,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },
    label: {
      fontSize: compact ? 12 : 14,
      color: textColor,
      fontWeight: "400",
    },
    spacer: {
      width: 12,
    },
  });

  return (
    <View style={[styles.container, style]}>
      {legendItems.map((item, index) => (
        <React.Fragment key={item.key}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <Text style={styles.label}>{item.label}</Text>
          </View>
          {!compact && index < legendItems.length - 1 && (
            <View style={styles.spacer} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
};

export default CalendarLegend;
