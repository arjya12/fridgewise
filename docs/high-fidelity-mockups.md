# High-Fidelity Mockups - Complete User Experience Flow

## Overview

This document presents detailed high-fidelity mockups demonstrating the complete enhanced calendar experience, incorporating all design decisions from visual hierarchy, interaction patterns, accessibility features, animations, and responsive design.

## Core User Journey Mockups

### 1. Calendar Overview with Date Indicators

```
HIGH-FIDELITY MOBILE MOCKUP (375x812px)

┌─────────────────────────────────────────┐
│ ◀ FridgeWise                      ⚙️ 👤 │ Header (60px)
├─────────────────────────────────────────┤
│                January 2024       ◀ ▶  │ Month Nav (44px)
├─────────────────────────────────────────┤
│  S   M   T   W   T   F   S             │ Calendar (280px)
│      1   2   3   4   5   6             │
│  7   8   9• 10  11• 12• 13             │ ← Dots show urgency
│ 14  15• 16  17• 18  19  20             │
│ 21  22  23  24• 25  26  27             │
│ 28  29  30  31                         │
├─────────────────────────────────────────┤
│ •Critical •Warning •Soon •Safe          │ Legend (24px)
├─────────────────────────────────────────┤
│ Thursday, January 11 (3 items)         │ Date Header (48px)
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │ Items List
│ │▌🥛 Milk                     EXPIRED│ │ (remaining)
│ │ Refrigerator • Qty: 1            ← │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │▌🥬 Lettuce                  WARNING│ │
│ │ Refrigerator • Qty: 1            ← │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │▌🧀 Cheese                      SAFE│ │
│ │ Refrigerator • Qty: 1            ← │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ 🏠 📅 ➕ 📊 👤                         │ Tab Bar (60px)
└─────────────────────────────────────────┘

Visual Elements Detail:
├── Critical dot (Jan 9): #EF4444, 6px, prominent
├── Warning dots (Jan 11, 12): #F97316, 6px
├── Soon dot (Jan 15): #EAB308, 6px
├── Safe dots: #22C55E, 6px, subtle
├── Selected date (Jan 11): Blue highlight #007AFF
├── Item cards: Left accent borders, urgency colors
├── Swipe hints: "←" arrows suggesting gesture
└── Typography: Clear hierarchy, accessible contrast
```

### 2. Swipe Action Sequence

```
SWIPE GESTURE INTERACTION SEQUENCE

State 1: Rest (No Interaction)
┌─────────────────────────────────────────┐
│ ┌─────────────────────────────────────┐ │
│ │▌🥛 Milk                     EXPIRED│ │
│ │ Refrigerator • Qty: 1            ← │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘

State 2: Gesture Recognition (20px swipe)
┌─────────────────────────────────────────┐
│ ┌─────────────────────────────────────┐ │
│ │[✓] ▌🥛 Milk                EXPIRED  │ │ ← Hint appears
│ │    Refrigerator • Qty: 1           │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘

State 3: Action Threshold (120px swipe)
┌─────────────────────────────────────────┐
│ ┌─────────────────────────────────────┐ │
│ │[✓ USED] ▌🥛 Milk           EXPIRED  │ │ ← Full action
│ │         Refrigerator • Qty: 1       │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘

State 4: Commitment (200px+ swipe)
┌─────────────────────────────────────────┐
│ ┌─────────────────────────────────────┐ │
│ │  ✓ USED   🥛 Milk         EXPIRED   │ │ ← Full green bg
│ │           Refrigerator • Qty: 1     │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘

Visual Animation Details:
├── Phase 1→2: Icon fade-in (150ms ease-out)
├── Phase 2→3: Background expand, text appear
├── Phase 3→4: Full background color, white text
├── Haptic: Light → Medium → Success notification
├── Colors: Green (#22C55E) for "Mark Used"
└── Return: Spring animation back to rest (250ms)
```

### 3. Extend Expiry Modal Flow

```
RIGHT SWIPE → EXTEND EXPIRY MODAL

Step 1: Right Swipe Gesture
┌─────────────────────────────────────────┐
│ ┌─────────────────────────────────────┐ │
│ │ 🥛 Milk            EXPIRED   → [+3d]│ │ ← Right swipe hint
│ │ Refrigerator • Qty: 1               │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘

Step 2: Modal Presentation (slide up from bottom)
┌─────────────────────────────────────────┐
│ [Background dimmed 50%]                 │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Extend Expiry for Milk              │ │ ← Modal header
│ │ ─────────────────────────────────── │ │
│ │ Quick Options:                      │ │
│ │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────────┐ │ │
│ │ │ +1d │ │ +3d │ │ +1w │ │ Custom  │ │ │ ← Quick buttons
│ │ └─────┘ └─────┘ └─────┘ └─────────┘ │ │
│ │                                     │ │
│ │ New expiry: January 14, 2024        │ │ ← Preview
│ │                                     │ │
│ │ ┌────────┐ ┌──────────────────────┐ │ │
│ │ │ Cancel │ │ Extend by 3 days     │ │ │ ← Actions
│ │ └────────┘ └──────────────────────┘ │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘

Step 3: Success Confirmation
┌─────────────────────────────────────────┐
│ ┌─────────────────────────────────────┐ │
│ │▌🥛 Milk                        SOON│ │ ← Updated status
│ │ Refrigerator • Exp: Jan 14         │ │ ← New date
│ └─────────────────────────────────────┘ │
│                                         │
│ ✅ Expiry extended by 3 days            │ ← Success toast
└─────────────────────────────────────────┘

Modal Design Details:
├── Backdrop: 50% black overlay with blur
├── Modal: Rounded corners (16px), white background
├── Animation: Slide up 400ms ease-out
├── Quick options: Touch-friendly buttons (44pt)
├── Focus: Automatic to first option for accessibility
├── Dismissal: Swipe down or tap Cancel
└── Success feedback: Toast + haptic + updated card
```

### 4. Calendar Dot Indicator Detail Views

```
CALENDAR DATE INDICATOR SPECIFICATIONS

Individual Date Cell (44x44pt):
┌─────────────────────┐
│        15           │ ← Date number (16sp, center)
│                     │
│         •           │ ← Urgency dot (6px, centered)
│                     │   Position: 2px below number
└─────────────────────┘

Urgency Dot Color System:
Critical Date (Jan 9):
┌─────────────────────┐
│         9           │
│         ●           │ ← Red dot #EF4444, 6px
└─────────────────────┘

Warning Date (Jan 11):
┌─────────────────────┐
│        11           │
│         ●           │ ← Orange dot #F97316, 6px
└─────────────────────┘

Soon Date (Jan 15):
┌─────────────────────┐
│        15           │
│         ●           │ ← Yellow dot #EAB308, 6px
└─────────────────────┘

Safe Date (Jan 20):
┌─────────────────────┐
│        20           │
│         ●           │ ← Green dot #22C55E, 6px
└─────────────────────┘

Selected Date with Indicator:
┌─────────────────────┐
│ ╔═══════════════╗   │
│ ║      11       ║   │ ← Blue selection #007AFF
│ ║       ●       ║   │ ← Dot maintains urgency color
│ ╚═══════════════╝   │
└─────────────────────┘

Accessibility Labels:
├── "January 9th, 2 items expiring: 1 critical, 1 warning"
├── "January 11th, 3 items expiring: 1 warning, 2 safe"
├── "January 15th, 1 item expiring in 4 days"
└── "January 20th, 2 items, all safe for 8+ days"
```

### 5. Tablet Landscape Enhanced Layout

```
TABLET LANDSCAPE MOCKUP (1024x768px)

┌──────────┬─────────────────────────┬──────────────┐
│ Sidebar  │ Main Calendar           │ Inspector    │
│ (200px)  │ (600px)                 │ (224px)      │
│          │                         │              │
│ 📅 Views │ ┌─────────────────────┐ │ Selected:    │
│ • Month  │ │   January 2024   ◀▶│ │ Jan 11       │
│ • Week   │ └─────────────────────┘ │              │
│ • Day    │                         │ 📊 3 items   │
│          │  S  M  T  W  T  F  S    │ • 1 Critical │
│ 🔍 Search│     1  2  3  4  5  6    │ • 1 Warning  │
│ [____]   │  7  8  9• 10 11• 12•   │ • 1 Safe     │
│          │ 14 15• 16 17• 18 19     │              │
│ 📂 Filter│ 21 22 23 24• 25 26     │ 🚀 Actions   │
│ • Critical│ 28 29 30 31           │ [Mark All]   │
│ • Warning│                         │ [Extend All] │
│ • All    │ •Critical •Warning      │ [Details]    │
│          │ •Soon •Safe             │              │
│ ⚙️ Settings│                        │ 📈 Analytics │
│ 👤 Profile│ ┌─────────────────────┐ │ This week:   │
│          │ │ Items for Jan 11:   │ │ • 12 used    │
│          │ │                     │ │ • 3 extended │
│          │ │ [Grid View][List]   │ │ • 1 expired  │
│          │ ├─────────────────────┤ │              │
│          │ │ ┌─────┐ ┌─────┐     │ │ 📋 Quick     │
│          │ │ │Item1│ │Item2│     │ │ [Add Item]   │
│          │ │ │🥛   │ │🥬   │     │ │ [Scan Code]  │
│          │ │ └─────┘ └─────┘     │ │ [Shopping]   │
│          │ │ ┌─────┐ ┌─────┐     │ │              │
│          │ │ │Item3│ │Item4│     │ │              │
│          │ │ │🧀   │ │     │     │ │              │
│          │ │ └─────┘ └─────┘     │ │              │
│          │ └─────────────────────┘ │              │
└──────────┴─────────────────────────┴──────────────┘

Tablet Enhancement Features:
├── Multi-panel layout for better information density
├── Enhanced calendar grid (large cells, clearer dots)
├── Sidebar navigation for quick access to features
├── Inspector panel for detailed item information
├── Grid view for items with improved visual scanning
├── Advanced filters and search capabilities
├── Analytics panel for usage insights
└── Hover states and enhanced pointer interactions
```

### 6. Dark Mode Adaptations

```
DARK MODE HIGH-FIDELITY MOCKUP

Calendar in Dark Mode:
┌─────────────────────────────────────────┐
│ ◀ FridgeWise              🌙      ⚙️ 👤 │ ← Dark header #1C1C1E
├─────────────────────────────────────────┤
│                January 2024       ◀ ▶  │ ← Text #FFFFFF
├─────────────────────────────────────────┤
│  S   M   T   W   T   F   S             │ ← Background #2C2C2E
│      1   2   3   4   5   6             │
│  7   8   9• 10  11• 12• 13             │ ← Enhanced dots
│ 14  15• 16  17• 18  19  20             │   Brighter colors
│ 21  22  23  24• 25  26  27             │
│ 28  29  30  31                         │
├─────────────────────────────────────────┤
│ •Critical •Warning •Soon •Safe          │ ← Legend #EBEBF5
├─────────────────────────────────────────┤
│ Thursday, January 11 (3 items)         │ ← Header #48484A
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │▌🥛 Milk                     EXPIRED│ │ ← Card #2C2C2E
│ │ Refrigerator • Qty: 1              │ │   Border #FF6B6B
│ └─────────────────────────────────────┘ │   Text #FFFFFF
│ ┌─────────────────────────────────────┐ │
│ │▌🥬 Lettuce                  WARNING│ │
│ │ Refrigerator • Qty: 1              │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ 🏠 📅 ➕ 📊 👤                         │ ← Tab bar #1C1C1E
└─────────────────────────────────────────┘

Dark Mode Color Adjustments:
├── Critical: #FF6B6B (brighter red for contrast)
├── Warning: #FFB84D (brighter orange)
├── Soon: #FFD93D (brighter yellow)
├── Safe: #51D88A (brighter green)
├── Background: #1C1C1E (primary dark)
├── Cards: #2C2C2E (elevated surface)
├── Text: #FFFFFF (primary) / #EBEBF5 (secondary)
└── Borders: Maintained urgency colors, high contrast
```

### 7. Accessibility-Focused Mockup

```
ACCESSIBILITY-ENHANCED INTERFACE

High Contrast Mode:
┌─────────────────────────────────────────┐
│ ◀ FridgeWise                      ⚙️ 👤 │ ← Bold borders
├─────────────────────────────────────────┤
│                January 2024       ◀ ▶  │ ← High contrast text
├─────────────────────────────────────────┤
│  S   M   T   W   T   F   S             │ ← Enhanced contrast
│      1   2   3   4   5   6             │   7:1+ ratios
│  7   8   9⚠ 10  11⚠ 12⚠ 13             │ ← Icons replace dots
│ 14  15⚡ 16  17⚡ 18  19  20             │   Non-color indicators
│ 21  22  23  24⚠ 25  26  27             │
│ 28  29  30  31                         │
├─────────────────────────────────────────┤
│ ⚠Critical ⚡Warning 🕐Soon ✅Safe       │ ← Icon legend
├─────────────────────────────────────────┤
│ [Focus Ring] Thursday, Jan 11 (3 items)│ ← Clear focus indicator
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │■🥛 Milk                     EXPIRED│ │ ← Bold borders
│ │ Refrigerator • Qty: 1              │ │   High contrast
│ │ [Mark Used] [Extend] [Details]     │ │ ← Button alternatives
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤

Screen Reader Optimization:
├── Semantic markup with proper roles
├── Comprehensive accessibility labels
├── Logical tab order and focus management
├── Live regions for dynamic content updates
├── Custom actions for gesture alternatives
├── Descriptive error and success messages
└── Keyboard shortcut alternatives to gestures

Reduced Motion Adaptation:
├── Disabled: Swipe animations, calendar transitions
├── Simplified: Instant state changes, fade effects only
├── Maintained: Focus indicators, loading states
├── Enhanced: Button-based action alternatives
└── Preserved: Essential feedback and confirmations
```

### 8. Error States and Edge Cases

```
ERROR STATE MOCKUPS

Network Error State:
┌─────────────────────────────────────────┐
│ ◀ FridgeWise                      ⚙️ 👤 │
├─────────────────────────────────────────┤
│ 📡 Connection Lost                      │ ← Error banner
│ Some features may be limited            │
├─────────────────────────────────────────┤
│                January 2024       ◀ ▶  │
│ [Showing cached data]                   │ ← Status indicator
├─────────────────────────────────────────┤
│  S   M   T   W   T   F   S             │
│      1   2   3   4   5   6             │
│  7   8   9? 10  11? 12? 13             │ ← Uncertain indicators
│ 14  15? 16  17? 18  19  20             │
│ [Retry Connection]                      │ ← Action button
└─────────────────────────────────────────┘

Empty State:
┌─────────────────────────────────────────┐
│ Thursday, January 11 (0 items)         │
├─────────────────────────────────────────┤
│                                         │
│        📅                              │ ← Large icon
│                                         │
│    No items expiring today             │ ← Clear message
│                                         │
│    Add items to your inventory to      │ ← Helpful guidance
│    track expiration dates              │
│                                         │
│    ┌─────────────────────────────────┐ │
│    │        Add First Item           │ │ ← Primary action
│    └─────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘

Loading State:
┌─────────────────────────────────────────┐
│ Thursday, January 11                    │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │ ← Skeleton cards
│ │ ████████████████████████████████   │ │   Animated pulse
│ │ ████████████████████████████       │ │   1.5s cycle
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ ████████████████████████████████   │ │
│ │ ████████████████████████████       │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Loading items...                       │ ← Status text
└─────────────────────────────────────────┘

Action Failure:
┌─────────────────────────────────────────┐
│ ┌─────────────────────────────────────┐ │
│ │▌🥛 Milk                     EXPIRED│ │ ← Shake animation
│ │ Refrigerator • Qty: 1              │ │   Error state
│ └─────────────────────────────────────┘ │
│                                         │
│ ❌ Failed to mark as used              │ ← Error message
│ [Retry] [Cancel]                       │ ← Recovery actions
└─────────────────────────────────────────┘
```

## Interactive Flow Demonstrations

### 1. Complete User Journey Map

```
USER JOURNEY: "CHECKING EXPIRING ITEMS"

Step 1: App Launch
├── Splash screen with app logo
├── Load user data and preferences
├── Display calendar with current date selected
└── Show today's expiring items immediately

Step 2: Scan Calendar for Urgency
├── User sees dots on calendar dates
├── Critical items immediately visible (red dots)
├── Quick visual scan identifies urgent dates
└── Accessibility: Screen reader announces overview

Step 3: Select Urgent Date
├── Tap date with critical indicator
├── Calendar animates selection (scale + color)
├── Items list updates with filtered items
└── Focus moves to items list for screen readers

Step 4: Review Critical Item
├── Item displayed with red urgency styling
├── Clear expiry information and location
├── Swipe hint visible for quick action
└── All essential information at a glance

Step 5: Take Action (Mark as Used)
├── Left swipe gesture initiated
├── Progressive visual feedback during swipe
├── Haptic feedback at recognition and threshold
├── Action completion with success confirmation

Step 6: Verify Changes
├── Item removed/updated in list
├── Calendar dot indicator updates automatically
├── Success message provides clear feedback
└── Focus management for continued interaction

Complete Journey Time: ~30 seconds
User Satisfaction: High efficiency for daily task
```

### 2. Accessibility User Journey

```
SCREEN READER USER JOURNEY

Step 1: VoiceOver Navigation
├── "Calendar, January 2024"
├── "Previous month button"
├── "Next month button"
├── "Calendar grid, 7 columns"

Step 2: Date Selection
├── "January 9th, 2 items expiring: 1 critical, 1 warning. Button."
├── User double-taps to select
├── "January 9th selected"
├── "Items for January 9th, 2 items"

Step 3: Item Review
├── "Milk, critical urgency, expires today"
├── "Located in refrigerator, dairy section"
├── "Quantity: 1 unit"
├── "Actions available: Mark as used, Extend expiry, View details"

Step 4: Action Execution
├── User activates "Mark as used" custom action
├── "Marking milk as used"
├── [Brief pause for processing]
├── "Milk marked as used successfully"
├── "Items updated, 1 item remaining"

Alternative: Button Interface (when gestures disabled)
├── "Mark as used button"
├── "Extend expiry button"
├── "View details button"
├── Standard button activation with space/enter
└── Same success feedback pattern
```

## Implementation Specifications

### 1. Component Architecture

````
COMPONENT IMPLEMENTATION STRUCTURE

<EnhancedExpiryCalendar>
├── <CalendarWithIndicators>
│   ├── <Calendar> (react-native-calendars)
│   ├── <UrgencyDotIndicators>
│   └── <AccessibilityLabels>
├── <CompactLegend>
├── <SelectedDateHeader>
└── <EnhancedItemsList>
    ├── <SwipeableItemCard>
    │   ├── <ItemContent>
    │   ├── <SwipeActions>
    │   └── <AccessibilityActions>
    ├── <ExtendExpiryModal>
    └── <EmptyState>

Key Props Interface:
```typescript
interface EnhancedCalendarProps {
  itemsByDate: Record<string, FoodItemWithUrgency[]>;
  selectedDate: string;
  onDateSelect: (date: string) => void;
  onItemAction: (action: ItemAction) => Promise<void>;
  isLoading: boolean;
  error?: string;
  theme: 'light' | 'dark';
  reducedMotion: boolean;
  screenReader: boolean;
}
````

```

### 2. Performance Specifications
```

PERFORMANCE REQUIREMENTS

Loading Performance:
├── Initial render: < 100ms (local data)
├── Network requests: < 2s (with loading states)
├── Calendar month change: < 150ms
├── Item list update: < 100ms
└── Animation frame rate: 60fps sustained

Memory Usage:
├── Base memory: < 50MB
├── Large dataset (1000+ items): < 100MB
├── Memory growth: < 10MB per month of data
├── Garbage collection: Efficient cleanup
└── Image loading: Lazy-loaded, cached

Battery Optimization:
├── Background processing: Minimal
├── Animation efficiency: Native driver usage
├── Network efficiency: Batch requests
├── CPU usage: < 5% average during use
└── Thermal management: No excessive heating

Accessibility Performance:
├── Screen reader announcement delay: < 100ms
├── Focus management: Immediate
├── Large text scaling: No performance impact
├── High contrast mode: No degradation
└── Voice control response: < 200ms

```

---

**Status**: High-Fidelity Mockups Complete ✅
**Phase 2 Design Complete**: All design tasks finished
**Next**: Ready for Phase 3 Implementation

## Phase 2 Summary

Successfully completed all Phase 2 design tasks:
✅ Component wireframes with detailed layouts
✅ Interaction patterns with gesture specifications
✅ Accessibility design with WCAG 2.1 compliance
✅ Visual hierarchy with urgency-based prioritization
✅ Animation specifications with performance optimization
✅ Responsive design for all device types
✅ High-fidelity mockups showing complete user flows

**Ready to proceed to Phase 3: Implementation** 🚀
```
