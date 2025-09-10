# Visual Hierarchy Design Specification

## Overview

This document defines the complete visual hierarchy system for urgency indicators, ensuring clear information prioritization and consistent visual communication across the enhanced calendar experience.

## Visual Hierarchy Principles

### 1. Information Priority System

```
URGENCY-BASED VISUAL HIERARCHY

Primary Level: Critical Items (Highest Priority)
├── Color: Red (#EF4444) - Maximum attention
├── Treatment: Bold, larger, elevated
├── Psychology: Danger, immediate action required
└── Usage: Expired items, today's expirations

Secondary Level: Warning Items (High Priority)
├── Color: Orange (#F97316) - High attention
├── Treatment: Semibold, normal size, visible
├── Psychology: Caution, action needed soon
└── Usage: 1-2 days until expiration

Tertiary Level: Soon Items (Medium Priority)
├── Color: Yellow (#EAB308) - Moderate attention
├── Treatment: Medium weight, normal size
├── Psychology: Awareness, plan ahead
└── Usage: 3-7 days until expiration

Quaternary Level: Safe Items (Low Priority)
├── Color: Green (#22C55E) - Minimal attention
├── Treatment: Regular weight, subtle presence
├── Psychology: Security, no immediate concern
└── Usage: 8+ days until expiration
```

### 2. Visual Weight Distribution

```
ATTENTION HIERARCHY SYSTEM

Critical Items (100% Visual Weight):
├── Maximum contrast ratio (8:1+)
├── Bold typography (700 weight)
├── Elevated shadows and borders
├── Larger touch targets (48pt+)
└── Animation/motion when appropriate

Warning Items (75% Visual Weight):
├── High contrast ratio (6:1+)
├── Semibold typography (600 weight)
├── Moderate shadows and borders
├── Standard touch targets (44pt)
└── Subtle motion/hover effects

Soon Items (50% Visual Weight):
├── Good contrast ratio (4.5:1+)
├── Medium typography (500 weight)
├── Light shadows and borders
├── Standard touch targets (44pt)
└── Minimal motion effects

Safe Items (25% Visual Weight):
├── Minimum contrast ratio (4.5:1)
├── Regular typography (400 weight)
├── Subtle borders, no shadows
├── Standard touch targets (44pt)
└── No motion effects (static)
```

## Calendar Date Indicator Design

### 1. Dot Indicator Specifications

```
CALENDAR DOT VISUAL SYSTEM

Dot Size Hierarchy:
├── Critical: 8px diameter (largest)
├── Warning: 7px diameter
├── Soon: 6px diameter
└── Safe: 5px diameter (smallest)

Dot Position & Layout:
┌─────────────────────┐
│        15           │ ← Date number (16sp, center)
│         •           │ ← Indicator dot (center-bottom)
│                     │
└─────────────────────┘

Dot Visual Properties:
├── Shape: Perfect circle
├── Position: 2px below date number
├── Opacity: 100% (no transparency)
├── Border: None (solid fill)
└── Shadow: 0px 1px 2px rgba(0,0,0,0.1)

Multiple Item Prioritization:
├── Show only highest urgency dot
├── Never stack multiple dots
├── Date label includes full count
└── Accessibility describes all urgencies
```

### 2. Date Selection Enhancement

```
SELECTED DATE VISUAL TREATMENT

Standard Date Appearance:
┌─────────────────────┐
│        15           │
│         •           │ ← Urgency dot
└─────────────────────┘

Selected Date Appearance:
┌─────────────────────┐
│ ╔═══════════════╗   │
│ ║      15       ║   │ ← Selection highlight
│ ║       •       ║   │ ← Urgency dot preserved
│ ╚═══════════════╝   │
└─────────────────────┘

Selection Visual Properties:
├── Background: Primary blue (#007AFF)
├── Text color: White (#FFFFFF)
├── Border radius: 8px
├── Urgency dot: Maintains original color
└── Focus ring: 2px offset, high contrast
```

### 3. Calendar Legend Design

```
COMPACT LEGEND SPECIFICATION

Legend Layout (Horizontal):
┌─────────────────────────────────────────┐
│ •Critical •Warning •Soon •Safe          │
└─────────────────────────────────────────┘

Individual Legend Item:
├── Dot: 6px circle, urgency color
├── Label: 11sp text, medium weight
├── Spacing: 4px between dot and text
├── Item spacing: 16px between items
└── Total height: 24px

Responsive Behavior:
├── Mobile: Single row, compact spacing
├── Tablet: Expanded spacing and text
├── Landscape: Maintains horizontal layout
└── Accessibility: Screen reader friendly
```

## Item Card Visual Hierarchy

### 1. Card Layout Hierarchy

```
ITEM CARD VISUAL STRUCTURE

Primary Information Zone (Top):
┌─────────────────────────────────────────┐
│ 🥛 MILK                         EXPIRED │ ← Name + Status
│ Refrigerator • Dairy • Qty: 1          │ ← Metadata
└─────────────────────────────────────────┘

Visual Treatment by Urgency:
├── Item name: Urgency color, size hierarchy
├── Status badge: Background color matching urgency
├── Border: Left accent (4px) in urgency color
└── Background: Subtle tint (5% opacity) of urgency color

Typography Hierarchy:
Critical Items:
├── Name: 18sp, 700 weight, #EF4444
├── Status: 12sp, 600 weight, white on red bg
├── Metadata: 14sp, 400 weight, #6B7280
└── Layout: Elevated appearance

Warning Items:
├── Name: 18sp, 600 weight, #F97316
├── Status: 12sp, 600 weight, white on orange bg
├── Metadata: 14sp, 400 weight, #6B7280
└── Layout: Slightly elevated

Soon Items:
├── Name: 18sp, 500 weight, #CA8A04
├── Status: 12sp, 500 weight, dark on yellow bg
├── Metadata: 14sp, 400 weight, #6B7280
└── Layout: Standard elevation

Safe Items:
├── Name: 18sp, 400 weight, #374151
├── Status: 12sp, 500 weight, white on green bg
├── Metadata: 14sp, 400 weight, #6B7280
└── Layout: Minimal elevation
```

### 2. Status Badge Design

```
STATUS BADGE VISUAL SYSTEM

Badge Dimensions:
├── Height: 24px fixed
├── Padding: 8px horizontal, 4px vertical
├── Border radius: 12px (pill shape)
├── Position: Top-right of card
└── Typography: 12sp, 600 weight, uppercase

Color Combinations:
Critical Badge:
├── Background: #EF4444 (Red)
├── Text: #FFFFFF (White)
├── Border: None
└── Shadow: 0px 1px 3px rgba(239, 68, 68, 0.3)

Warning Badge:
├── Background: #F97316 (Orange)
├── Text: #FFFFFF (White)
├── Border: None
└── Shadow: 0px 1px 3px rgba(249, 115, 22, 0.3)

Soon Badge:
├── Background: #EAB308 (Yellow)
├── Text: #1F2937 (Dark gray)
├── Border: None
└── Shadow: 0px 1px 3px rgba(234, 179, 8, 0.3)

Safe Badge:
├── Background: #22C55E (Green)
├── Text: #FFFFFF (White)
├── Border: None
└── Shadow: 0px 1px 3px rgba(34, 197, 94, 0.3)
```

### 3. Card Border & Background System

```
CARD VISUAL TREATMENT SYSTEM

Critical Items:
┌─────────────────────────────────────────┐
│▌                                        │ ← Left accent (4px, red)
│ Content with red tinted background      │
│                                         │
└─────────────────────────────────────────┘

Border & Background:
├── Left border: 4px solid #EF4444
├── Background: rgba(239, 68, 68, 0.05)
├── Card shadow: 0px 2px 8px rgba(0, 0, 0, 0.1)
├── Border radius: 12px
└── Minimum height: 72px

Warning Items:
├── Left border: 4px solid #F97316
├── Background: rgba(249, 115, 22, 0.05)
├── Card shadow: 0px 2px 6px rgba(0, 0, 0, 0.08)
└── Same layout properties

Soon Items:
├── Left border: 4px solid #EAB308
├── Background: rgba(234, 179, 8, 0.05)
├── Card shadow: 0px 1px 4px rgba(0, 0, 0, 0.06)
└── Same layout properties

Safe Items:
├── Left border: 4px solid #22C55E
├── Background: rgba(34, 197, 94, 0.03)
├── Card shadow: 0px 1px 3px rgba(0, 0, 0, 0.04)
└── Same layout properties
```

## Swipe Action Visual Design

### 1. Action Reveal Animation

```
SWIPE ACTION VISUAL PROGRESSION

Rest State (0% swipe):
┌─────────────────────────────────────────┐
│ 🥛 Milk                         EXPIRED │
│ Refrigerator • Dairy • Qty: 1          │
└─────────────────────────────────────────┘

Hint State (20% swipe):
┌─────────────────────────────────────────┐
│[✓] 🥛 Milk                      EXPIRED │ ← Action hint appears
│    Refrigerator • Dairy • Qty: 1       │
└─────────────────────────────────────────┘

Commitment State (50% swipe):
┌─────────────────────────────────────────┐
│[✓ USED] 🥛 Milk                EXPIRED  │ ← Full action shown
│         Refrigerator • Dairy • Qty: 1   │
└─────────────────────────────────────────┘

Action Visual Properties:
├── Icon size: 20px square
├── Background: Action color (green/blue)
├── Icon color: White (#FFFFFF)
├── Animation: Fade in + scale 0.8→1.0
└── Duration: 150ms ease-out
```

### 2. Action Background Design

```
ACTION BACKGROUND TREATMENT

Mark as Used (Left Swipe):
├── Background: Linear gradient
│   ├── From: #22C55E (Green)
│   └── To: #16A34A (Darker green)
├── Icon: ✓ checkmark (20px, white)
├── Label: "USED" (12sp, bold, white)
├── Position: Left edge, vertically centered
└── Animation: Expand from 0 to full width

Extend Expiry (Right Swipe):
├── Background: Linear gradient
│   ├── From: #3B82F6 (Blue)
│   └── To: #1D4ED8 (Darker blue)
├── Icon: + calendar (20px, white)
├── Label: "+3d" (12sp, bold, white)
├── Position: Right edge, vertically centered
└── Animation: Expand from 0 to full width

Visual Effects:
├── Background opacity: 0→100% during swipe
├── Icon scale: 0.8→1.2→1.0 (bounce effect)
├── Text fade: 0→100% at 30% swipe
└── Shadow: 0px 2px 8px rgba(action-color, 0.3)
```

## Dark Mode Adaptations

### 1. Dark Theme Color System

```
DARK MODE COLOR SPECIFICATIONS

Background Colors:
├── Primary background: #1C1C1E
├── Secondary background: #2C2C2E
├── Tertiary background: #3A3A3C
└── Surface color: #48484A

Urgency Colors (Dark Optimized):
├── Critical: #FF6B6B (Brighter red)
├── Warning: #FFB84D (Brighter orange)
├── Soon: #FFD93D (Brighter yellow)
└── Safe: #51D88A (Brighter green)

Text Colors:
├── Primary text: #FFFFFF
├── Secondary text: #EBEBF5 (60% opacity)
├── Tertiary text: #EBEBF5 (30% opacity)
└── Disabled text: #EBEBF5 (20% opacity)
```

### 2. Dark Mode Visual Adjustments

```
DARK THEME VISUAL MODIFICATIONS

Calendar Indicators:
├── Dot colors: Brighter urgency palette
├── Selected date: #0A84FF background
├── Date text: #FFFFFF primary
└── Legend text: #EBEBF5 secondary

Item Cards:
├── Background: #2C2C2E with urgency tint
├── Border: Brighter urgency colors (same thickness)
├── Shadow: Reduced opacity (black-based)
└── Text: White/light gray hierarchy

Status Badges:
├── Background: Same urgency colors
├── Text: Adjusted for contrast in dark theme
├── Shadow: Dark-optimized (black base)
└── Border: Optional light border for definition
```

## Responsive Visual Scaling

### 1. Mobile Device Scaling

```
MOBILE RESPONSIVE VISUAL HIERARCHY

iPhone SE (375px width):
├── Calendar dots: 6px diameter
├── Item card height: 72px minimum
├── Typography: Base sizes (16sp, 14sp, 12sp)
├── Touch targets: 44pt minimum
└── Margins: 16px standard

iPhone Pro (414px width):
├── Calendar dots: 7px diameter
├── Item card height: 80px minimum
├── Typography: +1sp to all sizes
├── Touch targets: 44pt maintained
└── Margins: 20px standard

Android Large (480px+ width):
├── Calendar dots: 8px diameter
├── Item card height: 88px minimum
├── Typography: +2sp to all sizes
├── Touch targets: 48dp minimum
└── Margins: 24px standard
```

### 2. Tablet Adaptations

```
TABLET VISUAL HIERARCHY ENHANCEMENTS

iPad (768px+ width):
├── Calendar: Larger grid cells (60px+)
├── Dots: 10px diameter for visibility
├── Item cards: Grid layout (2 columns)
├── Typography: Desktop-scale sizing
└── Actions: Expanded button layout

Visual Enhancements:
├── Hover states for pointer devices
├── Larger touch targets (48pt+)
├── Enhanced shadows and depth
├── More generous spacing
└── Additional information density
```

## Animation & Motion Hierarchy

### 1. Priority-Based Animation

```
ANIMATION HIERARCHY BY URGENCY

Critical Items:
├── Attention-getting animations allowed
├── Subtle pulse on appearance (2s interval)
├── Enhanced hover/focus effects
├── Faster transition timing (150ms)
└── Spring animations for actions

Warning Items:
├── Moderate attention animations
├── Standard hover/focus effects
├── Normal transition timing (200ms)
├── Ease-out animations
└── No attention-getting loops

Soon/Safe Items:
├── Minimal animations
├── Subtle state transitions only
├── Slower timing (250ms)
├── Simple ease transitions
└── No attention effects
```

### 2. Reduced Motion Considerations

```
MOTION SENSITIVITY ADAPTATIONS

When prefers-reduced-motion:
├── Disable all attention-getting animations
├── Remove spring animations (use linear)
├── Reduce animation duration by 50%
├── Use opacity changes instead of movement
└── Maintain essential state feedback

Essential Animations (Always Enabled):
├── Focus indicators (accessibility)
├── Loading states (user feedback)
├── Action confirmations (important feedback)
└── Error states (critical feedback)
```

## Implementation Guidelines

### 1. CSS Custom Properties System

```
CSS VARIABLES FOR VISUAL HIERARCHY

:root {
  /* Urgency Colors */
  --critical-color: #EF4444;
  --warning-color: #F97316;
  --soon-color: #EAB308;
  --safe-color: #22C55E;

  /* Visual Weights */
  --critical-weight: 700;
  --warning-weight: 600;
  --soon-weight: 500;
  --safe-weight: 400;

  /* Spacing Scale */
  --dot-size-critical: 8px;
  --dot-size-warning: 7px;
  --dot-size-soon: 6px;
  --dot-size-safe: 5px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --critical-color: #FF6B6B;
    --warning-color: #FFB84D;
    --soon-color: #FFD93D;
    --safe-color: #51D88A;
  }
}
```

### 2. Component Design Tokens

```
DESIGN SYSTEM TOKENS

export const VisualHierarchy = {
  urgency: {
    critical: {
      color: '#EF4444',
      weight: 700,
      dotSize: 8,
      elevation: 4,
    },
    warning: {
      color: '#F97316',
      weight: 600,
      dotSize: 7,
      elevation: 3,
    },
    soon: {
      color: '#EAB308',
      weight: 500,
      dotSize: 6,
      elevation: 2,
    },
    safe: {
      color: '#22C55E',
      weight: 400,
      dotSize: 5,
      elevation: 1,
    },
  },
  spacing: {
    card: { margin: 12, padding: 16 },
    dot: { margin: 2, offset: 2 },
  },
  animation: {
    duration: { fast: 150, normal: 200, slow: 250 },
    easing: 'ease-out',
  },
};
```

---

**Status**: Visual Hierarchy Design Complete ✅  
**Next**: Phase 2 Task 5 - Animation Specifications
**Coverage**: Complete visual system with urgency prioritization
