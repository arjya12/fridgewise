# Calendar Date Indicator Logic Specification

## Overview

This document defines the precise logic for calendar date indicators that will show the presence and urgency of expiring items without requiring users to tap on individual dates.

## Research Findings

### Current System Analysis

- **Library**: `react-native-calendars` v1.1313.0 supports `multi-dot` marking
- **Data Structure**: `itemsByDate` groups `FoodItemWithUrgency[]` by date strings (YYYY-MM-DD)
- **Urgency Levels**: `critical`, `warning`, `soon`, `safe` with corresponding colors
- **Current Colors**:
  - Critical: `#EF4444` (Red)
  - Warning: `#F97316` (Orange)
  - Soon: `#EAB308` (Yellow)
  - Safe: `#22C55E` (Green)

## Indicator Logic Specification

### Multi-Dot Strategy

Use `react-native-calendars` built-in `multi-dot` marking with `markingType="multi-dot"`.

### Dot Generation Rules

#### Rule 1: Single Urgency Level

When all items on a date have the same urgency level:

- **Show 1 dot** in the urgency color
- **Dot size**: Standard (library default)

#### Rule 2: Multiple Urgency Levels

When items have mixed urgency levels:

- **Show up to 3 dots** (visual clarity limit)
- **Priority order** (highest priority first):
  1. Critical (`#EF4444`)
  2. Warning (`#F97316`)
  3. Soon (`#EAB308`)
  4. Safe (`#22C55E`)
- **De-duplication**: Only one dot per urgency level

#### Rule 3: High Item Count (4+ items)

When a date has many items:

- **Show urgency dots** (up to 3 as per Rule 2)
- **Add count indicator** in accessibility label
- **Consider badge overlay** for dates with 10+ items (future enhancement)

### Implementation Algorithm

```typescript
function generateDateIndicators(
  items: FoodItemWithUrgency[],
  maxDots: number = 3
): CalendarDot[] {
  if (items.length === 0) return [];

  // Extract unique urgency levels
  const urgencyLevels = new Set(items.map((item) => item.urgency.level));

  // Priority mapping for sorting
  const urgencyPriority = {
    critical: 0,
    warning: 1,
    soon: 2,
    safe: 3,
  };

  // Sort urgency levels by priority
  const sortedUrgencies = Array.from(urgencyLevels)
    .sort((a, b) => urgencyPriority[a] - urgencyPriority[b])
    .slice(0, maxDots);

  // Generate dots
  return sortedUrgencies.map((urgency, index) => ({
    key: `${urgency}-${index}`,
    color: getUrgencyColor(urgency),
    selectedDotColor: "#FFFFFF",
  }));
}
```

### Color Mapping

```typescript
const URGENCY_COLORS = {
  critical: "#EF4444", // Red - immediate attention needed
  warning: "#F97316", // Orange - expires 1-2 days
  soon: "#EAB308", // Yellow - expires 3-7 days
  safe: "#22C55E", // Green - expires 8+ days
} as const;
```

### Visual Examples

#### Example 1: Single Critical Item

Date: `2025-01-15` with 1 expired apple

- **Dots**: 1 red dot
- **Accessibility**: "January 15 - 1 item: 1 critical"

#### Example 2: Mixed Urgency Items

Date: `2025-01-16` with 2 critical, 1 warning, 3 safe items

- **Dots**: 3 dots [red, orange, green] (soon excluded due to limit)
- **Accessibility**: "January 16 - 6 items: 2 critical, 1 warning, 3 safe"

#### Example 3: Warning Only

Date: `2025-01-17` with 2 items expiring tomorrow

- **Dots**: 1 orange dot
- **Accessibility**: "January 17 - 2 items: 2 warning"

#### Example 4: Many Safe Items

Date: `2025-01-20` with 8 safe items

- **Dots**: 1 green dot
- **Accessibility**: "January 20 - 8 items: 8 safe"

### Accessibility Enhancement

#### Screen Reader Labels

Format: `"{Date} - {count} items: {urgency_summary}"`

#### Touch Target Consideration

- Dots maintain library default touch targets
- Full date cell remains tappable
- Visual feedback on hover/press

### Technical Implementation Notes

#### Performance Optimization

- Generate indicators once per month load
- Cache results in component state
- Batch updates for month transitions

#### Edge Cases

- **No expiry date**: Items excluded from calendar dots
- **Past dates**: Show indicators for historical data
- **Future months**: Load data on-demand for performance

#### Integration Points

- **Service Layer**: `foodItemsService.getItemsByExpiryDate()`
- **Utils**: `formatItemsForCalendar()` enhancement
- **Component**: `EnhancedExpiryCalendar` calendar props

### Success Criteria

1. ✅ Users can scan calendar and immediately identify dates with expiring items
2. ✅ Urgency level is visually apparent through color coding
3. ✅ Multiple urgency levels are clearly represented
4. ✅ Performance remains smooth with large datasets
5. ✅ Accessibility standards are maintained
6. ✅ Visual design follows existing app patterns

### Future Enhancements (Out of Scope)

- Number badges for high item counts (10+)
- Animated dot pulsing for critical items
- Custom dot shapes for different item categories
- Density indicators (dot size based on item count)

## Backend/Service Requirements

### Current System Analysis

Based on codebase analysis, the following service layer operations already exist and are well-established:

#### Existing Service Operations (food_items)

1. **Mark as Used**: `foodItemsService.logUsage(itemId, "used", quantity)`

   - Logs usage in `usage_logs` table
   - Decrements quantity or deletes item if quantity reaches 0
   - **Status**: ✅ Fully implemented

2. **Delete Item**: `foodItemsService.deleteItem(itemId)`

   - Removes item from `food_items` table
   - **Status**: ✅ Fully implemented

3. **Update Item**: `foodItemsService.updateItem(itemId, updates)`
   - Updates any item fields including `expiry_date`
   - **Status**: ✅ Fully implemented

#### Current Backend Integration Points

**Service Functions Already Available:**

```typescript
// All functions return Promise<FoodItemWithUrgency> or Promise<void>
foodItemsService.updateItem(id, { expiry_date: newDate });
foodItemsService.logUsage(id, "used", quantity);
foodItemsService.deleteItem(id);
foodItemsService.getItems(); // For current item retrieval
```

**Database Tables:**

- `food_items`: Core item storage with expiry_date field
- `usage_logs`: Tracks usage history (status: "used" | "expired" | "wasted")

### Service Requirements for Swipe Actions

#### 1. Mark as Used Implementation

```typescript
const handleMarkUsed = async (item: FoodItemWithUrgency) => {
  try {
    // Use existing service - logs usage and handles deletion/quantity update
    await foodItemsService.logUsage(item.id, "used", item.quantity);

    // Optimistic UI update - remove from current view
    updateLocalState(item.id, "remove");

    // Show success feedback
    showSuccessMessage("Item marked as used");
  } catch (error) {
    // Revert optimistic update and show error
    revertLocalState(item.id);
    showErrorMessage("Failed to mark as used");
  }
};
```

#### 2. Extend Expiry Implementation

```typescript
const handleExtendExpiry = async (
  item: FoodItemWithUrgency,
  days: number = 3
) => {
  try {
    const currentExpiry = new Date(item.expiry_date);
    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(currentExpiry.getDate() + days);

    // Use existing service to update expiry date
    await foodItemsService.updateItem(item.id, {
      expiry_date: newExpiry.toISOString().split("T")[0],
    });

    // Optimistic UI update - update urgency status
    updateLocalState(item.id, "updateExpiry", newExpiry);

    showSuccessMessage(`Expiry extended by ${days} days`);
  } catch (error) {
    revertLocalState(item.id);
    showErrorMessage("Failed to extend expiry");
  }
};
```

### No Additional Backend Development Required

**Key Finding**: All necessary backend operations are already implemented and production-ready.

**Implementation Strategy**:

1. **Reuse Existing Services**: All swipe actions map directly to existing service functions
2. **Optimistic Updates**: Update UI immediately, revert on error
3. **Error Handling**: Existing error handling patterns from current implementations
4. **Data Consistency**: Current service layer ensures proper database consistency

**Service Integration Checklist**:

- ✅ Mark as Used: `logUsage()` function available
- ✅ Extend Expiry: `updateItem()` function available
- ✅ Delete Item: `deleteItem()` function available
- ✅ Error Handling: Established patterns exist
- ✅ Authentication: User context handled by existing service layer
- ✅ Data Validation: Built into existing Supabase integration

**Performance Considerations**:

- Service calls are already optimized for mobile
- Database queries use proper indexing on user_id and expiry_date
- Batch operations not needed for individual swipe actions

## Technical Approach Decision

### Recommended: Built-in Multi-Dot Marking ✅

**Decision**: Use `react-native-calendars` built-in `multi-dot` marking system.

**Rationale**:

#### Advantages of Multi-Dot Approach

1. **✅ Proven Compatibility**: Library version 1.1313.0 has stable multi-dot support
2. **✅ Performance**: Native library optimizations for rendering
3. **✅ Accessibility**: Built-in screen reader support
4. **✅ Maintenance**: No custom component to maintain
5. **✅ Consistent UX**: Matches calendar library design patterns
6. **✅ Easy Implementation**: Simple prop changes to existing component

#### Technical Implementation

```typescript
// Current implementation in EnhancedExpiryCalendar.tsx
<Calendar
  markingType="multi-dot" // ← Key change from current
  markedDates={enhancedMarkedDates}
  // ... other props
/>;

// Enhanced marked dates structure
const enhancedMarkedDates = {
  "2025-01-15": {
    dots: [
      { key: "critical", color: "#EF4444", selectedDotColor: "#FFFFFF" },
      { key: "warning", color: "#F97316", selectedDotColor: "#FFFFFF" },
      { key: "soon", color: "#EAB308", selectedDotColor: "#FFFFFF" },
    ],
    selected: false,
    accessibilityLabel: "January 15 - 6 items: 2 critical, 1 warning, 3 soon",
  },
};
```

#### Integration Points

1. **Service Layer**: No changes needed to `foodItemsService.getItemsByExpiryDate()`
2. **Utils Enhancement**: Update `formatItemsForCalendar()` to generate multi-dot structure
3. **Component Update**: Change `markingType` prop and enhance marked dates processing

### Alternative Rejected: Custom dayComponent ❌

**Why Not Custom Day Component**:

1. **❌ Complexity**: Would require custom rendering logic
2. **❌ Accessibility**: Manual implementation of screen reader support
3. **❌ Performance**: Potential re-render issues with many custom components
4. **❌ Maintenance**: Custom component needs updates with library changes
5. **❌ Testing**: More extensive testing required for custom implementations

### Migration Strategy

#### Phase 1: Minimal Changes

- Update `markingType` to `"multi-dot"`
- Enhance `formatItemsForCalendar()` utility
- Test with existing data

#### Phase 2: Enhanced Features

- Add accessibility labels
- Implement urgency priority sorting
- Add performance optimizations

#### Phase 3: Polish

- Fine-tune visual spacing
- Add loading states
- Performance profiling

### Implementation Files Modified

1. `components/EnhancedExpiryCalendar.tsx` - Calendar component props
2. `utils/calendarUtils.ts` - Enhanced marked dates generation
3. `docs/calendar-indicator-logic.md` - This specification document

### Backward Compatibility

- ✅ Existing functionality preserved
- ✅ Current dot colors maintained
- ✅ No breaking changes to data structures
- ✅ Graceful fallback for invalid data

### Testing Strategy

1. **Unit Tests**: Multi-dot generation logic
2. **Integration Tests**: Calendar rendering with various data combinations
3. **Accessibility Tests**: Screen reader label validation
4. **Performance Tests**: Large dataset rendering
5. **Visual Tests**: Cross-platform dot appearance

**Final Decision**: Proceed with built-in multi-dot marking approach for optimal balance of functionality, performance, and maintainability.
