# Expiring Soon View Specification

## Overview

The "Expiring Soon" view is the default information panel displayed above the calendar when no specific date is selected. It provides immediate value by showing the most urgent items requiring user attention.

## Purpose

- **Primary Goal**: Answer "What should I eat/use soon?" at a glance
- **Secondary Goal**: Encourage proactive food management
- **User Benefit**: Reduce decision fatigue and food waste

## Content Strategy

### Time Window

- **Primary Window**: Next 7 days (including today)
- **Rationale**: One week provides actionable planning horizon
- **Fallback**: If no items in 7 days, show next 14 days
- **Maximum**: Never show items beyond 30 days in this view

### Information Architecture

#### Header Section

```
┌─────────────────────────────────────┐
│ "Expiring Soon" [Icon: ⏰]          │
│ "3 items in the next 7 days"       │
└─────────────────────────────────────┘
```

#### Content Grouping

Items are grouped chronologically by expiry date:

1. **Today** (if any items expire today)
2. **Tomorrow** (if any items expire tomorrow)
3. **This Week** (items expiring in 2-7 days)
4. **Next Week** (only if no items in current week)

### Item Display Format

#### Compact List Item

```
┌─────────────────────────────────────┐
│ [Icon] Milk (2 bottles)      [Today]│
│ [Icon] Chicken Breast        [2 days]│
│ [Icon] Apples (5)           [5 days]│
└─────────────────────────────────────┘
```

#### Data Per Item

- **Food Icon**: 32x32pt category icon
- **Item Name**: Primary text, bold if expiring today/tomorrow
- **Quantity**: In parentheses, e.g., "(2 bottles)", "(500g)"
- **Expiry Status**: Right-aligned badge with color coding
- **Touch Target**: Full-width tappable area

## Data Logic

### Query Requirements

```sql
SELECT * FROM food_items
WHERE user_id = $userId
  AND expiry_date IS NOT NULL
  AND expiry_date >= CURRENT_DATE
  AND expiry_date <= (CURRENT_DATE + INTERVAL '7 days')
ORDER BY expiry_date ASC, name ASC
```

### Sorting Priority

1. **By Date**: Earliest expiry first
2. **By Name**: Alphabetical within same date
3. **By Status**: Expired > Today > Future (if mixed dates)

### Display Limits

- **Maximum Items**: 15 items in view
- **Overflow Handling**: Show "View all X items" button if more exist
- **Minimum Items**: If fewer than 3 items, show encouraging message

## Empty States

### No Items Expiring Soon

```
┌─────────────────────────────────────┐
│        [Icon: ✓ Checkmark]         │
│     "Nothing expiring soon!"       │
│   "Your food is well-managed"      │
│                                     │
│  [Button: "Add New Items"]         │
└─────────────────────────────────────┘
```

### All Items Expired (Edge Case)

```
┌─────────────────────────────────────┐
│        [Icon: ⚠️ Warning]          │
│      "Check your expired items"    │
│    "Tap calendar dates to review"  │
└─────────────────────────────────────┘
```

## Interactive Elements

### Item Actions

When user taps an item:

1. **Primary Action**: Navigate to item details page
2. **Visual Feedback**: Brief highlight animation

### Quick Actions (Future Enhancement)

- Swipe left: "Mark as Used"
- Swipe right: "Extend Expiry"
- Long press: Show context menu

## Visual Design

### Typography

- **Header**: 20pt, Bold, Primary color
- **Subheader**: 14pt, Regular, Secondary color
- **Item Name**: 16pt, Medium weight
- **Item Quantity**: 14pt, Regular, Secondary color
- **Expiry Badge**: 12pt, Medium, White text on colored background

### Color Coding (matches calendar indicators)

- **Expired**: Red background (#FF3B30)
- **Today**: Orange background (#FF9500)
- **Tomorrow**: Yellow background (#FFCC00)
- **This Week**: Green background (#34C759)

### Spacing

- **Section Padding**: 16pt all sides
- **Item Spacing**: 12pt between items
- **Group Spacing**: 20pt between date groups

## Component Structure

```typescript
interface ExpiringSoonProps {
  userId: string;
  onItemPress: (item: FoodItem) => void;
  maxItems?: number;
  daysAhead?: number;
}

interface ExpiringSoonViewState {
  items: FoodItem[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
}
```

## Performance Considerations

- **Data Freshness**: Refresh every 5 minutes when app is active
- **Caching**: Cache results for offline viewing
- **Lazy Loading**: Only load icons for visible items
- **Optimization**: Use `FlatList` if more than 10 items

## Accessibility

- **Screen Reader**: Announce count: "3 items expiring soon"
- **Item Announcement**: "[Item name], [quantity], expires [status]"
- **Focus Management**: Keyboard navigation through items
- **Semantic Markup**: Use proper heading hierarchy

## Analytics Tracking

- Track view engagement: how often users interact with items
- Monitor empty state frequency to optimize time windows
- Measure conversion: items viewed vs. items acted upon

## Integration Requirements

- Uses existing `foodItemsService.getItemsByExpiryDate()`
- Extends current `formatExpiry()` utility
- Integrates with existing `RealisticFoodImage` component
- Connects to `router.push('/item-details')` navigation
