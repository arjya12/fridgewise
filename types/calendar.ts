// Enhanced Expiry Calendar Types
// Based on design specifications from Phase 2

import { FoodItem } from "../lib/supabase";

// Panel state management
export type PanelState = "default" | "selected" | "empty";

// Expiry status for items
export interface ExpiryStatus {
  days: number;
  text: string;
  color: string;
  urgency: "expired" | "today" | "tomorrow" | "soon" | "fresh";
}

// Calendar legend item
export interface LegendItem {
  color: string;
  label: string;
  key: string;
}

// Main Information Panel component props
export interface InformationPanelProps {
  state: PanelState;
  selectedDate?: string;
  expiringSoonItems: FoodItem[];
  selectedDateItems: FoodItem[];
  loading?: boolean;
  onItemPress: (item: FoodItem) => void;
  onMarkUsed: (item: FoodItem) => void;
  onDelete: (item: FoodItem) => void;
  onViewAll?: () => void;
  onAddItem?: () => void;
}

// Expiring Soon View component props
export interface ExpiringSoonViewProps {
  items: FoodItem[];
  onItemPress: (item: FoodItem) => void;
  onViewAll?: () => void;
  loading?: boolean;
}

// Selected Date View component props
export interface SelectedDateViewProps {
  selectedDate: string;
  items: FoodItem[];
  onItemPress: (item: FoodItem) => void;
  onMarkUsed: (item: FoodItem) => void;
  onDelete: (item: FoodItem) => void;
  loading?: boolean;
}

// Empty State View component props
export interface EmptyStateViewProps {
  type: "no-date-selected" | "no-items-on-date";
  selectedDate?: string;
  onAddItem?: () => void;
}

// Item Detail Card component props
export interface ItemDetailCardProps {
  item: FoodItem;
  expiryStatus: ExpiryStatus;
  onPress: (item: FoodItem) => void;
  onMarkUsed: (item: FoodItem) => void;
  onDelete: (item: FoodItem) => void;
  showActions?: boolean;
  compact?: boolean;
}

// Item Compact Card component props (for default view)
export interface ItemCompactCardProps {
  item: FoodItem;
  expiryStatus: ExpiryStatus;
  onPress: (item: FoodItem) => void;
}

// Calendar Legend component props
export interface CalendarLegendProps {
  compact?: boolean;
  style?: any; // ViewStyle
}

// Header components
export interface ExpiringSoonHeaderProps {
  itemCount: number;
  daysAhead?: number;
}

export interface SelectedDateHeaderProps {
  date: string;
  itemCount: number;
}

// Action Button component props
export interface ActionButtonProps {
  type: "used" | "delete";
  onPress: () => void;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
}

// Loading State View component props
export interface LoadingStateViewProps {
  itemCount?: number;
}

// Enhanced Expiry Calendar main component props
export interface EnhancedExpiryCalendarProps {
  initialDate?: string;
  onItemPress?: (item: FoodItem) => void;
  onAddItem?: () => void;
}

// Animation configuration
export interface AnimationConfig {
  duration: number;
  easing: string;
  useNativeDriver: boolean;
}

// State transition animations
export interface StateTransitionConfig {
  fadeOut: AnimationConfig;
  fadeIn: AnimationConfig;
  slide: {
    outDirection: number;
    inDirection: number;
  };
}

// Calendar marked dates (extends react-native-calendars)
export interface MarkedDate {
  marked?: boolean;
  selected?: boolean;
  selectedColor?: string;
  dots?: Array<{
    key: string;
    color: string;
    selectedDotColor?: string;
  }>;
}

export type MarkedDatesType = Record<string, MarkedDate>;

// Data structures for calendar management
export interface CalendarData {
  markedDates: MarkedDatesType;
  itemsByDate: Record<string, FoodItem[]>;
  expiringSoonItems: FoodItem[];
}

// Month range for data loading
export interface MonthRange {
  startDate: string;
  endDate: string;
}

// Calendar month state
export interface CalendarMonth {
  month: number;
  year: number;
}

// Expiry calculation utilities
export interface ExpiryCalculation {
  daysUntilExpiry: number;
  status: ExpiryStatus;
  isUrgent: boolean;
}

// Notification preferences (for future integration)
export interface NotificationPreferences {
  enabled: boolean;
  daysAhead: number[];
  dailyTime: string;
}

// Statistics for dashboard integration
export interface ExpiryStatistics {
  totalItems: number;
  expiredItems: number;
  expiringToday: number;
  expiringThisWeek: number;
  urgentActionRequired: boolean;
}

// Filter and sort options
export interface FilterOptions {
  category?: string;
  location?: "fridge" | "shelf";
  urgency?: ExpiryStatus["urgency"];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface SortOptions {
  field: "expiry_date" | "name" | "created_at" | "quantity";
  direction: "asc" | "desc";
}

// Accessibility props
export interface AccessibilityProps {
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    expanded?: boolean;
  };
}

// Component style configurations
export interface ComponentStyles {
  container: any;
  header: any;
  content: any;
  footer?: any;
}

// Error handling
export interface CalendarError {
  code: string;
  message: string;
  details?: any;
}

// Performance optimization options
export interface PerformanceOptions {
  enableVirtualization: boolean;
  maxItemsToRender: number;
  updateBatchSize: number;
  animationReducedMotion: boolean;
}

// Theme integration
export interface CalendarTheme {
  colors: {
    primary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    warning: string;
    success: string;
  };
  typography: {
    title: any;
    subtitle: any;
    body: any;
    caption: any;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}
