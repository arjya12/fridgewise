# Calendar Dot Indicator Urgency Tiers - Business Logic Specification

## Overview

This document formalizes the business logic for calendar dot indicators in the FridgeWise expiry calendar, defining urgency tiers, visual treatment, and color coding for food items based on expiry dates.

## Urgency Tiers

### Critical (Red) - Immediate Action Required

**Criteria:**

- Items that have expired (daysUntilExpiry < 0)
- Items expiring today (daysUntilExpiry = 0)

**Visual Treatment:**

- Dot Color: `#EF4444` (Red-500)
- Calendar Marker: Red dot
- Item Card Background: `#FEF2F2` (Red-50)
- Item Card Border: `#FCA5A5` (Red-300)
- Text Color: `#DC2626` (Red-600)

**Description Templates:**

- Expired: "Expired [X] day(s) ago"
- Today: "Expires today"

**Priority:** Highest - Always show first in multi-dot scenarios

### Warning (Orange) - Action Needed Soon

**Criteria:**

- Items expiring in 1-2 days (daysUntilExpiry = 1 or 2)

**Visual Treatment:**

- Dot Color: `#F97316` (Orange-500)
- Calendar Marker: Orange dot
- Item Card Background: `#FFF7ED` (Orange-50)
- Item Card Border: `#FED7AA` (Orange-200)
- Text Color: `#EA580C` (Orange-600)

**Description Template:**

- "Expires in [X] day(s)"

**Priority:** High - Show second in multi-dot scenarios

### Soon (Yellow) - Plan Ahead

**Criteria:**

- Items expiring in 3-7 days (daysUntilExpiry = 3, 4, 5, 6, or 7)

**Visual Treatment:**

- Dot Color: `#EAB308` (Yellow-500)
- Calendar Marker: Yellow dot
- Item Card Background: `#FEFCE8` (Yellow-50)
- Item Card Border: `#FEF08A` (Yellow-200)
- Text Color: `#FACC15` (Yellow-400)

**Description Template:**

- "Expires in [X] days"

**Priority:** Medium - Show third in multi-dot scenarios

### Safe (Green) - Good Condition

**Criteria:**

- Items expiring in 8+ days (daysUntilExpiry >= 8)
- Items with no expiry date set

**Visual Treatment:**

- Dot Color: `#22C55E` (Green-500)
- Calendar Marker: Green dot
- Item Card Background: `#F0FDF4` (Green-50)
- Item Card Border: `#BBF7D0` (Green-200)
- Text Color: `#16A34A` (Green-600)

**Description Templates:**

- Short term (8-30 days): "Expires in [X] days"
- Long term (30+ days): "Fresh"
- No expiry: "No expiry date set"

**Priority:** Low - Only show if no other urgency levels present

## Multi-Dot Logic

When multiple urgency levels exist on the same date:

1. **Maximum 3 dots** per calendar date to avoid visual clutter
2. **Priority Order:** Critical → Warning → Soon → Safe
3. **Display Logic:**
   - Always show Critical if present
   - Always show Warning if present
   - Show Soon if present and space allows
   - Only show Safe if no other urgency levels present

## Calendar Date Accessibility

Each calendar date with items should include:

- **Screen Reader Label:** "[Date] - [X] items: [urgency summary]"
- **Example:** "March 15 - 3 items: 1 critical, 2 warning"
- **VoiceOver Hint:** "Tap to view items expiring on this date"

## Business Rules

### Date Calculation

- All calculations use **start of day** comparison
- Expiry dates are treated as **end of that day**
- Time zones handled consistently using device local time

### Edge Cases

- **No expiry date:** Treated as "Safe" with special description
- **Invalid dates:** Gracefully handled, default to "Safe"
- **Future dates beyond 1 year:** Still calculated accurately

### Performance Considerations

- Urgency calculations are **memoized** per item
- Color lookups are **cached** for performance
- Calendar dots are **batch-generated** for efficiency

## Implementation Notes

### Dot Generation Process

1. Group items by expiry date
2. Calculate urgency for each item
3. Determine unique urgency levels per date
4. Apply priority filtering (max 3 dots)
5. Generate dot configuration for calendar

### Integration Points

- **foodItemsService.getItemsByExpiryDate()** - Provides grouped data
- **urgencyUtils.getCalendarDotColors()** - Generates dot configuration
- **calendarUtils.formatItemsForCalendar()** - Applies dots to calendar format

### Testing Requirements

- Unit tests for each urgency tier calculation
- Edge case testing for invalid/missing dates
- Performance testing with large datasets
- Visual regression testing for color accuracy

## Future Considerations

### Customization Options

- User-configurable urgency thresholds
- Custom color schemes for accessibility
- Different notification preferences per user

### Advanced Features

- Smart urgency based on food type (dairy vs. canned goods)
- Location-based urgency (fridge vs. shelf)
- Seasonal adjustments for fresh produce

---

**Document Status:** Draft v1.0  
**Last Updated:** Phase 1 Implementation  
**Review Required:** Before Phase 2 Implementation
