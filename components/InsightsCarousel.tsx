import { FoodItem } from "@/lib/supabase";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");
const CARD_WIDTH = screenWidth - 40; // 20px padding on each side

interface InsightsCarouselProps {
  expiringItems: FoodItem[];
  wastePercentage?: number;
  mostConsumedCategory?: string;
  onItemPress?: (itemId: string) => void;
}

const InsightsCarousel: React.FC<InsightsCarouselProps> = ({
  expiringItems,
  wastePercentage = 0,
  mostConsumedCategory = "",
  onItemPress,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

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

  // Handle scroll events to update the current index
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const position = event.nativeEvent.contentOffset.x;
    const index = Math.round(position / CARD_WIDTH);
    setCurrentIndex(index);
  };

  // Calculate the total number of slides
  const totalSlides = expiringItems.length > 0 ? expiringItems.length + 2 : 1;

  // Generate slides based on data
  const renderSlides = () => {
    const slides = [];

    // If there are no expiring items, show an achievement slide
    if (expiringItems.length === 0) {
      slides.push(
        <View key="empty" style={styles.slide}>
          <View style={styles.achievementContainer}>
            <MaterialIcons
              name="check-circle"
              size={48}
              color="#22C55E"
              style={styles.achievementIcon}
            />
            <Text style={styles.achievementTitle}>All Clear!</Text>
            <Text style={styles.achievementText}>
              No items are expiring soon. Great job managing your inventory!
            </Text>
          </View>
        </View>
      );
      return slides;
    }

    // Add slides for each expiring item
    expiringItems.forEach((item, index) => {
      slides.push(
        <TouchableOpacity
          key={`item-${item.id}`}
          style={styles.slide}
          onPress={() => onItemPress && onItemPress(item.id)}
        >
          <View style={styles.expiryCard}>
            <MaterialIcons
              name={getItemIcon(item.name)}
              size={36}
              color="#666666"
              style={styles.itemIcon}
            />
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.expiryStatus}>
              {formatExpiryStatus(item.expiry_date)}
            </Text>
            <View style={styles.quantityContainer}>
              <Text style={styles.quantityText}>Quantity: {item.quantity}</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    });

    // Add a waste report slide
    slides.push(
      <View key="waste-report" style={styles.slide}>
        <View style={styles.wasteReportCard}>
          <MaterialIcons
            name="pie-chart"
            size={36}
            color="#666666"
            style={styles.itemIcon}
          />
          <Text style={styles.wasteReportTitle}>Weekly Waste Report</Text>
          <Text style={styles.wasteReportText}>
            You used {100 - wastePercentage}% of your items this week.
          </Text>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${100 - wastePercentage}%` },
              ]}
            />
          </View>
        </View>
      </View>
    );

    // Add a usage trends slide
    slides.push(
      <View key="usage-trends" style={styles.slide}>
        <View style={styles.trendCard}>
          <MaterialIcons
            name="trending-up"
            size={36}
            color="#666666"
            style={styles.itemIcon}
          />
          <Text style={styles.trendTitle}>Usage Trends</Text>
          <Text style={styles.trendText}>
            {mostConsumedCategory
              ? `You're using more ${mostConsumedCategory} than anything else this week.`
              : "Track your usage patterns over time."}
          </Text>
        </View>
      </View>
    );

    return slides;
  };

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false, listener: handleScroll }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollViewContent}
      >
        {renderSlides()}
      </Animated.ScrollView>

      {/* Pagination dots */}
      <View style={styles.paginationContainer}>
        {Array.from({ length: totalSlides }).map((_, index) => (
          <View
            key={`dot-${index}`}
            style={[
              styles.paginationDot,
              currentIndex === index && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  scrollViewContent: {
    alignItems: "center",
  },
  slide: {
    width: CARD_WIDTH,
    alignItems: "center",
    justifyContent: "center",
  },
  expiryCard: {
    backgroundColor: "#FFF7ED",
    borderRadius: 8,
    padding: 20,
    width: "100%",
    alignItems: "center",
    height: 180,
    justifyContent: "center",
  },
  wasteReportCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    padding: 20,
    width: "100%",
    alignItems: "center",
    height: 180,
    justifyContent: "center",
  },
  trendCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    padding: 20,
    width: "100%",
    alignItems: "center",
    height: 180,
    justifyContent: "center",
  },
  achievementContainer: {
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    padding: 20,
    width: "100%",
    alignItems: "center",
    height: 180,
    justifyContent: "center",
  },
  itemIcon: {
    marginBottom: 12,
  },
  achievementIcon: {
    marginBottom: 12,
  },
  itemName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#424753",
    marginBottom: 8,
    textAlign: "center",
  },
  expiryStatus: {
    fontSize: 16,
    color: "#9E9FA3",
    marginBottom: 12,
    fontWeight: "600",
  },
  quantityContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  quantityText: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "600",
  },
  achievementTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#22C55E",
    marginBottom: 8,
  },
  achievementText: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    fontWeight: "500",
    paddingHorizontal: 20,
  },
  wasteReportTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#424753",
    marginBottom: 8,
  },
  wasteReportText: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    fontWeight: "500",
    marginBottom: 12,
  },
  progressBarContainer: {
    width: "80%",
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#22C55E",
  },
  trendTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#424753",
    marginBottom: 8,
  },
  trendText: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    fontWeight: "500",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EEEEEE",
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: "#AAAAAA",
  },
});

export default InsightsCarousel;
