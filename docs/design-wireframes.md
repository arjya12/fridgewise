# Design Wireframes - Enhanced Calendar with Date Indicators

## Overview

This document provides detailed wireframes and design specifications for implementing calendar date indicators and swipe actions based on Phase 1 technical decisions.

## Calendar Date Indicators Wireframe

### Current State Analysis

```
CURRENT CALENDAR (react-native-calendars)
┌─────────────────────────────────────────┐
│  January 2024                     < >   │
├─────────────────────────────────────────┤
│  S   M   T   W   T   F   S             │
│      1   2   3   4   5   6             │
│  7   8   9  10  11  12  13             │
│ 14  15  16  17  18  19  20             │
│ 21  22  23  24  25  26  27             │
│ 28  29  30  31                         │
└─────────────────────────────────────────┘

Issues:
- No visual indication of which dates have expiring items
- Users must tap each date to discover content
- No urgency information at calendar level
```

### Enhanced Calendar Wireframe

```
ENHANCED CALENDAR WITH INDICATORS
┌─────────────────────────────────────────┐
│  January 2024                     < >   │
├─────────────────────────────────────────┤
│  S   M   T   W   T   F   S             │
│      1   2   3   4   5   6             │
│  7   8   9• 10  11• 12• 13             │
│ 14  15• 16  17• 18  19  20             │
│ 21  22  23  24• 25  26  27             │
│ 28  29  30  31                         │
├─────────────────────────────────────────┤
│ Legend: •Critical •Warning •Soon •Safe  │
└─────────────────────────────────────────┘

Key Enhancements:
✓ Colored dots indicate item urgency on each date
✓ Single dominant dot per date (highest urgency)
✓ Quick visual scanning without tapping
✓ Compact legend for color reference
```

## Detailed Date Indicator Specifications

### 1. Dot Visual Properties

```
DOT SPECIFICATIONS (react-native-calendars multi-dot)

Size: 6px diameter (optimal for mobile touch targets)
Position: Bottom-center of date number
Shape: Perfect circle
Spacing: 2px between multiple dots (if implemented)

Colors (from Phase 1 specification):
🔴 Critical: #EF4444 (Red) - Expired/Today
🟠 Warning: #F97316 (Orange) - 1-2 days
🟡 Soon: #EAB308 (Yellow) - 3-7 days
🟢 Safe: #22C55E (Green) - 8+ days
```

### 2. Priority System Logic

```
SINGLE DOT PRIORITY SYSTEM

Input: Date with multiple items of different urgencies
Logic: Show ONLY the highest priority urgency color

Examples:
Date with: 2 Critical + 3 Warning + 1 Safe → Show: 🔴 Critical dot
Date with: 1 Warning + 4 Safe → Show: 🟠 Warning dot
Date with: 5 Safe items → Show: 🟢 Safe dot

Rationale:
- Reduces visual noise
- Highlights most urgent items first
- Maintains scannable calendar interface
```

### 3. Calendar Layout Integration

```
CALENDAR COMPONENT STRUCTURE

EnhancedExpiryCalendar
├── Calendar (react-native-calendars)
│   ├── markedDates: computed from itemsByDate
│   ├── markingType: "multi-dot"
│   └── theme: urgency color scheme
├── CompactLegend (new)
│   ├── Critical indicator + label
│   ├── Warning indicator + label
│   ├── Soon indicator + label
│   └── Safe indicator + label
└── SelectedDateView (existing)
    ├── Date header with item count
    ├── ItemsList (SwipeableItemCard components)
    └── EmptyState (when no items)
```

## Swipe Action Wireframes

### Current Item Card State

```
CURRENT ITEM CARD (tap to expand)
┌─────────────────────────────────────────┐
│ 🥛 Milk                         EXPIRED │
│ Refrigerator • Dairy                   │
│ Quantity: 1 • Added 3 days ago         │
│                               [Details]│
└─────────────────────────────────────────┘

Issues:
- Requires multiple taps for common actions
- No quick actions for frequent tasks
- Details button takes extra navigation
```

### Enhanced Swipeable Item Card

```
ENHANCED SWIPEABLE ITEM CARD

Normal State:
┌─────────────────────────────────────────┐
│ 🥛 Milk                         EXPIRED │
│ Refrigerator • Dairy • Qty: 1          │
│ ← Swipe for actions                     │
└─────────────────────────────────────────┘

Left Swipe (Mark as Used):
┌─────────────────────────────────────────┐
│[✓ Used] 🥛 Milk               EXPIRED   │
│         Refrigerator • Dairy • Qty: 1   │
└─────────────────────────────────────────┘

Right Swipe (Extend Expiry):
┌─────────────────────────────────────────┐
│ 🥛 Milk                    EXPIRED [+3d]│
│ Refrigerator • Dairy • Qty: 1           │
└─────────────────────────────────────────┘

Key Features:
✓ Gesture hints for discoverability
✓ Visual action feedback
✓ Immediate optimistic updates
✓ Haptic feedback on action completion
```

## Responsive Design Considerations

### Mobile Portrait (Primary)

```
MOBILE PORTRAIT LAYOUT (375x812px)

┌─────────────────────────────────────────┐
│ Calendar (280px height)                 │
│ ├── Month navigation                    │
│ ├── Date grid with indicators           │
│ └── Compact legend (24px)               │
├─────────────────────────────────────────┤
│ Selected Date: Jan 15 (3 items)        │
├─────────────────────────────────────────┤
│ Items List (remaining height)           │
│ ├── SwipeableItemCard 1 (60px)         │
│ ├── SwipeableItemCard 2 (60px)         │
│ ├── SwipeableItemCard 3 (60px)         │
│ └── [scroll for more...]               │
└─────────────────────────────────────────┘
```

### Mobile Landscape

```
MOBILE LANDSCAPE LAYOUT (812x375px)

┌───────────────────┬─────────────────────┐
│ Calendar          │ Selected Items      │
│ (320px width)     │ (remaining width)   │
│                   │                     │
│ Month nav         │ Date: Jan 15        │
│ Date grid         │ ├── Item 1          │
│ Legend            │ ├── Item 2          │
│                   │ ├── Item 3          │
│                   │ └── [scroll...]     │
└───────────────────┴─────────────────────┘
```

### Tablet Considerations

```
TABLET LAYOUT (768x1024px) - Future Enhancement

┌─────────────────────────────────────────┐
│ Enhanced Calendar (50% width)           │
│ ├── Larger date grid                    │
│ ├── More visible indicators             │
│ └── Expanded legend                     │
├─────────────────────────────────────────┤
│ Items Grid View (2-3 columns)           │
│ ├── Larger swipeable cards              │
│ ├── More detailed information           │
│ └── Enhanced action buttons             │
└─────────────────────────────────────────┘
```

## Accessibility Design Patterns

### Screen Reader Experience

```
ENHANCED ACCESSIBILITY WIREFRAME

Calendar Date with Indicators:
┌─────────────────────────────────────────┐
│ [15] •                                  │
│                                         │
│ Accessibility Label:                    │
│ "January 15th, 3 items expiring:        │
│  1 critical, 1 warning, 1 safe.        │
│  Double tap to view items"              │
└─────────────────────────────────────────┘

Swipeable Item Card:
┌─────────────────────────────────────────┐
│ 🥛 Milk                         EXPIRED │
│                                         │
│ Accessibility Labels:                   │
│ "Milk, expired, in refrigerator.        │
│  Swipe right to mark as used.          │
│  Swipe left to extend expiry.          │
│  Double tap for details"                │
└─────────────────────────────────────────┘
```

### Keyboard Navigation

```
KEYBOARD NAVIGATION FLOW

Tab Order:
1. Month navigation (← →)
2. Calendar date grid (arrow keys)
3. Selected date items (↑ ↓)
4. Action buttons (Enter/Space)

Keyboard Shortcuts:
- Arrow keys: Navigate calendar dates
- Enter: Select date / activate action
- Space: Toggle item expansion
- Tab: Move between sections
- Shift+Tab: Reverse navigation
```

## Animation Specifications

### Calendar Date Selection

```
DATE SELECTION ANIMATION

Duration: 200ms
Easing: ease-out
Property: backgroundColor, scale

From: scale(1.0), backgroundColor: transparent
To: scale(1.05), backgroundColor: #007AFF20
```

### Swipe Gesture Feedback

```
SWIPE ANIMATION SEQUENCE

1. Gesture Recognition (50ms)
   - Haptic feedback: light impact
   - Card translation begins

2. Action Threshold (150ms)
   - Haptic feedback: medium impact
   - Action icon appears
   - Background color change

3. Action Completion (200ms)
   - Haptic feedback: success notification
   - Optimistic UI update
   - Card return animation
```

### Dot Indicator Appearance

```
DOT INDICATOR ANIMATION

On Data Load:
- Stagger appearance: 50ms per dot
- Scale from 0 to 1.0
- Fade from 0% to 100% opacity

On Data Update:
- Cross-fade between old/new colors
- Duration: 300ms
- Preserve position and size
```

## Implementation Guidelines

### Component Hierarchy

```
COMPONENT STRUCTURE

EnhancedExpiryCalendar
├── CalendarWithIndicators (new)
│   ├── react-native-calendars
│   ├── computed markedDates
│   └── urgency-based theming
├── CompactLegend (new)
├── SelectedDateHeader (enhanced)
└── SwipeableItemsList (enhanced)
    └── SwipeableItemCard (existing, enhanced)
```

### Data Flow Pattern

```
DATA TRANSFORMATION PIPELINE

1. foodItemsService.getItemsByExpiryDate()
   ↓
2. urgencyUtils.calculateUrgency() for each item
   ↓
3. calendarUtils.generateMarkedDates()
   ↓
4. Calendar renders with indicators
   ↓
5. User selects date → filtered items display
```

---

**Next Steps**: Phase 2 Task 2 - Interaction Pattern Design
**Status**: Wireframes Complete ✅
**Dependencies Met**: Ready for interaction design phase
