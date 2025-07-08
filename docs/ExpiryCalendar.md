# Expiry Calendar Feature

The Expiry Calendar feature provides users with a visual calendar view of their food items' expiration dates, making it easier to plan meals and reduce food waste.

## Overview

The Expiry Calendar displays food items on a monthly calendar, with color-coded dots indicating the expiration status:

- **Red**: Expired items
- **Orange**: Items expiring today
- **Green**: Future expiring items

When a date is selected, all items expiring on that date are displayed in a list below the calendar.

## Technical Implementation

### Components

1. **ExpiryCalendar**: The main component that renders the calendar and item list.

   - Handles date selection and month navigation
   - Fetches and displays items for the selected date
   - Located at `components/ExpiryCalendar.tsx`

2. **CalendarScreen**: The tab screen that hosts the ExpiryCalendar component.
   - Located at `app/(tabs)/calendar.tsx`

### Services and Utilities

1. **foodItemsService.getItemsByExpiryDate()**: Fetches food items grouped by expiry date.

   - Located in `services/foodItems.ts`

2. **calendarUtils**: Utility functions for calendar operations.
   - `formatItemsForCalendar()`: Formats items for the calendar's marked dates
   - `getMonthRange()`: Gets the date range for a specific month
   - `formatDateForDisplay()`: Formats dates for user-friendly display
   - Located in `utils/calendarUtils.ts`

## User Flow

1. User navigates to the Calendar tab
2. The calendar loads with the current month displayed
3. Dates with expiring items are marked with colored dots
4. User can:
   - Swipe between months
   - Tap on a date to see items expiring on that date
   - Tap on an item to view its details

## Testing

Tests for the Expiry Calendar feature are located in:

- `components/__tests__/ExpiryCalendar.test.tsx`
- `utils/__tests__/calendarUtils.test.ts`

## Future Enhancements

Potential improvements for future versions:

1. Add filters for specific food categories
2. Implement a weekly view option
3. Add the ability to create reminders for specific expiry dates
4. Include a "shopping list" feature based on expiring items
5. Add a heatmap view to show days with the most expiring items
