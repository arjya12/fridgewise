# Enhanced Expiry Calendar - Props and State Management Strategy

## Overview

This document defines the comprehensive props interface and state management strategy for the `<EnhancedExpiryCalendar>` component based on Phase 1 analysis and high-fidelity mockup specifications.

## Component Interface Definition

### Core Props Interface

Based on the high-fidelity mockups, the main component interface should be:

```typescript
interface EnhancedCalendarProps {
  // Data Props
  itemsByDate: Record<string, FoodItemWithUrgency[]>;
  selectedDate: string;

  // Event Handlers
  onDateSelect: (date: string) => void;
  onItemAction: (action: ItemAction) => Promise<void>;

  // State Props
  isLoading: boolean;
  error?: string;

  // UI Configuration
  theme: "light" | "dark";
  reducedMotion: boolean;
  screenReader: boolean;

  // Optional Props
  initialDate?: string;
  compactMode?: boolean;
  virtualizedList?: boolean;
}
```

### Extended Props Interface

For full functionality, we need to extend this with additional props:

```typescript
interface EnhancedExpiryCalendarProps extends EnhancedCalendarProps {
  // Action Handlers
  onMarkUsed: (itemId: string, quantity?: number) => Promise<void>;
  onExtendExpiry: (itemId: string, days?: number) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  onItemPress: (item: FoodItem) => void;
  onAddItem: () => void;

  // Performance Configuration
  performanceMode?: "high" | "balanced" | "quality";
  maxItemsPerDate?: number;
  cacheSize?: number;

  // Accessibility Configuration
  accessibilityConfig?: AccessibilityConfig;

  // Calendar Configuration
  colorScheme?: CalendarColorScheme;
  enableSwipeActions?: boolean;
  enableHaptics?: boolean;

  // Animation Configuration
  animationPreset?: "smooth" | "minimal" | "disabled";
  gestureThresholds?: GestureThresholds;
}
```

## State Management Architecture

### 1. Local Component State

The component will manage the following local state:

```typescript
interface EnhancedCalendarState {
  // Current view state
  selectedDate: string;
  currentMonth: CalendarMonth;
  viewMode: "calendar" | "list";

  // UI state
  isLoading: boolean;
  loadingStates: Record<string, boolean>; // Per-action loading
  error: CalendarError | null;

  // Interaction state
  expandedItems: Set<string>;
  swipeStates: Record<string, SwipeState>;

  // Performance state
  virtualizedData: VirtualizedData;
  renderOptimizations: RenderOptimizations;
}
```

### 2. Context Integration

The component will integrate with existing contexts:

```typescript
// Uses existing AuthContext for user data
const { user } = useContext(AuthContext);

// Uses existing SettingsContext for preferences
const { settings } = useContext(SettingsContext);

// Proposed new CalendarContext for calendar-specific state
interface CalendarContextValue {
  // Data management
  itemsByDate: Record<string, FoodItemWithUrgency[]>;
  refreshData: () => Promise<void>;

  // Filters and sorting
  filters: FilterOptions;
  setFilters: (filters: FilterOptions) => void;

  // Calendar settings
  calendarSettings: CalendarSettings;
  updateSettings: (settings: Partial<CalendarSettings>) => void;
}
```

### 3. Service Layer Integration

The component will integrate with existing services:

```typescript
// Data fetching
import { foodItemsService } from "../services/foodItems";
import { enhancedCalendarService } from "../services/calendar-enhanced-service";

// Actions
import {
  markItemAsUsed,
  extendItemExpiry,
  deleteItem,
} from "../services/foodItems";

// Notifications
import { smartNotificationService } from "../services/smartNotificationService";
```

## Data Flow Architecture

### 1. Data Loading Flow

```
App Launch → Calendar Screen → EnhancedExpiryCalendar
    ↓
[1] useEffect: Load initial data
    ↓
[2] enhancedCalendarService.getItemsByMonth(currentMonth)
    ↓
[3] Transform data to itemsByDate format
    ↓
[4] Update local state with loading: false
    ↓
[5] Render calendar with dots and item list
```

### 2. User Interaction Flow

```
User Action (swipe/tap) → Component Handler → Service Call → Optimistic Update
    ↓                                            ↓
[Success] Confirm update                    [Error] Revert + Show error
    ↓                                            ↓
Update calendar dots                        Restore previous state
    ↓                                            ↓
Trigger success feedback                    Show retry option
```

### 3. State Synchronization

```typescript
// Optimistic updates pattern
const handleMarkAsUsed = async (itemId: string) => {
  // 1. Optimistic update
  setItemsByDate((prev) => {
    const newData = { ...prev };
    // Remove/update item optimistically
    return newData;
  });

  try {
    // 2. API call
    await onMarkUsed(itemId);

    // 3. Success feedback
    showSuccessToast("Item marked as used");
    triggerHaptic("success");
  } catch (error) {
    // 4. Revert on error
    setItemsByDate(originalData);
    showErrorToast("Failed to mark item as used");
  }
};
```

## Performance Optimizations

### 1. Memoization Strategy

```typescript
// Memoize expensive calculations
const markedDates = useMemo(() => {
  return createEnhancedMarkedDates(itemsByDate, colorScheme);
}, [itemsByDate, colorScheme]);

const selectedDateItems = useMemo(() => {
  return itemsByDate[selectedDate] || [];
}, [itemsByDate, selectedDate]);

// Memoize event handlers
const handleDateSelect = useCallback(
  (date: string) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  },
  [onDateSelect]
);
```

### 2. Virtualization Strategy

```typescript
// For large item lists
const virtualizedConfig = useMemo(
  () => ({
    enabled: selectedDateItems.length > 20,
    windowSize: 10,
    initialNumToRender: 5,
    maxToRenderPerBatch: 3,
    updateCellsBatchingPeriod: 50,
  }),
  [selectedDateItems.length]
);
```

### 3. Debouncing Strategy

```typescript
// Debounce frequent operations
const debouncedRefresh = useMemo(
  () => debounce(refreshData, 500),
  [refreshData]
);

const debouncedFilter = useMemo(
  () => debounce(updateFilters, 300),
  [updateFilters]
);
```

## Error Handling Strategy

### 1. Error Boundaries

```typescript
// Component-level error boundary
<ErrorBoundary fallback={<CalendarErrorFallback />}>
  <EnhancedExpiryCalendar {...props} />
</ErrorBoundary>
```

### 2. Network Error Handling

```typescript
// Network resilience
const handleNetworkError = (error: NetworkError) => {
  switch (error.type) {
    case "offline":
      // Show offline indicator
      // Switch to cached data
      break;
    case "timeout":
      // Show retry button
      // Implement exponential backoff
      break;
    case "server_error":
      // Show generic error message
      // Log error for debugging
      break;
  }
};
```

### 3. Action Error Recovery

```typescript
// Graceful degradation for actions
const safeActionHandler = (action: () => Promise<void>) => async () => {
  try {
    await action();
  } catch (error) {
    // Revert optimistic updates
    // Show error message
    // Provide retry option
  }
};
```

## Testing Strategy

### 1. State Management Tests

```typescript
// Test state transitions
describe("EnhancedCalendarState", () => {
  test("should update selectedDate when onDateSelect is called", () => {
    // Test state updates
  });

  test("should handle loading states correctly", () => {
    // Test loading state management
  });

  test("should revert optimistic updates on error", () => {
    // Test error handling
  });
});
```

### 2. Integration Tests

```typescript
// Test service integration
describe("Service Integration", () => {
  test("should fetch data on mount", () => {
    // Test data loading
  });

  test("should handle mark as used action", () => {
    // Test action handling
  });
});
```

## Migration Strategy

### 1. Backwards Compatibility

```typescript
// Support existing component props
interface LegacyCalendarProps {
  onItemPress?: (item: FoodItem) => void;
  onAddItem?: () => void;
}

// Adapter function
const adaptLegacyProps = (
  props: LegacyCalendarProps
): EnhancedCalendarProps => {
  return {
    ...props,
    // Map legacy props to new interface
    onItemAction: async (action) => {
      if (action.type === "view" && props.onItemPress) {
        props.onItemPress(action.item);
      }
    },
  };
};
```

### 2. Gradual Enhancement

```typescript
// Feature flags for gradual rollout
const useEnhancedFeatures = () => {
  const { settings } = useContext(SettingsContext);

  return {
    swipeActions: settings.enableSwipeActions ?? true,
    hapticFeedback: settings.enableHaptics ?? true,
    animations: settings.enableAnimations ?? true,
  };
};
```

## Implementation Priority

### Phase 1: Core Props & State (This Phase)

- ✅ Define EnhancedCalendarProps interface
- ✅ Plan state management architecture
- ✅ Design data flow patterns
- ✅ Plan service integration

### Phase 2: Basic Implementation

- Implement core component structure
- Add basic state management
- Integrate with existing services
- Add error handling

### Phase 3: Enhanced Features

- Add swipe action support
- Implement performance optimizations
- Add accessibility features
- Add animation support

### Phase 4: Polish & Testing

- Comprehensive testing
- Performance optimization
- Accessibility audit
- Documentation completion

---

**Status**: Props and State Management Strategy Complete ✅
**Next**: Move to Phase 1.2 - Calendar Library Validation
