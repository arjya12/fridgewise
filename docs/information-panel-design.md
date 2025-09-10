# Information Panel Design Specification

## Overview

This document provides detailed design specifications for the three states of the Information Panel component that appears above the calendar in the enhanced Expiry Calendar feature.

## Design System Integration

### Color Palette

Based on `constants/Colors.ts` and existing component patterns:

```typescript
// Base colors from existing system
const colors = {
  light: {
    primary: "#0a7ea4",
    background: "#fff",
    cardBackground: "#f8f9fa",
    text: "#11181C",
    secondaryText: "#687076",
    border: "#e5e7eb",
  },
  dark: {
    primary: "#fff",
    background: "#151718",
    cardBackground: "#1c1c1e",
    text: "#ECEDEE",
    secondaryText: "#9BA1A6",
    border: "#374151",
  },
};

// Expiry status colors (from existing patterns)
const expiryColors = {
  expired: "#FF3B30",
  today: "#FF9500",
  tomorrow: "#FFCC00",
  soon: "#34C759",
  fresh: "#6B7280",
};
```

### Typography Scale

```typescript
const typography = {
  panelTitle: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 24,
  },
  panelSubtitle: {
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 18,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 20,
  },
  itemMeta: {
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 18,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 16,
  },
};
```

### Spacing System

```typescript
const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};
```

## State 1: Default "Expiring Soon" View

### Visual Design

```
┌─────────────────────────────────────┐
│ ⏰ Expiring Soon                    │ ← panelTitle (20pt, bold)
│ 3 items in the next 7 days         │ ← panelSubtitle (14pt, secondary)
│ ─────────────────────────────────── │ ← divider (1pt, border color)
│                                     │ ← 12pt spacing
│ ┌─[🥛] Milk (2 bottles)    [Today]─┐│ ← ItemCompactCard
│ │ 32×32   itemTitle 16pt    badge  ││ ← 44pt min height
│ └─────────────────────────────────┘ │ ← 8pt spacing between items
│ ┌─[🍗] Chicken Breast     [2 days]─┐│
│ │                                  ││
│ └─────────────────────────────────┘ │
│ ┌─[🍎] Apples (5)        [5 days]─┐│
│ │                                  ││
│ └─────────────────────────────────┘ │
│                                     │ ← 16pt spacing
│ View all 8 items →                  │ ← link text (14pt, primary color)
└─────────────────────────────────────┘
```

### Component Specifications

#### Header Section

```typescript
interface ExpiringSoonHeaderProps {
  itemCount: number;
  daysAhead: number; // 7 by default
}

const headerStyles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  icon: {
    marginRight: spacing.sm,
    fontSize: 18,
  },
  title: {
    ...typography.panelTitle,
    color: colors.light.text,
  },
  subtitle: {
    ...typography.panelSubtitle,
    color: colors.light.secondaryText,
  },
  divider: {
    height: 1,
    backgroundColor: colors.light.border,
    marginTop: spacing.md,
  },
});
```

#### Item Compact Card

```typescript
interface ItemCompactCardProps {
  item: FoodItem;
  expiryDays: number;
  onPress: (item: FoodItem) => void;
}

const compactCardStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: "transparent",
  },
  iconContainer: {
    width: 32,
    height: 32,
    marginRight: spacing.md,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
  },
  itemTitle: {
    ...typography.itemTitle,
    color: colors.light.text,
  },
  badgeContainer: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    ...typography.badgeText,
    color: "#FFFFFF",
  },
});
```

#### Badge Color Logic

```typescript
const getBadgeStyle = (daysUntilExpiry: number) => {
  if (daysUntilExpiry < 0) {
    return { backgroundColor: expiryColors.expired }; // Red
  } else if (daysUntilExpiry === 0) {
    return { backgroundColor: expiryColors.today }; // Orange
  } else if (daysUntilExpiry === 1) {
    return { backgroundColor: expiryColors.tomorrow }; // Yellow
  } else if (daysUntilExpiry <= 7) {
    return { backgroundColor: expiryColors.soon }; // Green
  }
  return { backgroundColor: expiryColors.fresh }; // Gray
};
```

#### List Container

```typescript
const listStyles = StyleSheet.create({
  container: {
    flex: 1,
    maxHeight: 200, // Limit height to prevent calendar squishing
  },
  contentContainer: {
    paddingBottom: spacing.sm,
  },
  viewAllContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.light.primary,
    fontWeight: "500",
  },
});
```

## State 2: Selected Date View

### Visual Design

```
┌─────────────────────────────────────┐
│ 📅 Tuesday, January 15              │ ← panelTitle (20pt, bold)
│ 2 items expiring                    │ ← panelSubtitle (14pt, secondary)
│ ─────────────────────────────────── │ ← divider
│                                     │ ← 12pt spacing
│ ┌─[🥛] Milk (2 bottles)          [✓]─┐│ ← ItemDetailCard
│ │ 40×40  itemTitle 16pt     badge   ││ ← min 88pt height
│ │        meta: 14pt secondary       ││
│ │        ┌─────────┐ ┌──────────────┐││ ← action buttons
│ │        │ ✓ Used  │ │ 🗑️ Delete   │││ ← 32pt height
│ │        └─────────┘ └──────────────┘││
│ └─────────────────────────────────┘ │ ← 12pt spacing
│ ┌─[🍗] Chicken Breast            [✓]─┐│
│ │ [Similar structure...]            ││
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Component Specifications

#### Date Header

```typescript
interface SelectedDateHeaderProps {
  date: string; // ISO date string
  itemCount: number;
}

const dateHeaderStyles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  icon: {
    marginRight: spacing.sm,
    fontSize: 18,
  },
  title: {
    ...typography.panelTitle,
    color: colors.light.text,
  },
  subtitle: {
    ...typography.panelSubtitle,
    color: colors.light.secondaryText,
  },
});
```

#### Item Detail Card

```typescript
interface ItemDetailCardProps {
  item: FoodItem;
  onPress: (item: FoodItem) => void;
  onMarkUsed: (item: FoodItem) => void;
  onDelete: (item: FoodItem) => void;
  showActions?: boolean;
}

const detailCardStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.light.cardBackground,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: 12,
    padding: spacing.lg,
    minHeight: 88,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    marginRight: spacing.md,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    flex: 1,
  },
  itemTitle: {
    ...typography.itemTitle,
    color: colors.light.text,
    marginBottom: spacing.xs,
  },
  metaText: {
    ...typography.itemMeta,
    color: colors.light.secondaryText,
  },
  badgeContainer: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  badgeText: {
    ...typography.badgeText,
    color: "#FFFFFF",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: spacing.md,
    marginTop: spacing.md,
  },
});
```

#### Action Buttons

```typescript
interface ActionButtonProps {
  type: "used" | "delete";
  onPress: () => void;
  disabled?: boolean;
}

const actionButtonStyles = StyleSheet.create({
  usedButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.light.primary,
    borderRadius: 8,
    minWidth: 80,
    minHeight: 32,
    justifyContent: "center",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: expiryColors.expired,
    borderRadius: 8,
    minWidth: 100,
    minHeight: 32,
    justifyContent: "center",
  },
  buttonIcon: {
    marginRight: spacing.xs,
    fontSize: 14,
    color: "#FFFFFF",
  },
  buttonText: {
    ...typography.buttonText,
    color: "#FFFFFF",
  },
});
```

## State 3: Empty States

### Design A: No Date Selected

```
┌─────────────────────────────────────┐
│           Select a date             │ ← panelTitle (20pt, center)
│                                     │ ← 24pt spacing
│              📅                     │ ← large icon (48pt)
│                                     │ ← 16pt spacing
│        Tap a date to see items      │ ← body text (16pt, center)
│        expiring that day            │ ← secondary color
│                                     │
└─────────────────────────────────────┘
```

### Design B: No Items on Selected Date

```
┌─────────────────────────────────────┐
│ 📅 Wednesday, January 16            │ ← panelTitle (20pt, bold)
│                                     │ ← 20pt spacing
│              📅❓                   │ ← large icon (48pt)
│                                     │ ← 16pt spacing
│      No items expiring today        │ ← body text (16pt, center)
│   Select a different date or add    │ ← secondary text (14pt)
│           new items                 │
│                                     │ ← 20pt spacing
│     ┌─────────────────────┐         │ ← CTA button
│     │    + Add New Item   │         │ ← 44pt height
│     └─────────────────────┘         │
└─────────────────────────────────────┘
```

### Component Specifications

#### Empty State Container

```typescript
interface EmptyStateProps {
  type: "no-date-selected" | "no-items-on-date";
  selectedDate?: string;
  onAddItem?: () => void;
}

const emptyStateStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  icon: {
    fontSize: 48,
    marginBottom: spacing.lg,
    opacity: 0.6,
  },
  title: {
    ...typography.panelTitle,
    color: colors.light.text,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  message: {
    fontSize: 16,
    color: colors.light.secondaryText,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  ctaButton: {
    backgroundColor: colors.light.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  ctaButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
```

## Animation & Transitions

### State Transition Animations

```typescript
const animationConfig = {
  duration: 300,
  useNativeDriver: true,
  easing: Easing.out(Easing.cubic),
};

// Fade transition for state changes
const fadeTransition = {
  opacity: {
    from: 0,
    to: 1,
    duration: 250,
  },
};

// Slide transition for content changes
const slideTransition = {
  transform: [
    {
      translateX: {
        from: 50,
        to: 0,
        duration: 300,
      },
    },
  ],
};
```

### Loading States

```typescript
const loadingStyles = StyleSheet.create({
  skeletonContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  skeletonItem: {
    height: 44,
    backgroundColor: colors.light.border,
    borderRadius: 8,
    marginBottom: spacing.sm,
    opacity: 0.3,
  },
  skeletonHeader: {
    height: 24,
    width: "60%",
    backgroundColor: colors.light.border,
    borderRadius: 4,
    marginBottom: spacing.md,
    opacity: 0.3,
  },
});
```

## Accessibility Enhancements

### Screen Reader Support

```typescript
const accessibilityProps = {
  expiringSoonHeader: {
    accessibilityRole: "header",
    accessibilityLabel: (count: number) =>
      `Expiring soon. ${count} items in the next 7 days`,
  },
  selectedDateHeader: {
    accessibilityRole: "header",
    accessibilityLabel: (date: string, count: number) =>
      `${formatDateForDisplay(date)}. ${count} items expiring`,
  },
  itemCard: {
    accessibilityRole: "button",
    accessibilityLabel: (item: FoodItem, status: string) =>
      `${item.name}, quantity ${item.quantity}, expires ${status}`,
    accessibilityActions: [
      { name: "markUsed", label: "Mark as used" },
      { name: "delete", label: "Delete item" },
    ],
  },
  emptyState: {
    accessibilityRole: "text",
    accessibilityLabel:
      "No items selected. Tap a calendar date to see expiring items.",
  },
};
```

### Focus Management

```typescript
// Focus handling for state transitions
const focusManagement = {
  onStateChange: (newState: PanelState) => {
    if (newState === "selected") {
      // Focus first item card
      firstItemRef.current?.focus();
    } else if (newState === "default") {
      // Focus header
      headerRef.current?.focus();
    }
  },
};
```

## Performance Optimizations

### Virtualization for Large Lists

```typescript
// Use FlatList for "Expiring Soon" when > 10 items
const shouldVirtualize = items.length > 10;

const renderItem = useCallback(
  ({ item }: { item: FoodItem }) => (
    <ItemCompactCard
      key={item.id}
      item={item}
      expiryDays={calculateExpiryDays(item.expiry_date)}
      onPress={onItemPress}
    />
  ),
  [onItemPress]
);
```

### Memoization

```typescript
// Memoize expensive calculations
const sortedItems = useMemo(() => {
  return items.sort((a, b) => {
    const daysA = calculateExpiryDays(a.expiry_date);
    const daysB = calculateExpiryDays(b.expiry_date);
    return daysA - daysB;
  });
}, [items]);

// Memoize components to prevent unnecessary re-renders
const ItemDetailCard = React.memo(ItemDetailCardComponent);
const ItemCompactCard = React.memo(ItemCompactCardComponent);
```

This design specification provides a comprehensive foundation for implementing the Information Panel with proper visual hierarchy, accessibility, and performance considerations.
