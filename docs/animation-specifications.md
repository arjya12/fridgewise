# Animation Specifications

## Overview

This document defines comprehensive animation specifications for the enhanced calendar experience, ensuring smooth, performant, and accessible motion design across all interactive elements.

## Animation Design Principles

### 1. Motion Design Philosophy

```
ANIMATION DESIGN PRINCIPLES

Purposeful Motion:
├── Every animation serves a functional purpose
├── Guides user attention to important changes
├── Provides feedback for user actions
├── Reduces cognitive load through predictable motion
└── Enhances perceived performance

Performance First:
├── Native driver usage for all transforms
├── 60fps target for all animations
├── Minimal main thread blocking
├── Efficient memory usage
└── Battery-conscious implementation

Accessibility Awareness:
├── Respects prefers-reduced-motion settings
├── Essential feedback preserved in reduced motion
├── Focus management during animations
├── Screen reader friendly transitions
└── No motion-induced seizure risks
```

### 2. Animation Hierarchy System

```
ANIMATION PRIORITY LEVELS

Critical Animations (Always Execute):
├── Focus indicators for accessibility
├── Loading states for user feedback
├── Error states for important information
├── Success confirmations for completed actions
└── Data state transitions

Enhanced Animations (Conditional):
├── Swipe gesture feedback
├── Calendar date selection effects
├── Item card hover states
├── Transition between views
└── Decorative motion effects

Disabled in Reduced Motion:
├── Attention-getting animations
├── Parallax effects
├── Complex spring animations
├── Auto-playing motion
└── Non-essential transitions
```

## Calendar Animation Specifications

### 1. Date Selection Animations

````
DATE SELECTION ANIMATION SEQUENCE

Phase 1: Selection Recognition (0-100ms)
├── Trigger: User taps calendar date
├── Effect: Immediate visual feedback
├── Properties: backgroundColor, scale
├── Duration: 100ms
├── Easing: ease-out
├── Native: true (backgroundColor not native)
└── Haptic: Light impact feedback

Animation Properties:
From State:
├── backgroundColor: transparent
├── scale: 1.0
├── opacity: 1.0
└── borderRadius: 4px

To State:
├── backgroundColor: #007AFF (selection blue)
├── scale: 1.05
├── opacity: 1.0
└── borderRadius: 8px

Implementation:
```javascript
const selectDateAnimation = Animated.timing(animatedValue, {
  toValue: 1,
  duration: 100,
  easing: Easing.out(Easing.cubic),
  useNativeDriver: false, // backgroundColor requires JS thread
});
````

Phase 2: Selection Hold (100-200ms)
├── Maintain selected appearance
├── Allow time for visual registration
├── Prepare for content loading
├── Hold haptic feedback
└── Accessibility announcement

Phase 3: Content Transition (200-400ms)
├── Items list fade-in
├── Smooth content replacement
├── Accessibility focus management
├── Loading state if needed
└── Completion feedback

```

### 2. Calendar Dot Appearance
```

CALENDAR DOT REVEAL ANIMATION

Initial Load Sequence:
├── Stagger delay: 50ms per dot
├── Total sequence: ~1000ms for 20 dots
├── Performance: Virtualized for large datasets
├── Interruption: Cancelable for new data
└── Accessibility: Batch announcements

Individual Dot Animation:
From State:
├── scale: 0
├── opacity: 0
├── translateY: 4px (subtle upward motion)
└── Initial render: invisible

To State:
├── scale: 1.0
├── opacity: 1.0
├── translateY: 0px
└── Final state: fully visible

Animation Timing:
├── Duration: 200ms
├── Easing: ease-out with slight bounce
├── Native driver: true (all transform properties)
├── Stagger pattern: Cascading left-to-right, top-to-bottom
└── Performance: Efficient batch processing

Implementation:

```javascript
const dotAppearAnimation = Animated.stagger(50, [
  Animated.parallel([
    Animated.timing(scaleValue, {
      toValue: 1,
      duration: 200,
      easing: Easing.bezier(0.175, 0.885, 0.32, 1.275),
      useNativeDriver: true,
    }),
    Animated.timing(opacityValue, {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }),
  ]),
]);
```

```

### 3. Month Transition Animation
```

MONTH NAVIGATION ANIMATION

Horizontal Slide Transition:
├── Direction: Left slide for next, right slide for previous
├── Duration: 300ms for comfortable perception
├── Easing: ease-in-out for natural motion
├── Native: true for smooth performance
└── Interruption: Allow rapid navigation

Animation Sequence:
Phase 1: Exit Animation (0-150ms)
├── Current month slides out
├── translateX: 0 → -screenWidth (next) / +screenWidth (prev)
├── opacity: 1 → 0.8 (subtle fade)
├── scale: 1.0 → 0.95 (slight shrink)
└── zIndex: 1 (behind incoming)

Phase 2: Enter Animation (150-300ms)
├── New month slides in
├── translateX: +screenWidth → 0 (next) / -screenWidth → 0 (prev)
├── opacity: 0.8 → 1.0
├── scale: 1.05 → 1.0 (slight expand)
└── zIndex: 2 (in front)

Performance Optimization:
├── Pre-render adjacent months
├── Use transform only (no layout changes)
├── Efficient cleanup of off-screen content
├── Memory management for month data
└── Gesture-driven animation interruption

```

## Item Card Animation Specifications

### 1. Card Entrance Animation
```

ITEM CARD REVEAL SEQUENCE

List Population Animation:
├── Trigger: Date selection or data load
├── Pattern: Staggered entrance from top to bottom
├── Delay: 80ms between cards
├── Total duration: ~600ms for 8 items
└── Performance: Virtualized for long lists

Individual Card Animation:
From State:
├── translateY: 20px (below final position)
├── opacity: 0
├── scale: 0.95
└── rotateX: 5deg (subtle 3D tilt)

To State:
├── translateY: 0px
├── opacity: 1.0
├── scale: 1.0
└── rotateX: 0deg

Timing & Easing:
├── Duration: 400ms
├── Easing: ease-out with spring (0.175, 0.885, 0.32, 1.275)
├── Native driver: true
├── Stagger: 80ms delay per card
└── Cancelable: If user navigates away

Implementation:

```javascript
const cardEntranceAnimation = Animated.stagger(
  80,
  items.map((_, index) =>
    Animated.parallel([
      Animated.timing(translateYValues[index], {
        toValue: 0,
        duration: 400,
        easing: Easing.bezier(0.175, 0.885, 0.32, 1.275),
        useNativeDriver: true,
      }),
      Animated.timing(opacityValues[index], {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ])
  )
);
```

```

### 2. Swipe Gesture Animation
```

SWIPE GESTURE ANIMATION SYSTEM

Real-time Gesture Following:
├── Update frequency: 60fps
├── Interpolation: Direct 1:1 finger tracking
├── Native driver: true for smooth performance
├── Gesture bounds: -300px to +300px
└── Performance: Optimized pan responder

Threshold Feedback Animation:
Recognition Threshold (20px):
├── Haptic: Light impact
├── Visual: Action hint fade-in (150ms)
├── Properties: opacity 0→0.6, scale 0.8→1.0
├── Easing: ease-out
└── Native: true

Action Threshold (120px):
├── Haptic: Medium impact  
├── Visual: Full action appearance + background color
├── Properties: opacity 0.6→1.0, background 0→20% opacity
├── Duration: 100ms
├── Easing: linear for immediate feedback
└── Spring: Slight bounce effect on icon (scale 1.0→1.2→1.0)

Commitment Threshold (200px):
├── Haptic: Success notification
├── Visual: Full background color + white text
├── Properties: background 20%→100% opacity
├── Duration: 50ms immediate response
├── Preparation: Ready for release execution
└── Visual feedback: Confirmed action state

Release Animation Sequence:
Success Path (action execution):
├── Duration: 300ms total
├── Phase 1 (0-100ms): Hold action state
├── Phase 2 (100-200ms): Optimistic UI update
├── Phase 3 (200-300ms): Return to neutral
├── Easing: ease-out with satisfaction curve
└── Haptic: Success completion

Cancel Path (return to start):
├── Duration: 250ms
├── Animation: Spring back to translateX: 0
├── Easing: ease-out (0.25, 0.46, 0.45, 0.94)
├── Haptic: None (avoid negative feedback)
└── Visual: Action hints fade out

```

### 3. Card State Transitions
```

CARD STATE ANIMATION SPECIFICATIONS

Expansion Animation (Tap to Expand):
├── Trigger: User taps card header
├── Duration: 300ms
├── Property: height (animated), content opacity
├── Easing: ease-in-out for natural feel
└── Performance: Layout animation optimization

From State (Collapsed):
├── height: 72px (fixed collapsed height)
├── contentOpacity: 0 (details hidden)
├── chevronRotation: 0deg (pointing down)
└── shadowElevation: 2dp

To State (Expanded):
├── height: auto (measured expanded height)
├── contentOpacity: 1.0 (details visible)
├── chevronRotation: 180deg (pointing up)
└── shadowElevation: 4dp (elevated appearance)

Animation Sequence:
Phase 1 (0-150ms): Height expansion
├── Animate height to full content size
├── Chevron rotation begins
├── Shadow elevation increases
└── Content remains hidden

Phase 2 (150-300ms): Content reveal
├── Content opacity fade-in
├── Chevron rotation completes
├── Final shadow state
└── Focus management for accessibility

Loading State Animation:
├── Skeleton placeholder: Gentle pulse (1.5s cycle)
├── Opacity: 0.6 ↔ 1.0
├── Background: Subtle color shift
├── Duration: Continuous until loaded
└── Accessibility: Loading announcement

```

## Transition Animations

### 1. View Transition Specifications
```

SCREEN-LEVEL TRANSITION ANIMATIONS

Calendar ↔ Next 7 Days Toggle:
├── Type: Horizontal slide transition
├── Duration: 250ms for quick response
├── Direction: Left for Next 7 Days, right for Calendar
├── Easing: ease-in-out for smoothness
└── Performance: Native navigation animation

Animation Properties:
Exit View:
├── translateX: 0 → -screenWidth
├── opacity: 1.0 → 0.9
├── scale: 1.0 → 0.98
├── Duration: 250ms
└── Z-index: Lower layer

Enter View:
├── translateX: +screenWidth → 0
├── opacity: 0.9 → 1.0
├── scale: 1.02 → 1.0
├── Duration: 250ms
└── Z-index: Upper layer

Performance Considerations:
├── Pre-render both views for instant switching
├── Efficient memory management during transition
├── Gesture-driven cancellation support
├── Smooth interruption handling
└── Native driver optimization

```

### 2. Modal Animation Specifications
```

MODAL PRESENTATION ANIMATIONS

Extend Expiry Modal:
├── Presentation: Slide up from bottom
├── Duration: 400ms for comfortable perception
├── Backdrop: Fade-in to 50% opacity
├── Easing: ease-out with deceleration
└── Focus: Automatic to first option

Entry Animation:
From State:
├── translateY: +screenHeight (off-screen bottom)
├── opacity: 0
├── scale: 0.95
└── backdrop opacity: 0

To State:
├── translateY: 0 (final position)
├── opacity: 1.0
├── scale: 1.0
└── backdrop opacity: 0.5

Dismissal Animation:
├── Reverse of entry with 300ms duration
├── Gesture-driven dismissal support
├── Swipe-down to dismiss
├── Focus return to triggering element
└── Background restoration

Implementation:

```javascript
const modalAnimation = Animated.parallel([
  Animated.timing(translateY, {
    toValue: 0,
    duration: 400,
    easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
    useNativeDriver: true,
  }),
  Animated.timing(backdropOpacity, {
    toValue: 0.5,
    duration: 400,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  }),
]);
```

```

## Performance Optimization

### 1. Animation Performance Standards
```

PERFORMANCE REQUIREMENTS

Frame Rate Targets:
├── 60fps: Standard for all animations
├── 120fps: Pro device optimization where available
├── No frame drops: During critical interactions
├── Smooth degradation: For older devices
└── Battery efficiency: Optimize for power consumption

Native Driver Usage:
Supported Properties (Always Use Native):
├── transform: translateX, translateY, scale, rotate
├── opacity: Fade effects and transparency
├── All layout-independent properties
└── Gesture-driven animations

Non-Native Properties (Minimize Usage):
├── backgroundColor: Use sparingly
├── width/height: Avoid during interactions
├── border properties: Pre-calculate when possible
└── color: Use static values or pre-rendered states

Memory Management:
├── Cleanup: Remove listeners on unmount
├── Interruption: Cancel running animations on navigation
├── Pooling: Reuse animation instances
├── Lazy loading: Load animations on demand
└── Garbage collection: Avoid memory leaks

```

### 2. Device-Specific Optimizations
```

RESPONSIVE ANIMATION PERFORMANCE

High-End Devices (iPhone 12+, Android Flagship):
├── Full animation suite enabled
├── Complex spring animations allowed
├── Higher frame rate targeting (120fps)
├── Advanced visual effects
└── Multiple simultaneous animations

Mid-Range Devices (iPhone 8-11, Android Mid-range):
├── Standard animation suite
├── Simplified spring animations
├── 60fps frame rate targeting
├── Reduced simultaneous animations
└── Optimized effect complexity

Low-End Devices (iPhone 6-7, Android Budget):
├── Essential animations only
├── Linear easing preferred over curves
├── Reduced animation duration (50% faster)
├── Minimal simultaneous animations
└── Graceful degradation patterns

Performance Detection:

```javascript
const getAnimationConfig = () => {
  const { width, height } = Dimensions.get("window");
  const isLowEnd = width < 375 || DeviceInfo.isLowMemoryDevice();

  return {
    duration: isLowEnd ? 150 : 300,
    enableSpring: !isLowEnd,
    maxSimultaneous: isLowEnd ? 1 : 3,
    useComplexEasing: !isLowEnd,
  };
};
```

```

## Accessibility Animation Considerations

### 1. Reduced Motion Implementation
```

REDUCED MOTION ANIMATION ADAPTATIONS

System Preference Detection:
├── iOS: UIAccessibility.isReduceMotionEnabled
├── Android: Settings.Global.ANIMATOR_DURATION_SCALE
├── React Native: AccessibilityInfo.isReduceMotionEnabled()
├── Web fallback: prefers-reduced-motion media query
└── Default: Respect user preference

Reduced Motion Alternatives:
Instead of movement-based animations:
├── Opacity transitions: 0 ↔ 1 only
├── Color transitions: Subtle state changes
├── Size changes: Minimal scale variations
├── Instant transitions: Immediate state changes
└── Focus management: Clear state indicators

Animation Timing Adjustments:
├── Duration: Reduce by 70% (300ms → 90ms)
├── Easing: Linear only (no complex curves)
├── Stagger: Disabled (show all at once)
├── Bounces: Removed (direct transitions)
└── Loops: Disabled (no infinite animations)

Essential Animations (Always Enabled):
├── Focus indicators: Required for accessibility
├── Loading states: Essential user feedback
├── Error feedback: Critical information
├── Success confirmation: Action completion
└── State changes: Important UI updates

```

### 2. Screen Reader Compatibility
```

SCREEN READER ANIMATION SUPPORT

Animation Announcements:
├── State changes: Announce completion
├── Loading states: Progress updates
├── Error states: Immediate announcement
├── Success states: Confirmation feedback
└── Context changes: Navigation updates

Focus Management During Animation:
├── Preserve focus through transitions
├── Logical focus order maintenance
├── Skip to content after animations
├── Clear focus indicators during motion
└── Restore focus after completion

Implementation:

```javascript
const announceToScreenReader = (message) => {
  if (isScreenReaderEnabled()) {
    AccessibilityInfo.announceForAccessibility(message);
  }
};

const handleAnimationComplete = () => {
  announceToScreenReader("Calendar updated with new items");
  // Focus management...
};
```

```

## Implementation Guidelines

### 1. Animation Code Structure
```

ANIMATION COMPONENT ORGANIZATION

Hook-Based Animation Management:

```javascript
const useCalendarAnimations = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return { fadeAnim, slideAnim, animateIn };
};
```

Shared Animation Utilities:

```javascript
export const AnimationUtils = {
  // Standard duration presets
  durations: {
    instant: 0,
    fast: 150,
    normal: 300,
    slow: 500,
  },

  // Easing presets
  easings: {
    easeOut: Easing.out(Easing.cubic),
    easeInOut: Easing.inOut(Easing.cubic),
    spring: Easing.bezier(0.175, 0.885, 0.32, 1.275),
  },

  // Animation builders
  createFadeIn: (value, duration = 300) =>
    Animated.timing(value, {
      toValue: 1,
      duration,
      easing: AnimationUtils.easings.easeOut,
      useNativeDriver: true,
    }),
};
```

```

### 2. Testing Animation Performance
```

ANIMATION TESTING STRATEGY

Performance Testing:
├── Frame rate monitoring during animations
├── Memory usage tracking
├── Battery consumption measurement
├── Device-specific testing
└── Stress testing with multiple animations

Accessibility Testing:
├── Reduced motion preference testing
├── Screen reader compatibility verification
├── Focus management validation
├── Keyboard navigation during animations
└── Voice control integration testing

Visual Testing:
├── Animation timing verification
├── Easing curve validation
├── Cross-platform consistency
├── Edge case handling
└── Interruption behavior testing

```

---

**Status**: Animation Specifications Complete ✅
**Next**: Phase 2 Task 6 - Responsive Design
**Coverage**: Complete animation system with performance and accessibility optimization
```
