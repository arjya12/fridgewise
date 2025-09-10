# Swipe Action Specification - Calendar Interface

## Overview

This document defines the comprehensive swipe action system for food items in the FridgeWise calendar interface, specifying gestures, visual feedback, and backend integration.

## Core Swipe Actions

### Primary Actions (Always Available)

#### 1. Swipe Right → Mark as Used

**Gesture:** Horizontal swipe from left to right  
**Threshold:** 80px minimum, 120px for auto-complete  
**Visual Feedback:**

- Background Color: `#34C759` (Green)
- Icon: `checkmark-circle`
- Text: "Mark as Used"
- Haptic: Medium impact

**Backend Logic:**

```typescript
// Calls foodItemsService.logUsage()
await foodItemsService.logUsage(itemId, "used", quantity);
// Updates item quantity or removes if fully used
// Creates usage log entry
// Triggers achievement check (optional)
```

**Accessibility:**

- Screen Reader: "Swipe right to mark item as used"
- VoiceOver Action: "Mark as Used"

#### 2. Swipe Left → Extend Expiry

**Gesture:** Horizontal swipe from right to left  
**Threshold:** 80px minimum, 120px for auto-complete  
**Visual Feedback:**

- Background Color: `#FF9500` (Orange)
- Icon: `time`
- Text: "Extend Expiry"
- Haptic: Medium impact

**Backend Logic:**

```typescript
// Calls foodItemsService.updateItem()
const newExpiryDate = addDays(item.expiry_date, 3); // Default 3-day extension
await foodItemsService.updateItem(itemId, {
  expiry_date: newExpiryDate.toISOString().split("T")[0],
});
// Updates urgency calculation
// Triggers calendar refresh
```

**Accessibility:**

- Screen Reader: "Swipe left to extend expiry date"
- VoiceOver Action: "Extend Expiry"

## Secondary Actions (Context-Dependent)

### 3. Long Swipe Right → Quick Actions Menu

**Gesture:** Horizontal swipe > 200px to the right  
**Trigger:** Hold for 500ms after threshold  
**Visual Feedback:**

- Shows expandable menu with multiple options
- Background: Gradient from green to blue
- Haptic: Selection feedback

**Menu Options:**

- Mark as Used (full quantity)
- Mark as Partially Used (custom quantity)
- Move to Different Location
- Share/Gift to Someone

### 4. Long Swipe Left → Quick Delete

**Gesture:** Horizontal swipe > 200px to the left  
**Trigger:** Hold for 500ms after threshold  
**Visual Feedback:**

- Background Color: `#FF3B30` (Red)
- Icon: `trash`
- Text: "Delete Item"
- Haptic: Heavy impact

**Backend Logic:**

```typescript
// Requires confirmation dialog
Alert.alert("Delete Item", "This action cannot be undone", [
  { text: "Cancel" },
  {
    text: "Delete",
    style: "destructive",
    onPress: () => foodItemsService.deleteItem(itemId),
  },
]);
```

## Gesture Configuration

### Sensitivity Settings

```typescript
const SWIPE_CONFIG = {
  THRESHOLD: 80, // Minimum distance to trigger action preview
  COMPLETE_THRESHOLD: 120, // Distance for auto-complete
  LONG_SWIPE_THRESHOLD: 200, // Distance for secondary actions
  VELOCITY_THRESHOLD: 0.3, // Minimum velocity to trigger
  HOLD_DURATION: 500, // Hold time for long actions
  MAX_DISTANCE: 180, // Maximum swipe distance
};
```

### Animation Timing

```typescript
const ANIMATION_CONFIG = {
  PREVIEW_DURATION: 150, // Action preview animation
  COMPLETE_DURATION: 300, // Action completion animation
  RESET_DURATION: 250, // Return to neutral animation
  SCALE_FACTOR: 0.95, // Card scale during swipe
  HAPTIC_DELAY: 50, // Delay before haptic feedback
};
```

## Visual Feedback System

### Progressive Disclosure

1. **0-79px:** No visual feedback
2. **80-119px:** Action preview (icon + background color)
3. **120-199px:** Action ready (full opacity + scale effect)
4. **200px+:** Secondary action preview

### Color Coding

- **Green (#34C759):** Positive actions (Mark as Used)
- **Orange (#FF9500):** Neutral actions (Extend Expiry)
- **Blue (#007AFF):** Information actions (Quick Menu)
- **Red (#FF3B30):** Destructive actions (Delete)

### Icon System

```typescript
const SWIPE_ICONS = {
  used: "checkmark-circle",
  extend: "time",
  menu: "ellipsis-horizontal-circle",
  delete: "trash",
  partial: "remove-circle",
  move: "move",
  share: "share",
};
```

## State Management

### Swipe State Machine

```typescript
type SwipeState =
  | "none" // No active swipe
  | "preview" // Action being previewed
  | "ready" // Action ready to execute
  | "completing" // Action being executed
  | "resetting"; // Returning to neutral

type SwipeAction = "none" | "used" | "extend" | "quickMenu" | "delete";
```

### Animation Values

```typescript
interface SwipeAnimationState {
  translateX: Animated.Value; // Horizontal position
  scale: Animated.Value; // Card scale
  actionOpacity: Animated.Value; // Background opacity
  iconScale: Animated.Value; // Icon scaling
}
```

## Error Handling

### Network Failures

- Show retry option in swipe feedback
- Cache action for offline execution
- Visual indication of pending state

### Validation Errors

- Prevent invalid actions (e.g., extend already expired items)
- Show contextual error messages
- Graceful fallback to default behavior

### Performance Optimization

- Debounce gesture events (16ms)
- Use native driver for animations
- Minimize re-renders during swipe

## Integration Points

### Service Layer

```typescript
interface SwipeActionService {
  markAsUsed(itemId: string, quantity?: number): Promise<void>;
  extendExpiry(itemId: string, days?: number): Promise<void>;
  deleteItem(itemId: string): Promise<void>;
  moveItem(itemId: string, location: string): Promise<void>;
}
```

### Calendar Integration

- Refresh calendar after successful actions
- Update dot indicators based on new urgency
- Animate calendar changes smoothly

### Analytics Events

```typescript
interface SwipeAnalytics {
  swipe_action_started: { action: string; itemId: string };
  swipe_action_completed: { action: string; itemId: string; success: boolean };
  swipe_action_cancelled: { action: string; itemId: string; reason: string };
}
```

## Testing Requirements

### Unit Tests

- Gesture recognition accuracy
- Animation completion
- State transitions
- Error handling

### Integration Tests

- Backend service calls
- Calendar updates
- Analytics events
- Offline behavior

### Accessibility Tests

- Screen reader compatibility
- VoiceOver action availability
- Reduced motion respect
- High contrast support

## Platform Considerations

### iOS Specific

- Respect iOS swipe conventions
- Support iOS haptic engine
- Handle safe area insets

### Android Specific

- Material Design swipe patterns
- Android haptic patterns
- Handle navigation gestures

## Future Enhancements

### Smart Actions

- Context-aware swipe suggestions
- Learning user preferences
- Adaptive thresholds

### Advanced Gestures

- Multi-finger gestures for batch actions
- Pressure-sensitive actions (3D Touch)
- Voice-guided swipe actions

### Customization

- User-configurable swipe directions
- Custom action assignments
- Sensitivity adjustments

---

**Document Status:** Draft v1.0  
**Last Updated:** Phase 1 Implementation  
**Dependencies:** SwipeableItemCard.tsx, foodItemsService.ts, urgencyUtils.ts
