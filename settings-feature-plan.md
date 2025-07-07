# Settings Feature Implementation Plan

This document outlines the steps to implement the remaining functionality for the settings screen.

## Phase 1: Notification System

Implement a local notification system for expiry and low-stock alerts, and conditionally render UI based on notification settings.

### 1.1: Core Notification Setup

- [x] Install and configure `expo-notifications`.
- [x] Request notification permissions from the user on app startup.
- [x] Install and configure `expo-background-fetch`.

### 1.2: Expiry Alerts

- [x] Create a new service/task to check for expiring items.
- [x] The task should fetch all items and identify those expiring within a user-defined (or default) timeframe.
- [x] Before running, the task must check if `settings.expiryAlerts` is `true`.
- [x] If an expiring item is found, schedule a local notification using `expo-notifications`.
- [x] Register and schedule the background task to run periodically (e.g., once a day).

### 1.3: Low Stock Alerts

- [x] Create a new service/task to check for low-stock items.
- [x] The task should fetch all items and identify those below a certain threshold.
- [x] Before running, the task must check if `settings.lowStockAlerts` is `true`.
- [x] If a low-stock item is found, schedule a local notification.
- [x] Register and schedule this task to run alongside the expiry check.

### 1.4: In-App Content Toggles

- [x] Modify the dashboard (`app/(tabs)/index.tsx`) to only show the `TipCard` component if `settings.helpfulTips` is `true`.
- [ ] (Future) Use the `settings.appUpdates` flag to control whether a "What's New" modal appears after an update.

## Phase 2: User Profile Management

Build a dedicated screen for users to view and edit their profile information.

### 2.1: Screen and Navigation

- [ ] Create a new screen file, potentially at `app/(tabs)/profile.tsx` or `app/profile.tsx` if you want it to be a modal.
- [ ] Update the navigation from the "Profile" button in `app/(tabs)/settings.tsx` to link to the new profile screen instead of showing an `Alert`.
- [ ] Design the UI for the profile screen, including fields for display name, avatar, and other editable information.

### 2.2: Data Fetching and Display

- [ ] In the new profile screen, fetch the user's profile data from the `profiles` table in Supabase when the screen loads.
- [ ] Populate the UI fields with the fetched data.
- [ ] Handle loading and error states gracefully.

### 2.3: Data Updating

- [ ] Implement an "Update Profile" function that takes the new data from the UI state.
- [ ] This function will call a Supabase function to update the corresponding row in the `profiles` table.
- [ ] Provide user feedback on success or failure of the update.
- [ ] (Optional) Add logic for uploading a new profile picture to Supabase Storage and updating the avatar URL in the user's profile.
