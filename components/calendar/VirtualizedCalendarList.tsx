// VirtualizedCalendarList - Advanced virtualization for large datasets
// Implements window-based rendering and efficient scrolling for calendar items

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { FoodItem } from "../../lib/supabase";
import {
  ScrollMetrics,
  VirtualizedCalendarListProps,
  VirtualizedItemData,
  VirtualWindow,
} from "../../types/calendar-enhanced";
import EmptyStateView from "../EmptyStateView";
import ItemEntryCard from "../ItemEntryCard";

// =============================================================================
// CONSTANTS
// =============================================================================

const ITEM_HEIGHT = 80; // Estimated height per item
const BUFFER_SIZE = 5; // Number of items to render outside visible area
const SCROLL_THROTTLE = 16; // ~60fps scroll updates

// =============================================================================
// VIRTUALIZATION MANAGER
// =============================================================================

class VirtualizationManager {
  private containerHeight: number = 0;
  private itemHeight: number = ITEM_HEIGHT;
  private totalItems: number = 0;
  private scrollOffset: number = 0;

  constructor(itemHeight: number = ITEM_HEIGHT) {
    this.itemHeight = itemHeight;
  }

  updateDimensions(containerHeight: number, totalItems: number): void {
    this.containerHeight = containerHeight;
    this.totalItems = totalItems;
  }

  updateScrollOffset(offset: number): void {
    this.scrollOffset = offset;
  }

  calculateVisibleWindow(): VirtualWindow {
    const visibleItemCount = Math.ceil(this.containerHeight / this.itemHeight);
    const startIndex = Math.floor(this.scrollOffset / this.itemHeight);

    // Add buffer items
    const bufferedStartIndex = Math.max(0, startIndex - BUFFER_SIZE);
    const bufferedEndIndex = Math.min(
      this.totalItems - 1,
      startIndex + visibleItemCount + BUFFER_SIZE
    );

    return {
      startIndex: bufferedStartIndex,
      endIndex: bufferedEndIndex,
      visibleStartIndex: startIndex,
      visibleEndIndex: startIndex + visibleItemCount,
      totalHeight: this.totalItems * this.itemHeight,
    };
  }

  getItemPosition(index: number): { top: number; height: number } {
    return {
      top: index * this.itemHeight,
      height: this.itemHeight,
    };
  }

  calculateScrollMetrics(): ScrollMetrics {
    const window = this.calculateVisibleWindow();
    const visibleRatio =
      (window.endIndex - window.startIndex + 1) / this.totalItems;

    return {
      scrollOffset: this.scrollOffset,
      visibleItemCount: window.endIndex - window.startIndex + 1,
      totalItemCount: this.totalItems,
      visibleRatio,
      isAtTop: this.scrollOffset <= 0,
      isAtBottom:
        this.scrollOffset >= window.totalHeight - this.containerHeight,
    };
  }
}

// =============================================================================
// VIRTUALIZED ITEM COMPONENT
// =============================================================================

interface VirtualizedItemProps {
  item: FoodItem;
  index: number;
  style: ViewStyle;
  onPress?: (item: FoodItem) => void;
  onEdit?: (item: FoodItem) => void;
  onDelete?: (item: FoodItem) => void;
  onMarkUsed?: (item: FoodItem) => void;
}

const VirtualizedItem: React.FC<VirtualizedItemProps> = memo(
  ({ item, index, style, onPress, onEdit, onDelete, onMarkUsed }) => {
    return (
      <View style={[styles.virtualizedItemContainer, style]}>
        <ItemEntryCard
          quantity={item.quantity}
          expiryDate={item.expiry_date}
          onDecrement={() => {}}
          onIncrement={() => {}}
          onUseAll={() => {}}
          onEditPress={onEdit ? () => onEdit(item) : undefined}
          onDeletePress={onDelete ? () => onDelete(item) : undefined}
          onOptionsPress={onPress ? () => onPress(item) : undefined}
        />
      </View>
    );
  }
);
VirtualizedItem.displayName = "VirtualizedItem";

// =============================================================================
// PLACEHOLDER COMPONENT
// =============================================================================

interface PlaceholderItemProps {
  height: number;
  index: number;
}

const PlaceholderItem: React.FC<PlaceholderItemProps> = memo(
  ({ height, index }) => {
    return (
      <View
        style={[styles.placeholderItem, { height }]}
        accessible={false}
        importantForAccessibility="no"
      >
        {/* Placeholder content for loading state */}
        <View style={styles.placeholderContent}>
          <View style={styles.placeholderImage} />
          <View style={styles.placeholderText}>
            <View style={styles.placeholderLine} />
            <View
              style={[styles.placeholderLine, styles.placeholderLineShort]}
            />
          </View>
        </View>
      </View>
    );
  }
);
PlaceholderItem.displayName = "PlaceholderItem";

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const VirtualizedCalendarList: React.FC<VirtualizedCalendarListProps> = ({
  items = [],
  itemHeight = ITEM_HEIGHT,
  bufferSize = BUFFER_SIZE,
  onItemPress,
  onItemEdit,
  onItemDelete,
  onItemMarkUsed,
  onScrollMetrics,
  renderPlaceholder = true,
  enableScrollIndicator = true,
  style,
  testID = "virtualized-calendar-list",
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const virtualizationManager = useRef(new VirtualizationManager(itemHeight));
  const lastScrollTime = useRef(0);

  const [containerHeight, setContainerHeight] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  // Update virtualization manager when items change
  useEffect(() => {
    virtualizationManager.current.updateDimensions(
      containerHeight,
      items.length
    );
  }, [containerHeight, items.length]);

  // Calculate virtual window
  const virtualWindow = useMemo(() => {
    virtualizationManager.current.updateScrollOffset(scrollOffset);
    return virtualizationManager.current.calculateVisibleWindow();
  }, [scrollOffset, containerHeight, items.length]);

  // Get visible items
  const visibleItems = useMemo((): VirtualizedItemData[] => {
    return items
      .slice(virtualWindow.startIndex, virtualWindow.endIndex + 1)
      .map((item, index) => {
        const absoluteIndex = virtualWindow.startIndex + index;
        const position =
          virtualizationManager.current.getItemPosition(absoluteIndex);

        return {
          item,
          index: absoluteIndex,
          key: `${item.id}-${absoluteIndex}`,
          style: {
            position: "absolute",
            top: position.top,
            left: 0,
            right: 0,
            height: position.height,
          },
        };
      });
  }, [items, virtualWindow]);

  // Handle container layout
  const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setContainerHeight(height);
  }, []);

  // Handle scroll with throttling
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const now = Date.now();
      if (now - lastScrollTime.current < SCROLL_THROTTLE) {
        return;
      }
      lastScrollTime.current = now;

      const { contentOffset } = event.nativeEvent;
      setScrollOffset(contentOffset.y);
      setIsScrolling(true);

      // Report scroll metrics
      if (onScrollMetrics) {
        const metrics = virtualizationManager.current.calculateScrollMetrics();
        onScrollMetrics(metrics);
      }
    },
    [onScrollMetrics]
  );

  // Handle scroll end
  const handleScrollEnd = useCallback(() => {
    setIsScrolling(false);
  }, []);

  // Scroll to item
  const scrollToItem = useCallback(
    (index: number, animated: boolean = true) => {
      const position = virtualizationManager.current.getItemPosition(index);
      scrollViewRef.current?.scrollTo({
        y: position.top,
        animated,
      });
    },
    []
  );

  // Scroll to top
  const scrollToTop = useCallback((animated: boolean = true) => {
    scrollViewRef.current?.scrollTo({
      y: 0,
      animated,
    });
  }, []);

  // Container styles
  const containerStyle = useMemo((): ViewStyle => {
    return {
      flex: 1,
      ...style,
    };
  }, [style]);

  // Content container style
  const contentContainerStyle = useMemo((): ViewStyle => {
    return {
      height: virtualWindow.totalHeight,
      position: "relative",
    };
  }, [virtualWindow.totalHeight]);

  // Render empty state
  if (items.length === 0) {
    return (
      <View style={containerStyle} testID={testID}>
        <EmptyStateView
          title="No Items"
          message="No food items found for the selected criteria."
          actionLabel="Add Item"
          onAction={() => console.log("Add item pressed")}
        />
      </View>
    );
  }

  return (
    <View
      style={containerStyle}
      onLayout={handleContainerLayout}
      testID={testID}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={contentContainerStyle}
        onScroll={handleScroll}
        onScrollEndDrag={handleScrollEnd}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={SCROLL_THROTTLE}
        showsVerticalScrollIndicator={enableScrollIndicator}
        removeClippedSubviews={true}
        accessible={true}
        accessibilityRole="list"
        accessibilityLabel={`Food items list with ${items.length} items`}
      >
        {/* Render visible items */}
        {visibleItems.map((virtualItem) => (
          <VirtualizedItem
            key={virtualItem.key}
            item={virtualItem.item}
            index={virtualItem.index}
            style={virtualItem.style}
            onPress={onItemPress}
            onEdit={onItemEdit}
            onDelete={onItemDelete}
            onMarkUsed={onItemMarkUsed}
          />
        ))}

        {/* Render placeholders during scrolling */}
        {renderPlaceholder && isScrolling && (
          <PlaceholderOverlay
            startIndex={virtualWindow.visibleStartIndex}
            endIndex={virtualWindow.visibleEndIndex}
            itemHeight={itemHeight}
            virtualizationManager={virtualizationManager.current}
          />
        )}
      </ScrollView>

      {/* Scroll indicators */}
      {enableScrollIndicator && (
        <ScrollIndicators
          scrollMetrics={virtualizationManager.current.calculateScrollMetrics()}
          onScrollToTop={scrollToTop}
          onScrollToItem={scrollToItem}
        />
      )}
    </View>
  );
};

// =============================================================================
// PLACEHOLDER OVERLAY
// =============================================================================

interface PlaceholderOverlayProps {
  startIndex: number;
  endIndex: number;
  itemHeight: number;
  virtualizationManager: VirtualizationManager;
}

const PlaceholderOverlay: React.FC<PlaceholderOverlayProps> = memo(
  ({ startIndex, endIndex, itemHeight, virtualizationManager }) => {
    const placeholders = useMemo(() => {
      const items = [];
      for (let i = startIndex; i <= endIndex; i++) {
        const position = virtualizationManager.getItemPosition(i);
        items.push(
          <PlaceholderItem
            key={`placeholder-${i}`}
            height={itemHeight}
            index={i}
          />
        );
      }
      return items;
    }, [startIndex, endIndex, itemHeight, virtualizationManager]);

    return <View style={styles.placeholderOverlay}>{placeholders}</View>;
  }
);
PlaceholderOverlay.displayName = "PlaceholderOverlay";

// =============================================================================
// SCROLL INDICATORS
// =============================================================================

interface ScrollIndicatorsProps {
  scrollMetrics: ScrollMetrics;
  onScrollToTop: () => void;
  onScrollToItem: (index: number) => void;
}

const ScrollIndicators: React.FC<ScrollIndicatorsProps> = memo(
  ({ scrollMetrics, onScrollToTop, onScrollToItem }) => {
    if (scrollMetrics.isAtTop && scrollMetrics.isAtBottom) {
      return null;
    }

    return (
      <View style={styles.scrollIndicators}>
        {!scrollMetrics.isAtTop && (
          <View
            style={styles.scrollToTop}
            onTouchEnd={onScrollToTop}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Scroll to top"
          >
            <Text style={styles.scrollArrow}>↑</Text>
          </View>
        )}

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              { height: `${scrollMetrics.visibleRatio * 100}%` },
            ]}
          />
        </View>
      </View>
    );
  }
);
ScrollIndicators.displayName = "ScrollIndicators";

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate optimal item height based on content
 */
export function calculateOptimalItemHeight(
  items: FoodItem[],
  containerWidth: number
): number {
  // Estimate based on content complexity
  const averageNameLength =
    items.reduce((acc, item) => acc + item.name.length, 0) / items.length;
  const baseHeight = 60;
  const heightPerCharacter = 0.5;

  return Math.max(
    baseHeight,
    baseHeight + averageNameLength * heightPerCharacter
  );
}

/**
 * Pre-calculate item positions for better performance
 */
export function precalculateItemPositions(
  itemCount: number,
  itemHeight: number
): Array<{ top: number; height: number }> {
  return Array.from({ length: itemCount }, (_, index) => ({
    top: index * itemHeight,
    height: itemHeight,
  }));
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  virtualizedItemContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  placeholderItem: {
    backgroundColor: "#F5F5F5",
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  placeholderContent: {
    flexDirection: "row",
    padding: 12,
    alignItems: "center",
  },
  placeholderImage: {
    width: 40,
    height: 40,
    backgroundColor: "#E0E0E0",
    borderRadius: 20,
    marginRight: 12,
  },
  placeholderText: {
    flex: 1,
  },
  placeholderLine: {
    height: 12,
    backgroundColor: "#E0E0E0",
    borderRadius: 6,
    marginBottom: 8,
  },
  placeholderLineShort: {
    width: "60%",
  },
  placeholderOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
  },
  scrollIndicators: {
    position: "absolute",
    right: 8,
    top: 20,
    bottom: 20,
    width: 30,
    alignItems: "center",
  },
  scrollToTop: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  scrollArrow: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold" as const,
  },
  progressContainer: {
    flex: 1,
    width: 4,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 2,
  },
});

// =============================================================================
// EXPORT
// =============================================================================

VirtualizedCalendarList.displayName = "VirtualizedCalendarList";

export default VirtualizedCalendarList;
export { PlaceholderItem, VirtualizationManager, VirtualizedItem };
