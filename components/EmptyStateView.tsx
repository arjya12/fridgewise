import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

interface EmptyStateViewProps {
  title: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  iconColor?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
  isLoading?: boolean;
  isFiltered?: boolean;
  searchQuery?: string;
}

/**
 * A component to display empty state messages with an icon and optional action button
 */
const EmptyStateView: React.FC<EmptyStateViewProps> = ({
  title,
  message,
  icon = "cube-outline",
  iconSize = 48,
  iconColor = "#BBBBBB",
  actionLabel,
  onAction,
  style,
  isLoading = false,
  isFiltered = false,
  searchQuery = "",
}) => {
  // If loading, show a loading message
  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.message}>Loading items...</Text>
      </View>
    );
  }

  // If filtered with no results, show a filtered empty state
  if (isFiltered && searchQuery) {
    return (
      <View style={[styles.container, style]}>
        <Ionicons name="search" size={iconSize} color={iconColor} />
        <Text style={styles.title}>No matching items</Text>
        <Text style={styles.message}>
          No items found matching "{searchQuery}". Try adjusting your search or
          filters.
        </Text>
        {onAction && actionLabel && (
          <TouchableOpacity style={styles.actionButton} onPress={onAction}>
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>{actionLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Default empty state
  return (
    <View style={[styles.container, style]}>
      <Ionicons name={icon} size={iconSize} color={iconColor} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onAction && actionLabel && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666666",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    fontWeight: "500",
    marginBottom: 24,
    lineHeight: 22,
  },
  actionButton: {
    backgroundColor: "#22C55E",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default EmptyStateView;
