// Enhanced Calendar Data Models and Interfaces
// Extends existing calendar types with improvements for UI/UX issues

import { FoodItem } from "../lib/supabase";
import { CalendarMonth, MarkedDatesType, PanelState } from "./calendar";

// =============================================================================
// CORE COLOR SCHEME & VISUAL CONSISTENCY
// =============================================================================

export interface CalendarColorScheme {
  expired: {
    primary: string; // Red: #DC2626
    secondary: string; // Light red: #FEF2F2
    pattern: "solid" | "striped" | "dotted";
  };
  today: {
    primary: string; // Orange: #EA580C
    secondary: string; // Light orange: #FFF7ED
    pattern: "solid" | "striped" | "dotted";
  };
  future: {
    primary: string; // Green: #16A34A
    secondary: string; // Light green: #F0FDF4
    pattern: "solid" | "striped" | "dotted";
  };
  accessibility: {
    highContrast: boolean;
    patterns: boolean;
    textAlternatives: boolean;
  };
}

export interface DotIndicatorConfig {
  size: number;
  spacing: number;
  maxDots: number;
  showCount: boolean;
  patterns: boolean;
}

// =============================================================================
// LAYOUT & CONTAINER INTERFACES
// =============================================================================

export interface CalendarScreenContainerProps {
  children: React.ReactNode;
  headerVisible?: boolean;
  headerHeight?: number;
  fabPosition?: FABPosition;
  safeAreaConfig?: SafeAreaConfig;
}

export interface SafeAreaConfig {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
  adjustForTabBar: boolean;
}

export interface CompactHeaderProps {
  title: string;
  showBackButton?: boolean;
  rightActions?: React.ReactNode[];
  compact?: boolean;
  height?: number;
  backgroundColor?: string;
}

// =============================================================================
// FAB POSITIONING & NAVIGATION
// =============================================================================

export interface FABPosition {
  bottom: number;
  right: number;
  adjustForTabBar: boolean;
  zIndex: number;
  avoidKeyboard: boolean;
}

export interface CalendarFABProps {
  onPress: () => void;
  position: FABPosition;
  icon?: string;
  size?: "small" | "medium" | "large";
  backgroundColor?: string;
  iconColor?: string;
  disabled?: boolean;
  loading?: boolean;
}

export interface NavigationSafetyConfig {
  tabBarHeight: number;
  fabSize: number;
  minimumClearance: number;
  dynamicPositioning: boolean;
}

// =============================================================================
// ENHANCED CALENDAR CORE
// =============================================================================

export interface EnhancedCalendarCoreProps {
  colorScheme: CalendarColorScheme;
  dotIndicators: DotIndicatorConfig;
  accessibilityEnhanced: boolean;
  itemCountIndicators: boolean;
  patternIndicators: boolean;
  onDatePress: (date: string) => void;
  onMonthChange: (month: CalendarMonth) => void;
  markedDates: MarkedDatesType;
  selectedDate?: string;
  theme?: CalendarThemeEnhanced;
}

export interface CalendarThemeEnhanced {
  calendar: {
    backgroundColor: string;
    textColor: string;
    selectedDayBackgroundColor: string;
    selectedDayTextColor: string;
    todayTextColor: string;
    dayTextColor: string;
    textDisabledColor: string;
    monthTextColor: string;
    arrowColor: string;
  };
  accessibility: {
    highContrastMode: boolean;
    reducedMotion: boolean;
    largeText: boolean;
  };
}

// =============================================================================
// ITEM COUNT INDICATORS
// =============================================================================

export interface ItemCountIndicatorProps {
  count: number;
  type: "expired" | "today" | "future";
  size: "small" | "medium" | "large";
  position: "corner" | "center" | "badge";
  maxDisplayCount?: number;
  showPattern?: boolean;
  accessibilityLabel?: string;
}

export interface DateIndicators {
  itemCount: number;
  expiryTypes: ("expired" | "today" | "future")[];
  urgencyLevel: "low" | "medium" | "high" | "critical";
  patterns: PatternIndicator[];
}

export interface PatternIndicator {
  type: "solid" | "striped" | "dotted" | "dashed";
  color: string;
  size: number;
  position: "top" | "bottom" | "left" | "right" | "center";
}

// =============================================================================
// ACCESSIBLE DATE BUTTON
// =============================================================================

export interface AccessibleDateButtonProps {
  date: string;
  items: FoodItem[];
  selected: boolean;
  onPress: (date: string) => void;
  indicators: DateIndicators;
  accessibility: AccessibilityEnhanced;
  touchTarget: TouchTargetConfig;
}

export interface AccessibilityEnhanced {
  label: string;
  hint: string;
  role: string;
  state: {
    selected?: boolean;
    disabled?: boolean;
    expanded?: boolean;
  };
  value?: string;
  liveRegion?: "none" | "polite" | "assertive";
}

export interface TouchTargetConfig {
  minimumSize: number;
  hitSlop: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  padding: number;
}

// =============================================================================
// LEGEND INTEGRATION
// =============================================================================

export interface CalendarLegendIntegratedProps {
  position: "top" | "bottom" | "inline" | "floating";
  compact: boolean;
  showPatterns: boolean;
  colorScheme: CalendarColorScheme;
  itemCounts?: LegendItemCounts;
  accessibility: boolean;
}

export interface LegendItemCounts {
  expired: number;
  today: number;
  future: number;
  total: number;
}

export interface LegendItemEnhanced {
  color: string;
  pattern?: PatternIndicator;
  label: string;
  count?: number;
  key: string;
  accessibilityLabel: string;
}

// =============================================================================
// OPTIMIZED INFORMATION PANEL
// =============================================================================

export interface OptimizedInformationPanelProps {
  state: PanelState;
  selectedDate?: string;
  expiringSoonItems: FoodItem[];
  selectedDateItems: FoodItem[];
  loading?: boolean;
  maxHeight?: number;
  virtualized?: boolean;
  itemCountIndicators?: boolean;
  onItemPress: (item: FoodItem) => void;
  onMarkUsed: (item: FoodItem) => void;
  onDelete: (item: FoodItem) => void;
  onViewAll?: () => void;
  onAddItem?: () => void;
  performanceConfig?: PerformanceConfig;
}

export interface PerformanceConfig {
  enableVirtualization: boolean;
  maxItemsToRender: number;
  windowSize: number;
  updateBatchSize: number;
  removeClippedSubviews: boolean;
  getItemLayout?: (
    data: any,
    index: number
  ) => { length: number; offset: number; index: number };
}

// =============================================================================
// DATA PROVIDER & STATE MANAGEMENT
// =============================================================================

export interface CalendarDataProviderProps {
  children: React.ReactNode;
  virtualized?: boolean;
  cacheSize?: number;
  prefetchMonths?: number;
  performanceOptimizations?: boolean;
}

export interface CalendarStateEnhanced {
  selectedDate: string | null;
  currentMonth: CalendarMonth;
  items: FoodItem[];
  loading: boolean;
  error: CalendarError | null;
  viewMode: "calendar" | "list" | "grid";
  filters: FilterOptionsEnhanced;
  sort: SortOptionsEnhanced;
  performance: PerformanceMetrics;
}

export interface CalendarError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  recoverable: boolean;
}

export interface FilterOptionsEnhanced {
  category?: string[];
  location?: ("fridge" | "shelf")[];
  urgency?: ("expired" | "today" | "soon" | "fresh")[];
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
  showEmpty: boolean;
}

export interface SortOptionsEnhanced {
  field: "expiry_date" | "name" | "created_at" | "quantity" | "urgency";
  direction: "asc" | "desc";
  secondary?: {
    field: "expiry_date" | "name" | "created_at" | "quantity";
    direction: "asc" | "desc";
  };
}

// =============================================================================
// PERFORMANCE & MONITORING
// =============================================================================

export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  itemCount: number;
  lastUpdate: string;
  warnings: PerformanceWarning[];
}

export interface PerformanceWarning {
  type: "memory" | "render" | "data";
  severity: "low" | "medium" | "high";
  message: string;
  timestamp: string;
  suggestion?: string;
}

export interface PerformanceOptimizerProps {
  children: React.ReactNode;
  enableProfiling?: boolean;
  maxItems?: number;
  memoryThreshold?: number;
  renderTimeThreshold?: number;
  onWarning?: (warning: PerformanceWarning) => void;
}

// =============================================================================
// COLOR SCHEME PROVIDER
// =============================================================================

export interface ColorSchemeProviderProps {
  children: React.ReactNode;
  scheme: CalendarColorScheme;
  accessibilityMode?: boolean;
  highContrastMode?: boolean;
  customPatterns?: PatternDefinition[];
}

export interface PatternDefinition {
  name: string;
  type: "solid" | "striped" | "dotted" | "dashed" | "crosshatch";
  density: number;
  angle?: number;
  spacing?: number;
}

// =============================================================================
// SPACE OPTIMIZATION
// =============================================================================

export interface SpaceOptimizationConfig {
  headerHeight: number;
  calendarHeight: number;
  panelMinHeight: number;
  fabClearance: number;
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  responsive: boolean;
}

export interface ResponsiveBreakpoints {
  small: number; // < 375px
  medium: number; // 375px - 768px
  large: number; // > 768px
}

export interface ResponsiveConfig {
  breakpoints: ResponsiveBreakpoints;
  layouts: {
    small: SpaceOptimizationConfig;
    medium: SpaceOptimizationConfig;
    large: SpaceOptimizationConfig;
  };
}

// =============================================================================
// ANIMATION & TRANSITIONS
// =============================================================================

export interface AnimationConfigEnhanced {
  duration: number;
  easing: string;
  useNativeDriver: boolean;
  reducedMotion?: boolean;
  springConfig?: {
    tension: number;
    friction: number;
    mass?: number;
  };
}

export interface StateTransitionConfigEnhanced {
  fadeOut: AnimationConfigEnhanced;
  fadeIn: AnimationConfigEnhanced;
  slide: {
    outDirection: number;
    inDirection: number;
    config: AnimationConfigEnhanced;
  };
  scale: {
    from: number;
    to: number;
    config: AnimationConfigEnhanced;
  };
}

// =============================================================================
// TESTING & VALIDATION
// =============================================================================

export interface TestingConfig {
  enableAccessibilityTesting: boolean;
  enablePerformanceTesting: boolean;
  mockDataSize: number;
  simulateSlowNetwork: boolean;
  debugMode: boolean;
}

export interface ValidationRules {
  dateFormat: RegExp;
  itemCountLimits: {
    min: number;
    max: number;
    warning: number;
  };
  performanceLimits: {
    maxRenderTime: number;
    maxMemoryUsage: number;
  };
}

// =============================================================================
// INTEGRATION INTERFACES
// =============================================================================

export interface CalendarIntegrationProps {
  foodItemsService: any;
  navigationService: any;
  notificationService?: any;
  analyticsService?: any;
  errorReportingService?: any;
}

export interface CalendarContextValue {
  state: CalendarStateEnhanced;
  actions: CalendarActions;
  config: CalendarConfig;
}

export interface CalendarActions {
  selectDate: (date: string) => void;
  changeMonth: (month: CalendarMonth) => void;
  addItem: () => void;
  editItem: (item: FoodItem) => void;
  deleteItem: (item: FoodItem) => void;
  markUsed: (item: FoodItem) => void;
  setFilter: (filter: FilterOptionsEnhanced) => void;
  setSort: (sort: SortOptionsEnhanced) => void;
  refresh: () => Promise<void>;
}

export interface CalendarConfig {
  colorScheme: CalendarColorScheme;
  accessibility: AccessibilityConfig;
  performance: PerformanceConfig;
  responsive: ResponsiveConfig;
  animations: StateTransitionConfigEnhanced;
}

export interface AccessibilityConfig {
  enabled: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  minimumTouchTarget: number;
  announcements: boolean;
}
