import React, { useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useThemeColor } from "../../hooks/useThemeColor";
import { ItemDetailCardProps } from "../../types/calendar";
import { getItemMetaText } from "../../utils/calendarEnhancedUtils";
import RealisticFoodImage from "../RealisticFoodImage";
import ActionButton from "./ActionButton";

const ItemDetailCard: React.FC<ItemDetailCardProps> = ({
  item,
  expiryStatus,
  onPress,
  onMarkUsed,
  onDelete,
  showActions = true,
  compact = false,
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const textColor = useThemeColor(
    { light: "#11181C", dark: "#ECEDEE" },
    "text"
  );
  const secondaryTextColor = useThemeColor(
    { light: "#687076", dark: "#9BA1A6" },
    "text"
  );
  const surfaceColor = useThemeColor(
    { light: "#FFFFFF", dark: "#1D1D1D" },
    "background"
  );
  const borderColor = useThemeColor(
    { light: "#E5E7EB", dark: "#374151" },
    "text"
  );

  const handlePressIn = () => {
    Animated.timing(scaleValue, {
      toValue: 0.98,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handleCardPress = () => {
    onPress(item);
  };

  const formatItemTitle = () => {
    if (item.quantity && item.quantity > 1) {
      return `${item.name} (${item.quantity})`;
    }
    return item.name;
  };

  const metaText = getItemMetaText(item);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: surfaceColor,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: borderColor,
      marginHorizontal: 16,
      marginVertical: 4,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    touchableContent: {
      padding: 16,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: showActions ? 12 : 0,
    },
    iconContainer: {
      width: compact ? 40 : 48,
      height: compact ? 40 : 48,
      marginRight: 12,
    },
    contentContainer: {
      flex: 1,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    itemTitle: {
      fontSize: compact ? 16 : 18,
      fontWeight: "600",
      color: textColor,
      flex: 1,
      marginRight: 8,
    },
    expiryBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: expiryStatus.color,
    },
    expiryText: {
      fontSize: 12,
      fontWeight: "500",
      color: "#FFFFFF",
    },
    metaText: {
      fontSize: 14,
      color: secondaryTextColor,
      marginTop: 2,
    },
    descriptionText: {
      fontSize: 14,
      color: textColor,
      marginTop: 4,
      lineHeight: 20,
    },
    actionContainer: {
      flexDirection: "row",
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: borderColor,
      gap: 8,
    },
    actionButton: {
      flex: 1,
    },
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleValue }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={handleCardPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={styles.touchableContent}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, expires ${expiryStatus.text}${
          metaText ? `, ${metaText}` : ""
        }`}
        accessibilityHint="Tap to view full item details"
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <RealisticFoodImage
              foodName={item.name}
              size={compact ? 40 : 48}
              location={item.location}
            />
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.itemTitle} numberOfLines={2}>
                {formatItemTitle()}
              </Text>
              <View style={styles.expiryBadge}>
                <Text style={styles.expiryText}>{expiryStatus.text}</Text>
              </View>
            </View>

            {metaText && (
              <Text style={styles.metaText} numberOfLines={1}>
                {metaText}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {showActions && (
        <View style={styles.actionContainer}>
          <View style={styles.actionButton}>
            <ActionButton
              type="used"
              onPress={() => onMarkUsed(item)}
              size="medium"
            />
          </View>
          <View style={styles.actionButton}>
            <ActionButton
              type="delete"
              onPress={() => onDelete(item)}
              size="medium"
            />
          </View>
        </View>
      )}
    </Animated.View>
  );
};

export default React.memo(ItemDetailCard);
