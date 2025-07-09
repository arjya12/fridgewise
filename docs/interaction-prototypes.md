# Interaction Prototypes - Swipe Gesture Specifications

## Overview

This document defines the precise interaction patterns, gesture thresholds, and visual feedback for swipe actions on item cards within the enhanced calendar experience.

## Gesture Interaction Flow

### 1. Gesture Recognition Pattern

```
SWIPE GESTURE LIFECYCLE

Phase 1: Recognition (0-50ms)
├── User finger touches item card
├── Pan gesture detector activates
├── Initial touch position recorded
└── Gesture direction determined

Phase 2: Feedback (50-200ms)
├── Visual feedback begins
├── Card translation animation starts
├── Action hint appears
└── Light haptic feedback triggers

Phase 3: Threshold (200-400ms)
├── User crosses action threshold
├── Action commitment visual appears
├── Medium haptic feedback triggers
└── Background color intensifies

Phase 4: Completion (400ms+)
├── User releases or reaches full swipe
├── Action executes with optimistic UI
├── Success haptic feedback triggers
└── Card returns to neutral position
```

### 2. Gesture Thresholds & Distances

```
SWIPE DISTANCE SPECIFICATIONS

Card Width: 100% (375px on iPhone)
Recognition Threshold: 20px (5% of width)
Action Threshold: 120px (32% of width)
Full Commitment: 200px (53% of width)
Maximum Translation: 280px (75% of width)

Visual Feedback Zones:
├── 0-20px: No feedback
├── 20-120px: Hint feedback
├── 120-200px: Commitment zone
└── 200px+: Action execution zone
```

### 3. Direction-Specific Actions

```
LEFT SWIPE → MARK AS USED
┌─────────────────────────────────────────┐
│ [✓ USED] ← 🥛 Milk            EXPIRED   │
│              Refrigerator • Qty: 1      │
└─────────────────────────────────────────┘

Gesture: Pan left 120px+
Action: foodItemsService.logUsage(item.id, 'used')
Visual: Green checkmark icon + "USED" label
Haptic: Success notification pattern
Result: Item quantity decrements or removes

RIGHT SWIPE → EXTEND EXPIRY
┌─────────────────────────────────────────┐
│ 🥛 Milk                 EXPIRED → [+3d] │
│ Refrigerator • Qty: 1                   │
└─────────────────────────────────────────┘

Gesture: Pan right 120px+
Action: Show quick extend options modal
Visual: Calendar icon + "+3d" quick option
Haptic: Selection feedback pattern
Result: Expiry date extended by selected days
```

## Visual Feedback Specifications

### 1. Card Translation Animation

```
CARD MOVEMENT ANIMATION

Properties:
├── translateX: Linear with gesture
├── scale: Subtle 0.98-1.0 range
├── opacity: 0.9-1.0 range for depth
└── zIndex: Elevated during interaction

Timing Function:
├── Follow: Direct 1:1 with finger
├── Return: ease-out, 250ms duration
└── Snap: spring animation (tension: 200)

Performance:
├── Use native driver: true
├── 60fps smooth animation
└── Gesture handler optimization
```

### 2. Action Hint Appearance

```
ACTION HINT VISUAL DESIGN

Left Swipe Hint (Mark as Used):
┌─────────────────────────────────────────┐
│ [✓] ← 🥛 Milk                   EXPIRED │
│         Refrigerator • Qty: 1           │
└─────────────────────────────────────────┘

Elements:
├── Icon: ✓ checkmark (20px, white)
├── Background: Green gradient (#22C55E to #16A34A)
├── Position: Left edge, centered vertically
├── Animation: Fade in 150ms, scale 0.8→1.0
└── Label: "USED" text (12px, bold, white)

Right Swipe Hint (Extend Expiry):
┌─────────────────────────────────────────┐
│ 🥛 Milk                    EXPIRED → [+]│
│ Refrigerator • Qty: 1                   │
└─────────────────────────────────────────┘

Elements:
├── Icon: + calendar (20px, white)
├── Background: Blue gradient (#3B82F6 to #1D4ED8)
├── Position: Right edge, centered vertically
├── Animation: Fade in 150ms, scale 0.8→1.0
└── Label: "+3d" quick option (12px, bold, white)
```

### 3. Commitment Zone Feedback

```
ACTION COMMITMENT VISUAL CHANGES

Threshold Crossed (120px+):
├── Card shadow: Elevated (0, 4, 12, rgba(0,0,0,0.15))
├── Background tint: Action color at 20% opacity
├── Icon scale: 1.0 → 1.2 (bounce effect)
├── Haptic: Medium impact feedback
└── Audio: Optional subtle click sound

Full Commitment (200px+):
├── Background: Full action color
├── Icon + text: Fully opaque white
├── Card scale: 0.98 (slightly compressed)
├── Haptic: Success notification
└── Ready for release execution
```

## Haptic Feedback Pattern

### 1. Feedback Timing Sequence

```
HAPTIC FEEDBACK PROGRESSION

Touch Start (0ms):
├── Type: None (avoid over-feedback)
├── Reason: User is exploring
└── Wait for clear intent

Gesture Recognition (50ms):
├── Type: Light impact
├── Trigger: 20px movement threshold
├── Purpose: Confirm gesture started
└── Duration: 10ms

Action Threshold (120px):
├── Type: Medium impact
├── Trigger: Action zone entered
├── Purpose: Signal commitment point
└── Duration: 15ms

Action Completion (Release):
├── Type: Notification success
├── Trigger: Action execution
├── Purpose: Confirm successful action
└── Duration: 20ms
```

### 2. Platform-Specific Implementation

```
IOS HAPTIC PATTERNS

Light Impact: UIImpactFeedbackGenerator(.light)
Medium Impact: UIImpactFeedbackGenerator(.medium)
Success: UINotificationFeedbackGenerator(.success)

ANDROID HAPTIC PATTERNS

Light Impact: HapticFeedbackConstants.CONTEXT_CLICK
Medium Impact: HapticFeedbackConstants.KEYBOARD_TAP
Success: HapticFeedbackConstants.CONFIRM
```

## Gesture State Management

### 1. State Machine Design

```
SWIPE GESTURE STATE MACHINE

States:
├── IDLE: No gesture active
├── RECOGNIZING: Touch detected, analyzing
├── ACTIVE: Gesture confirmed, following finger
├── COMMITTED: Threshold crossed, action ready
├── EXECUTING: Action in progress
└── RETURNING: Returning to neutral position

Transitions:
IDLE → RECOGNIZING: onPanGestureHandlerStateChange
RECOGNIZING → ACTIVE: movement > 20px
ACTIVE → COMMITTED: movement > 120px
COMMITTED → EXECUTING: gesture release
EXECUTING → RETURNING: action completion
RETURNING → IDLE: animation complete
```

### 2. Error States & Recovery

```
GESTURE ERROR HANDLING

Canceled Gesture:
├── Trigger: User returns to start position
├── Animation: Spring back to neutral
├── Duration: 200ms ease-out
├── Haptic: None (avoid negative feedback)
└── State: ACTIVE → RETURNING → IDLE

Failed Action:
├── Trigger: Backend/network error
├── Animation: Shake effect (±10px, 3 cycles)
├── Duration: 400ms
├── Haptic: Error notification
└── Visual: Error toast message

Interrupted Gesture:
├── Trigger: Phone call, app backgrounded
├── Action: Immediate return to neutral
├── State: Any → IDLE
├── Cleanup: Cancel pending animations
└── Recovery: Resume from clean state
```

## Accessibility Interaction Patterns

### 1. Screen Reader Gesture Support

```
ACCESSIBILITY GESTURE ALTERNATIVES

Standard Screen Reader Actions:
├── Double-tap: Open item details
├── Triple-tap: Quick actions menu
├── Swipe up: Next item action
├── Swipe down: Previous item action
└── Two-finger tap: Mark as used shortcut

Voice Control Support:
├── "Mark as used [item name]"
├── "Extend [item name]"
├── "Show actions for [item name]"
└── "Select item [number]"

Custom Action Support:
├── accessibilityActions: [markUsed, extendExpiry]
├── Clear action labels with context
├── Confirmation prompts for destructive actions
└── Keyboard navigation fallbacks
```

### 2. Reduced Motion Considerations

```
REDUCED MOTION ADAPTATIONS

When prefers-reduced-motion is enabled:
├── Disable swipe-to-action gestures
├── Show action buttons instead
├── Remove spring animations
├── Use fade transitions only
└── Maintain haptic feedback

Alternative Action Interface:
┌─────────────────────────────────────────┐
│ 🥛 Milk                         EXPIRED │
│ Refrigerator • Qty: 1                   │
│ [✓ Mark Used] [📅 Extend] [👁 Details] │
└─────────────────────────────────────────┘
```

## Performance Optimization Patterns

### 1. Gesture Handler Optimization

```
PERFORMANCE CONSIDERATIONS

Native Driver Usage:
├── translateX: ✅ Native animated
├── opacity: ✅ Native animated
├── backgroundColor: ❌ JS thread (minimal use)
├── scale: ✅ Native animated
└── zIndex: ❌ Layout-affecting (avoid during gesture)

Debouncing & Throttling:
├── Haptic feedback: Debounce 50ms
├── State updates: Throttle to 60fps
├── API calls: Debounce 100ms after gesture end
└── Analytics: Batch gesture events

Memory Management:
├── Remove listeners on unmount
├── Cancel animations on gesture cancel
├── Pool gesture recognizer instances
└── Lazy-load action icons
```

### 2. Gesture Conflict Resolution

```
GESTURE PRIORITY SYSTEM

ScrollView Conflicts:
├── Horizontal pan: Item card wins
├── Vertical pan: ScrollView wins
├── Diagonal pan: Angle-based priority
└── Simultaneous: Block scroll during swipe

Multiple Card Interactions:
├── One active gesture at a time
├── Cancel other cards when one starts
├── Queue subsequent gestures
└── Clear visual state on switch

Platform Differences:
├── iOS: More sensitive touch detection
├── Android: Slightly higher thresholds
├── Tablet: Larger swipe distances
└── Web: Mouse/trackpad adaptations
```

## Integration with Existing Components

### 1. SwipeableItemCard Enhancement

```
COMPONENT INTERFACE UPDATES

Current SwipeableItemCard:
├── onPress: () => void
├── onDelete: () => void
├── item: FoodItemWithUrgency
└── isExpanded: boolean

Enhanced SwipeableItemCard:
├── onPress: () => void (unchanged)
├── onMarkUsed: (item: FoodItem) => Promise<void>
├── onExtendExpiry: (item: FoodItem, days: number) => Promise<void>
├── onDelete: () => void (unchanged)
├── item: FoodItemWithUrgency (unchanged)
├── isExpanded: boolean (unchanged)
├── gestureEnabled: boolean = true
└── accessibilityActions: CustomAction[]
```

### 2. Calendar Integration Points

```
CALENDAR COMPONENT INTEGRATION

EnhancedExpiryCalendar:
├── Maintains existing onItemPress interface
├── Adds swipe action event handling
├── Updates item state optimistically
├── Refreshes calendar markers on change
└── Syncs with backend asynchronously

State Management:
├── Local: Gesture state, animations
├── Context: Item updates, optimistic state
├── Service: Backend synchronization
└── Cache: Invalidation on item changes
```

---

**Status**: Interaction Patterns Complete ✅  
**Next**: Phase 2 Task 3 - Accessibility Design
**Dependencies**: All interaction specs ready for accessibility enhancement
