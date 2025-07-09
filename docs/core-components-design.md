# Core Components Design Specification

## Overview

This document provides detailed design specifications for the core components that comprise the enhanced Expiry Calendar feature. Each component is designed to be reusable, accessible, and performant.

## Component Hierarchy

```
ExpiryCalendar
├── InformationPanel
│   ├── ExpiringSoonView
│   │   ├── ExpiringSoonHeader
│   │   ├── ItemCompactCard (multiple)
│   │   └── ViewAllLink
│   ├── SelectedDateView
│   │   ├── SelectedDateHeader
│   │   └── ItemDetailCard (multiple)
│   └── EmptyStateView
├── CalendarLegend
└── Calendar (react-native-calendars)
```

## 1. InformationPanel Component

### Purpose

Container component that manages the display of different states (default, selected date, empty) with smooth transitions between states.

### Interface

```typescript
interface InformationPanelProps {
  state: "default" | "selected" | "empty";
  selectedDate?: string;
  expiringSoonItems: FoodItem[];
  selectedDateItems: FoodItem[];
  loading?: boolean;
  onItemPress: (item: FoodItem) => void;
  onMarkUsed: (item: FoodItem) => void;
  onDelete: (item: FoodItem) => void;
  onViewAll?: () => void;
  onAddItem?: () => void;
}

interface InformationPanelState {
  animatedValue: Animated.Value;
  previousState: "default" | "selected" | "empty" | null;
}
```

### Implementation Design

```typescript
const InformationPanel: React.FC<InformationPanelProps> = ({
  state,
  selectedDate,
  expiringSoonItems,
  selectedDateItems,
  loading = false,
  onItemPress,
  onMarkUsed,
  onDelete,
  onViewAll,
  onAddItem,
}) => {
  const [animatedValue] = useState(new Animated.Value(1));
  const [displayState, setDisplayState] = useState(state);

  // Animate state transitions
  useEffect(() => {
    if (state !== displayState) {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setDisplayState(state);
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [state, displayState, animatedValue]);

  const renderContent = () => {
    if (loading) {
      return <LoadingStateView />;
    }

    switch (displayState) {
      case "default":
        return (
          <ExpiringSoonView
            items={expiringSoonItems}
            onItemPress={onItemPress}
            onViewAll={onViewAll}
          />
        );
      case "selected":
        return (
          <SelectedDateView
            selectedDate={selectedDate!}
            items={selectedDateItems}
            onItemPress={onItemPress}
            onMarkUsed={onMarkUsed}
            onDelete={onDelete}
          />
        );
      case "empty":
        return (
          <EmptyStateView
            type={selectedDate ? "no-items-on-date" : "no-date-selected"}
            selectedDate={selectedDate}
            onAddItem={onAddItem}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: animatedValue,
          transform: [
            {
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            },
          ],
        },
      ]}
    >
      {renderContent()}
    </Animated.View>
  );
};
```

### Styling

```typescript
const styles = StyleSheet.create({
  container: {
    flex: 0.4,
    backgroundColor: "transparent",
    minHeight: 200,
    maxHeight: 350,
  },
});
```

## 2. ItemDetailCard Component

### Purpose

Displays detailed information about a food item with action buttons for user interactions. Used in the selected date view.

### Interface

```typescript
interface ItemDetailCardProps {
  item: FoodItem;
  expiryStatus: ExpiryStatus;
  onPress: (item: FoodItem) => void;
  onMarkUsed: (item: FoodItem) => void;
  onDelete: (item: FoodItem) => void;
  showActions?: boolean;
  compact?: boolean;
}

interface ExpiryStatus {
  days: number;
  text: string;
  color: string;
  urgency: "expired" | "today" | "tomorrow" | "soon" | "fresh";
}
```

### Visual Design

```
┌─────────────────────────────────────┐
│ [🥛] Milk (2 bottles)           [✓] │ ← Header row: 40pt icon, title, badge
│ 40×40   16pt bold           12pt    │
│      Fridge • Added 3 days ago      │ ← Meta row: 14pt secondary
│      ┌─────────┐ ┌──────────────┐   │ ← Actions row: 32pt height
│      │ ✓ Used  │ │ 🗑️ Delete   │   │
│      └─────────┘ └──────────────┘   │
└─────────────────────────────────────┘
```

### Implementation Design

```typescript
const ItemDetailCard: React.FC<ItemDetailCardProps> = ({
  item,
  expiryStatus,
  onPress,
  onMarkUsed,
  onDelete,
  showActions = true,
  compact = false,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    onPress(item);
  };

  const handleMarkUsed = () => {
    // Haptic feedback
    HapticFeedback.impactAsync(HapticFeedback.ImpactFeedbackStyle.Medium);
    onMarkUsed(item);
  };

  const handleDelete = () => {
    // Show confirmation for non-expired items
    if (expiryStatus.urgency !== "expired") {
      Alert.alert(
        "Delete Item?",
        `This item hasn't expired yet. Are you sure you want to delete it?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => onDelete(item),
          },
        ]
      );
    } else {
      onDelete(item);
    }
  };

  const formatMetaText = () => {
    const parts = [];

    if (item.location) {
      parts.push(item.location === "fridge" ? "Fridge" : "Shelf");
    }

    if (item.created_at) {
      const daysAgo = Math.floor(
        (Date.now() - new Date(item.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      if (daysAgo < 30) {
        parts.push(`Added ${daysAgo === 0 ? "today" : `${daysAgo} days ago`}`);
      }
    }

    return parts.join(" • ");
  };

  return (
    <Animated.View
      style={[
        styles.container,
        compact && styles.compactContainer,
        { transform: [{ scale: scaleValue }] },
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, quantity ${item.quantity}, expires ${expiryStatus.text}`}
      >
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.iconContainer}>
            <RealisticFoodImage
              category={item.category || "other"}
              size={compact ? 32 : 40}
            />
          </View>

          <View style={styles.contentContainer}>
            <Text
              style={[styles.itemTitle, compact && styles.compactItemTitle]}
            >
              {item.name}
              {item.quantity > 1 && (
                <Text style={styles.quantityText}> ({item.quantity})</Text>
              )}
            </Text>

            {!compact && (
              <Text style={styles.metaText}>{formatMetaText()}</Text>
            )}
          </View>

          <View
            style={[
              styles.badgeContainer,
              { backgroundColor: expiryStatus.color },
            ]}
          >
            <Text style={styles.badgeText}>{expiryStatus.text}</Text>
          </View>
        </View>

        {/* Actions Row */}
        {showActions && !compact && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.usedButton}
              onPress={handleMarkUsed}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Mark ${item.name} as used`}
            >
              <Ionicons name="checkmark" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Used</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${item.name}`}
            >
              <Ionicons name="trash" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};
```

### Styling

```typescript
const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f8f9fa",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    minHeight: 88,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  compactContainer: {
    marginHorizontal: 0,
    marginBottom: 8,
    padding: 12,
    minHeight: 44,
    backgroundColor: "transparent",
    shadowOpacity: 0,
    elevation: 0,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  iconContainer: {
    width: 40,
    height: 40,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#11181C",
    marginBottom: 4,
  },
  compactItemTitle: {
    fontSize: 16,
    marginBottom: 0,
  },
  quantityText: {
    fontWeight: "400",
    color: "#687076",
  },
  metaText: {
    fontSize: 14,
    color: "#687076",
  },
  badgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 12,
    marginTop: 12,
  },
  usedButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#0a7ea4",
    borderRadius: 8,
    minWidth: 80,
    minHeight: 32,
    justifyContent: "center",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FF3B30",
    borderRadius: 8,
    minWidth: 100,
    minHeight: 32,
    justifyContent: "center",
  },
  buttonIcon: {
    marginRight: 4,
    fontSize: 14,
    color: "#FFFFFF",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
  },
});
```

## 3. CalendarLegend Component

### Purpose

Small, unobtrusive component that explains the meaning of colored dots on the calendar.

### Interface

```typescript
interface CalendarLegendProps {
  compact?: boolean;
  style?: ViewStyle;
}

interface LegendItem {
  color: string;
  label: string;
  key: string;
}
```

### Visual Design

```
┌─────────────────────────────────────┐
│ ● Red: Expired  ● Orange: Today     │ ← Full version
│ ● Green: Future expiry              │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ● Expired  ● Today  ● Future        │ ← Compact version
└─────────────────────────────────────┘
```

### Implementation Design

```typescript
const CalendarLegend: React.FC<CalendarLegendProps> = ({
  compact = false,
  style,
}) => {
  const legendItems: LegendItem[] = [
    {
      color: "#FF3B30",
      label: compact ? "Expired" : "Red: Expired",
      key: "expired",
    },
    {
      color: "#FF9500",
      label: compact ? "Today" : "Orange: Today",
      key: "today",
    },
    {
      color: "#34C759",
      label: compact ? "Future" : "Green: Future expiry",
      key: "future",
    },
  ];

  return (
    <View style={[styles.container, compact && styles.compactContainer, style]}>
      {legendItems.map((item, index) => (
        <View key={item.key} style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: item.color }]} />
          <Text style={[styles.label, compact && styles.compactLabel]}>
            {item.label}
          </Text>
          {!compact && index < legendItems.length - 1 && (
            <View style={styles.spacer} />
          )}
        </View>
      ))}
    </View>
  );
};
```

### Styling

```typescript
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "transparent",
    minHeight: 32,
  },
  compactContainer: {
    paddingVertical: 6,
    minHeight: 24,
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
    fontSize: 14,
    color: "#687076",
    fontWeight: "400",
  },
  compactLabel: {
    fontSize: 12,
  },
  spacer: {
    width: 12,
  },
});
```

## 4. Supporting Components

### ExpiringSoonHeader

```typescript
interface ExpiringSoonHeaderProps {
  itemCount: number;
  daysAhead: number;
}

const ExpiringSoonHeader: React.FC<ExpiringSoonHeaderProps> = ({
  itemCount,
  daysAhead = 7,
}) => {
  return (
    <View style={headerStyles.container}>
      <View style={headerStyles.titleRow}>
        <Text style={headerStyles.icon}>⏰</Text>
        <Text style={headerStyles.title}>Expiring Soon</Text>
      </View>
      <Text style={headerStyles.subtitle}>
        {itemCount} item{itemCount !== 1 ? "s" : ""} in the next {daysAhead}{" "}
        days
      </Text>
      <View style={headerStyles.divider} />
    </View>
  );
};
```

### SelectedDateHeader

```typescript
interface SelectedDateHeaderProps {
  date: string;
  itemCount: number;
}

const SelectedDateHeader: React.FC<SelectedDateHeaderProps> = ({
  date,
  itemCount,
}) => {
  const formattedDate = useMemo(() => {
    return formatDateForDisplay(date);
  }, [date]);

  return (
    <View style={headerStyles.container}>
      <View style={headerStyles.titleRow}>
        <Text style={headerStyles.icon}>📅</Text>
        <Text style={headerStyles.title}>{formattedDate}</Text>
      </View>
      <Text style={headerStyles.subtitle}>
        {itemCount} item{itemCount !== 1 ? "s" : ""} expiring
      </Text>
      <View style={headerStyles.divider} />
    </View>
  );
};
```

### LoadingStateView

```typescript
const LoadingStateView: React.FC = () => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <View style={loadingStyles.container}>
      <Animated.View
        style={[loadingStyles.skeletonHeader, { opacity: pulseAnim }]}
      />
      {[1, 2, 3].map((i) => (
        <Animated.View
          key={i}
          style={[loadingStyles.skeletonItem, { opacity: pulseAnim }]}
        />
      ))}
    </View>
  );
};
```

## 5. Component Testing Strategy

### Unit Tests

```typescript
// ItemDetailCard.test.tsx
describe("ItemDetailCard", () => {
  const mockItem: FoodItem = {
    id: "1",
    name: "Milk",
    quantity: 2,
    expiry_date: "2024-01-15",
    category: "dairy",
    location: "fridge",
    created_at: "2024-01-10",
  };

  const mockExpiryStatus: ExpiryStatus = {
    days: 1,
    text: "Tomorrow",
    color: "#FFCC00",
    urgency: "tomorrow",
  };

  it("renders item information correctly", () => {
    render(
      <ItemDetailCard
        item={mockItem}
        expiryStatus={mockExpiryStatus}
        onPress={jest.fn()}
        onMarkUsed={jest.fn()}
        onDelete={jest.fn()}
      />
    );

    expect(screen.getByText("Milk (2)")).toBeVisible();
    expect(screen.getByText("Tomorrow")).toBeVisible();
    expect(screen.getByText("Fridge • Added 5 days ago")).toBeVisible();
  });

  it("calls onMarkUsed when Used button is pressed", () => {
    const onMarkUsed = jest.fn();
    render(
      <ItemDetailCard
        item={mockItem}
        expiryStatus={mockExpiryStatus}
        onPress={jest.fn()}
        onMarkUsed={onMarkUsed}
        onDelete={jest.fn()}
      />
    );

    fireEvent.press(screen.getByText("Used"));
    expect(onMarkUsed).toHaveBeenCalledWith(mockItem);
  });

  it("shows confirmation dialog for non-expired items when deleting", () => {
    const onDelete = jest.fn();
    render(
      <ItemDetailCard
        item={mockItem}
        expiryStatus={mockExpiryStatus}
        onPress={jest.fn()}
        onMarkUsed={jest.fn()}
        onDelete={onDelete}
      />
    );

    fireEvent.press(screen.getByText("Delete"));
    expect(screen.getByText("Delete Item?")).toBeVisible();
  });
});
```

### Integration Tests

```typescript
// InformationPanel.test.tsx
describe("InformationPanel", () => {
  it("transitions between states smoothly", async () => {
    const { rerender } = render(
      <InformationPanel
        state="default"
        expiringSoonItems={mockItems}
        selectedDateItems={[]}
        onItemPress={jest.fn()}
        onMarkUsed={jest.fn()}
        onDelete={jest.fn()}
      />
    );

    expect(screen.getByText("Expiring Soon")).toBeVisible();

    rerender(
      <InformationPanel
        state="selected"
        selectedDate="2024-01-15"
        expiringSoonItems={[]}
        selectedDateItems={mockItems}
        onItemPress={jest.fn()}
        onMarkUsed={jest.fn()}
        onDelete={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Tuesday, January 15")).toBeVisible();
    });
  });
});
```

## 6. Performance Considerations

### Memoization Strategy

```typescript
// Memoize expensive calculations
const expiryStatus = useMemo(
  () => calculateExpiryStatus(item.expiry_date),
  [item.expiry_date]
);

// Memoize components
const ItemDetailCard = React.memo(ItemDetailCardComponent);
const ItemCompactCard = React.memo(ItemCompactCardComponent);

// Optimize list rendering
const keyExtractor = useCallback((item: FoodItem) => item.id, []);
const renderItem = useCallback(
  ({ item }) => <ItemDetailCard {...props} item={item} />,
  [props]
);
```

### Virtualization

```typescript
// Use FlatList for large item lists
const shouldVirtualize = items.length > 10;

if (shouldVirtualize) {
  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
    />
  );
}
```

This comprehensive component design specification provides clear guidelines for implementing each component with proper functionality, styling, accessibility, and performance optimization.
