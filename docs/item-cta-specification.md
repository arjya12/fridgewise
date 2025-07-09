# Item Call-to-Action (CTA) Specification

## Overview

This document defines the user actions available for food items displayed in the Expiry Calendar, prioritized by user value and implementation complexity.

## Action Priorities

### Priority 1: Essential Actions (MVP)

These actions must be implemented for the initial release as they address core user needs.

#### 1. "Mark as Used"

- **Purpose**: Remove item from inventory when consumed
- **User Trigger**: User has consumed/used the food item
- **UI Element**: Primary button with checkmark icon
- **Implementation**:
  - Delete item from `food_items` table
  - Log usage in `usage_logs` table with status "used"
  - Update UI optimistically (remove from list immediately)
- **Confirmation**: None needed (quick action)
- **Analytics**: Track usage patterns by category and expiry status

#### 2. "Delete Item"

- **Purpose**: Remove item that was wasted or incorrectly added
- **User Trigger**: Item expired and was thrown away, or user made entry error
- **UI Element**: Secondary button with trash icon
- **Implementation**:
  - Delete item from `food_items` table
  - Log in `usage_logs` table with status "wasted" or "expired"
  - Update UI optimistically
- **Confirmation**: "Are you sure?" alert for items not yet expired
- **Analytics**: Track waste patterns to provide insights

#### 3. "View Details"

- **Purpose**: Navigate to full item details page for editing/more info
- **User Trigger**: Tap on item card (default action)
- **UI Element**: Entire item card is tappable
- **Implementation**: `router.push('/item-details', { params: { id: item.id } })`
- **Confirmation**: None needed
- **Analytics**: Track which items users view details for

### Priority 2: Enhanced Actions (Future Release)

These actions provide additional value but are not essential for initial launch.

#### 4. "Add to Shopping List"

- **Purpose**: Remember to buy replacement when item is used/expired
- **User Trigger**: User wants to repurchase this item
- **UI Element**: Secondary button with shopping cart icon
- **Implementation**:
  - Add to future shopping list feature
  - Include item name, quantity, and category
- **Dependencies**: Requires shopping list feature to be built
- **Analytics**: Track most commonly repurchased items

#### 5. "Extend Expiry"

- **Purpose**: Update expiry date if item is still good
- **User Trigger**: User checks item and determines it's still fresh
- **UI Element**: Button with calendar icon
- **Implementation**:
  - Show date picker modal
  - Update `expiry_date` in database
  - Refresh calendar view
- **Validation**: New date must be in the future
- **Analytics**: Track which categories get extended most often

## Action Placement and UI

### Item Card Actions Layout

```
┌─────────────────────────────────────┐
│ [Icon] Item Name             [Badge]│
│        Quantity • Location          │
│        ┌─────────┐ ┌──────────────┐ │
│        │ ✓ Used  │ │ 🗑️ Delete   │ │
│        └─────────┘ └──────────────┘ │
└─────────────────────────────────────┘
```

### Action Button Specifications

#### "Mark as Used" Button

- **Size**: 80pt width × 32pt height
- **Style**: Primary color background, white text
- **Icon**: Checkmark (Ionicons "checkmark")
- **Text**: "Used"
- **Position**: Left side of action row

#### "Delete Item" Button

- **Size**: 100pt width × 32pt height
- **Style**: Red background (#FF3B30), white text
- **Icon**: Trash (Ionicons "trash")
- **Text**: "Delete"
- **Position**: Right side of action row

#### Action Row Spacing

- **Margin**: 8pt from item content
- **Gap**: 12pt between buttons
- **Padding**: 12pt horizontal within each button

## Data Operations

### Mark as Used Flow

```typescript
async function markItemAsUsed(itemId: string): Promise<void> {
  // 1. Log the usage
  await supabase.from("usage_logs").insert({
    item_id: itemId,
    user_id: currentUserId,
    status: "used",
    quantity: item.quantity,
    logged_at: new Date().toISOString(),
  });

  // 2. Delete the item
  await supabase.from("food_items").delete().eq("id", itemId);

  // 3. Update local state
  removeItemFromState(itemId);
}
```

### Delete Item Flow

```typescript
async function deleteItem(
  itemId: string,
  reason: "wasted" | "error"
): Promise<void> {
  // 1. Log the deletion reason
  await supabase.from("usage_logs").insert({
    item_id: itemId,
    user_id: currentUserId,
    status: reason === "wasted" ? "wasted" : "expired",
    quantity: item.quantity,
    logged_at: new Date().toISOString(),
  });

  // 2. Delete the item
  await supabase.from("food_items").delete().eq("id", itemId);

  // 3. Update local state
  removeItemFromState(itemId);
}
```

## Error Handling

### Network Failures

- Show temporary error message: "Unable to update item. Please try again."
- Revert optimistic UI changes
- Offer retry button
- Queue action for retry when connection restored

### Data Conflicts

- Handle case where item was already modified by another device
- Refresh data and show current state
- Ask user to confirm action again

### Invalid Actions

- Prevent actions on items that no longer exist
- Validate user permissions before API calls
- Handle authentication failures gracefully

## Accessibility

### Screen Reader Support

- "Mark as Used" button: "Mark [item name] as used"
- "Delete" button: "Delete [item name]"
- Action completion: Announce "Item marked as used" or "Item deleted"

### Keyboard Navigation

- Tab order: Item card → Mark Used → Delete → Next item
- Enter/Space: Activate focused button
- Escape: Cancel any confirmation dialogs

### Touch Accessibility

- Minimum button size: 44×44pt (iOS guidelines)
- Clear visual feedback on press
- Sufficient color contrast for button text

## Confirmation Dialogs

### Delete Non-Expired Item

```
┌─────────────────────────────────────┐
│            "Delete Item?"           │
│                                     │
│  "This item hasn't expired yet.     │
│   Are you sure you want to          │
│   delete it?"                       │
│                                     │
│  [Cancel]              [Delete]     │
└─────────────────────────────────────┘
```

### Bulk Actions (Future)

- Select multiple items for batch operations
- "Mark all as used" for multiple items
- Confirmation for bulk deletions

## Performance Considerations

### Optimistic Updates

- Update UI immediately on user action
- Rollback changes only if API call fails
- Show loading states for network operations

### Batch Operations

- Queue multiple rapid actions
- Send as single API call when possible
- Prevent duplicate actions on same item

### State Management

- Remove items from calendar view immediately
- Update item counts in "Expiring Soon" view
- Refresh calendar markers if needed

## Analytics and Tracking

### User Behavior Metrics

- Action completion rates by item category
- Time from view to action (engagement speed)
- Most commonly used vs. wasted food categories
- Pattern analysis for waste reduction insights

### App Performance Metrics

- Action completion time (API response)
- Error rates by action type
- Retry rates for failed actions
- User flow drop-off points

## Integration Requirements

### Existing Components

- Uses current `FoodItem` type from `lib/supabase.ts`
- Integrates with existing `foodItemsService` patterns
- Follows current error handling conventions
- Uses existing UI component library (`ThemedView`, `ThemedText`)

### Database Schema

- Leverages existing `food_items` table
- Uses existing `usage_logs` table structure
- Maintains referential integrity with user accounts

### Navigation

- Maintains current navigation patterns
- Integrates with existing `router.push()` flows
- Preserves back navigation behavior
