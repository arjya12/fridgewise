# Item Details Scope Specification

## Overview

This document defines the information architecture and data requirements for displaying food items when a user selects a specific date in the Expiry Calendar.

## Information Hierarchy

### Primary Information (Must-Have)

1. **Item Name** (`FoodItem.name`)

   - Display prominently as the main identifier
   - Font: Bold, 16pt
   - Truncate long names with ellipsis after 2 lines

2. **Quantity** (`FoodItem.quantity` + `FoodItem.unit`)

   - Format: "2 bottles", "1 loaf", "500g"
   - Display below item name
   - Font: Regular, 14pt, secondary color

3. **Category Icon** (derived from `FoodItem.category`)
   - Use existing `RealisticFoodImage` or `FoodIcon` component
   - Size: 40x40pt
   - Position: Left side of item card

### Secondary Information (Should-Have)

4. **Expiry Status** (calculated from `FoodItem.expiry_date`)

   - Text: "Expired", "Today", "Tomorrow", "3 days"
   - Color-coded using existing `getExpiryColors()` function
   - Display as small badge/chip
   - Position: Top-right corner of item card

5. **Storage Location** (`FoodItem.location`)
   - Text: "Fridge" or "Shelf"
   - Icon: Use Ionicons "snow" for fridge, "library" for shelf
   - Font: Small, 12pt, tertiary color

### Optional Information (Nice-to-Have)

6. **Purchase Date** (calculated from `FoodItem.created_at`)

   - Format: "Added 5 days ago"
   - Only show if less than 30 days old
   - Font: Small, 12pt, tertiary color

7. **Notes Preview** (`FoodItem.notes`)
   - Show first 50 characters if notes exist
   - Truncate with "..." if longer
   - Font: Italic, 12pt, secondary color

## Card Layout Structure

```
┌─────────────────────────────────────┐
│ [Icon]  Item Name            [Badge] │
│         Quantity • Location         │
│         Notes preview (if any)      │
│         Added X days ago            │
└─────────────────────────────────────┘
```

## Data Requirements

### Required Fields

- `FoodItem.id` (for navigation and actions)
- `FoodItem.name`
- `FoodItem.quantity`
- `FoodItem.expiry_date`
- `FoodItem.category` (for icon)

### Optional Fields

- `FoodItem.unit`
- `FoodItem.location`
- `FoodItem.notes`
- `FoodItem.created_at`

### Calculated Fields

- Expiry status (days until/since expiry)
- Time since added (days since created_at)

## Empty States

### No Items for Selected Date

- **Title**: "No items expiring on this date"
- **Message**: "Select a different date or add new items"
- **Icon**: Calendar with question mark
- **Actions**: None (just informational)

### Selected Date Not Set

- **Title**: "Select a date"
- **Message**: "Tap a date to see items expiring that day"
- **Icon**: Calendar
- **Actions**: None

## Performance Considerations

- Limit to 50 items per date (show "View more" if exceeded)
- Use `FlatList` for scrolling if more than 5 items
- Implement `React.memo` for item cards to prevent unnecessary re-renders
- Cache formatted strings (expiry status, date calculations)

## Accessibility

- Each item card should be focusable
- Screen reader should announce: "[Item name], [quantity], expires [status], located in [location]"
- Minimum touch target: 44x44pt
- Color information should have text alternatives

## Component Interface

```typescript
interface ItemDetailCardProps {
  item: FoodItem;
  onPress: (item: FoodItem) => void;
  showActions?: boolean;
}

interface ItemDetailsListProps {
  items: FoodItem[];
  selectedDate: string;
  emptyStateConfig?: {
    title: string;
    message: string;
    icon: string;
  };
}
```

## Integration Points

- Uses existing `FoodItem` type from `lib/supabase.ts`
- Integrates with `RealisticFoodImage` component for icons
- Uses `formatExpiry` utility for status text
- Connects to `router.push('/item-details')` for navigation
