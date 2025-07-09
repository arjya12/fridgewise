# Push Notification Strategy Specification

## Overview

This document outlines the enhanced push notification strategy for FridgeWise that transforms the Expiry Calendar from a passive tool into a proactive assistant. The strategy builds upon the existing notification infrastructure to drive user engagement and reduce food waste.

## Current State Analysis

### Existing Infrastructure ✅

- **expo-notifications** library configured
- Background task system with `EXPIRY_CHECK_TASK`
- Android notification channels set up ("expiry-alerts", "low-stock-alerts")
- User preference controls in settings (`expiryAlerts`, `lowStockAlerts`)
- Basic expiry checking service (`checkExpiringItems`)

### Current Limitations

- Notifications are generic and don't drive specific actions
- 3-day window is too narrow for meal planning
- No differentiation between urgency levels
- Missing call-to-action in notification content
- No personalization based on user behavior

## Enhanced Notification Strategy

### 1. Notification Timing Optimization

#### Multi-Tier Alert System

Replace the current 3-day window with a graduated approach:

**Week-Ahead Alert (7 days)**

- **Purpose**: Meal planning and grocery shopping
- **Message**: "Plan ahead: 5 items expiring this week"
- **Frequency**: Sunday mornings at 9 AM
- **Target**: Users with 3+ items expiring in the next 7 days

**Mid-Week Reminder (3 days)**

- **Purpose**: Active meal planning
- **Message**: "Use soon: Milk and chicken expire in 3 days"
- **Frequency**: Wednesday evenings at 6 PM
- **Target**: Items expiring within 3 days

**Urgent Alert (Today/Tomorrow)**

- **Purpose**: Immediate action required
- **Message**: "🚨 Use today: Your yogurt expires!"
- **Frequency**: Morning (8 AM) and evening (6 PM)
- **Target**: Items expiring today or tomorrow

### 2. Content Strategy Enhancement

#### Actionable Messaging

Transform generic alerts into actionable guidance:

**Current**: "Milk expires tomorrow"
**Enhanced**: "Use your milk today! Tap to see recipe ideas →"

**Current**: "3 items expire today"
**Enhanced**: "Cook tonight: Chicken, peppers & cheese expire today 🍽️"

#### Personalized Content

Adapt messaging based on user patterns:

- **Heavy users**: "Great job managing your food! 2 items need attention"
- **Casual users**: "Quick check: You have items expiring soon"
- **New users**: "Food waste tip: Check your items expiring this week"

### 3. Calendar Integration Strategy

#### Deep Linking to Calendar

Every notification should drive users to the calendar:

```typescript
// Enhanced notification data payload
{
  type: "expiry",
  action: "view_calendar",
  selectedDate: "2024-01-15",
  itemIds: ["item1", "item2"],
  priority: "high" | "medium" | "low"
}
```

#### Calendar Destination Logic

- **Single item expiring**: Open calendar with that date selected
- **Multiple dates**: Open calendar with "Expiring Soon" view active
- **Weekly planning**: Open calendar with current week highlighted

### 4. Notification Frequency Management

#### Smart Throttling

Prevent notification fatigue with intelligent spacing:

- **Maximum**: 1 notification per day per user
- **Minimum gap**: 4 hours between any notifications
- **Priority override**: Urgent (today) alerts can interrupt schedule
- **User override**: Manual "Check now" always works

#### Adaptive Timing

Learn from user engagement patterns:

```typescript
interface UserNotificationProfile {
  preferredTime: string; // "08:00", "18:00", etc.
  engagementRate: number; // 0-1 scale
  lastActiveTime: string;
  responseTimeMinutes: number; // How quickly they act on notifications
}
```

### 5. Implementation Roadmap

#### Phase 1: Enhanced Alerting (Week 1)

- [ ] **Extend time windows**: Update `checkExpiringItems` to support 1, 3, and 7-day windows
- [ ] **Smart batching**: Group items by urgency in single notification
- [ ] **Deep link payload**: Add calendar navigation data to notifications
- [ ] **Message templates**: Create personalized notification content templates

#### Phase 2: User Profiling (Week 2)

- [ ] **Engagement tracking**: Monitor notification tap rates and response times
- [ ] **Preference learning**: Adapt timing based on user behavior
- [ ] **Context awareness**: Consider time of day, day of week for notifications
- [ ] **A/B testing**: Test different message styles and timing

#### Phase 3: Advanced Features (Week 3)

- [ ] **Recipe integration**: "Need recipe ideas? Your chicken expires tomorrow"
- [ ] **Shopping suggestions**: "Running low on milk? Add to shopping list"
- [ ] **Achievement system**: "Great job! You've reduced waste by 40% this month"
- [ ] **Social features**: "Share your waste reduction achievements"

## Technical Implementation

### Enhanced Notification Service

```typescript
interface EnhancedNotificationConfig {
  urgencyLevel: "low" | "medium" | "high";
  timeWindow: 1 | 3 | 7; // days
  maxItemsPerNotification: number;
  calendarDestination: "specific_date" | "expiring_soon" | "weekly_view";
  includeRecipeSuggestions: boolean;
  personalizedMessage: boolean;
}

async function scheduleEnhancedNotification(
  items: FoodItem[],
  config: EnhancedNotificationConfig,
  userProfile: UserNotificationProfile
): Promise<string | null> {
  // Implementation details
}
```

### Background Task Enhancement

```typescript
// Enhanced expiry check with multiple time windows
export async function checkExpiringItemsEnhanced(
  settings: UserNotificationSettings,
  userId: string,
  userProfile: UserNotificationProfile
): Promise<boolean> {
  // Check multiple time windows
  const urgentItems = await getItemsExpiringInDays(0, 1); // Today/tomorrow
  const soonItems = await getItemsExpiringInDays(2, 3); // 2-3 days
  const planningItems = await getItemsExpiringInDays(4, 7); // 4-7 days

  // Schedule appropriate notifications based on urgency and user preferences
  if (urgentItems.length > 0) {
    await scheduleUrgentAlert(urgentItems, userProfile);
  } else if (soonItems.length > 0) {
    await scheduleSoonAlert(soonItems, userProfile);
  } else if (planningItems.length > 0 && shouldSendPlanningAlert(userProfile)) {
    await schedulePlanningAlert(planningItems, userProfile);
  }

  return true;
}
```

### Calendar Deep Linking

```typescript
// Handle notification tap in main app
export function handleNotificationResponse(
  notificationResponse: Notifications.NotificationResponse
): void {
  const { data } = notificationResponse.notification.request.content;

  if (data.action === "view_calendar") {
    if (data.selectedDate) {
      // Navigate to calendar with specific date selected
      router.push(`/(tabs)/calendar?selectedDate=${data.selectedDate}`);
    } else {
      // Navigate to calendar with "Expiring Soon" view
      router.push("/(tabs)/calendar?view=expiring-soon");
    }
  }
}
```

## User Experience Flow

### Notification → Calendar → Action Journey

1. **Notification Received**: "Use today: Chicken breast expires! 🍗"
2. **User Taps Notification**: App opens to calendar with today's date selected
3. **Calendar Shows Details**: Chicken breast item card with action buttons
4. **User Takes Action**: "Mark as Used" or "View Recipe Ideas"
5. **Positive Reinforcement**: "Great job preventing waste! 🌟"

### Weekly Planning Flow

1. **Sunday Planning Alert**: "Plan ahead: 5 items expiring this week"
2. **Calendar Overview**: Shows week view with all expiring items
3. **Meal Planning**: User can see Monday: Milk, Wednesday: Chicken, Friday: Apples
4. **Action Planning**: User mentally notes to make smoothie Monday, chicken dinner Wednesday
5. **Follow-up**: Mid-week reminders reference the plan

## Success Metrics

### Engagement Metrics

- **Notification tap rate**: Target 40%+ (industry average 20-25%)
- **Calendar session duration**: Target 2+ minutes after notification tap
- **Action completion**: Target 60% of calendar visits result in item action

### Behavioral Metrics

- **Food waste reduction**: Measured via "Mark as Used" vs "Delete as Expired"
- **Proactive usage**: Users acting on items before expiry date
- **Planning behavior**: Calendar usage on non-notification days

### Business Metrics

- **Daily active users**: Increase through notification engagement
- **Session frequency**: More frequent app opens driven by notifications
- **Feature adoption**: Increased use of calendar and action features

## Risk Management

### Notification Fatigue

- **Mitigation**: Strict frequency limits and adaptive timing
- **Monitoring**: Track notification disable rates and user feedback
- **Fallback**: Reduce frequency automatically if engagement drops

### Technical Failures

- **Backup scheduling**: Multiple notification scheduling attempts
- **Graceful degradation**: Fall back to basic notifications if enhanced features fail
- **User override**: Always allow manual "Check now" functionality

### Privacy Concerns

- **Data minimization**: Only store essential notification preferences
- **Transparency**: Clear explanation of how notification timing is determined
- **User control**: Easy opt-out and frequency adjustment

## Future Enhancements

### AI-Powered Optimization

- **Meal suggestion**: "Your chicken and vegetables expire soon - perfect for stir fry!"
- **Shopping optimization**: "You frequently run out of milk on Thursdays - consider buying more"
- **Waste pattern analysis**: "You often waste lettuce - try buying smaller quantities"

### Social Features

- **Family coordination**: "Mom added milk expiring tomorrow - someone should use it"
- **Community challenges**: "Your neighborhood reduced waste by 25% this month!"
- **Recipe sharing**: "Sarah used similar expiring items for this delicious recipe"

### Integration Opportunities

- **Calendar apps**: Sync meal planning with phone calendar
- **Recipe services**: Direct integration with cooking apps
- **Grocery delivery**: One-tap reordering of frequently wasted items

## Implementation Priority

### Must-Have (MVP)

1. Enhanced time windows (7-day, 3-day, urgent)
2. Calendar deep linking with date selection
3. Actionable notification content
4. Smart batching of multiple items

### Should-Have (V2)

1. User behavior profiling and adaptive timing
2. Personalized message content
3. Recipe suggestion integration
4. Engagement analytics dashboard

### Nice-to-Have (Future)

1. AI-powered meal suggestions
2. Social sharing features
3. Advanced waste analytics
4. Third-party app integrations
