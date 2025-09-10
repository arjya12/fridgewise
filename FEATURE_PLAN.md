# FridgeWise Feature Implementation Plan

This document outlines the step-by-step plan for implementing two new features in the FridgeWise application: Barcode Scanner and Expiry Calendar View.

---

## 1. Barcode Scanner Integration

**Description:** Camera-based barcode scanning for instant item entry. This feature will reduce manual entry friction and improve data accuracy.

### Phase 1: Discovery & Setup

- [x] **Task 1.1: Install Dependencies:** Install `expo-camera`, `expo-barcode-scanner`, and `axios` for API calls.
- [x] **Task 1.2: API Key & Documentation:** Sign up for the `UPC-Search.org` API and review their documentation to understand request/response formats.
- [x] **Task 1.3: Create Barcode Service:** Create a new service file `services/barcodeService.ts` to encapsulate API calls to the barcode lookup service.

### Phase 2: Design & Prototyping

- [x] **Task 2.1: Design Scanner UI:** Design the UI for the camera view, including a viewfinder overlay and a button to manually enter a barcode.
- [x] **Task 2.2: Prototype Scanner Component:** Create a new component `components/BarcodeScanner.tsx` that requests camera permissions and displays the camera feed.

### Phase 3: Implementation

- [x] **Task 3.1: Implement Barcode Scanning:** Integrate `expo-barcode-scanner` into the `BarcodeScanner` component to detect barcodes from the camera feed.
- [x] **Task 3.2: Implement API Lookup:** When a barcode is scanned, call the `barcodeService` to fetch product information from the `UPC-Search.org` API.
- [x] **Task 3.3: Pre-fill Add Item Form:** On successful lookup, navigate to the `app/(tabs)/add.tsx` screen and pre-fill the form with the fetched product name. The user can then complete the remaining fields (expiry date, quantity, etc.).
- [x] **Task 3.4: Add Scanner Entry Point:** Add a "Scan Barcode" button on the `app/(tabs)/add.tsx` screen that opens the `BarcodeScanner` component as a modal.
- [x] **Task 3.5: Handle Scan Failures:** Implement error handling for cases where the API does not find the barcode or the API call fails. Show an alert to the user with an option to enter the item manually.

### Phase 4: Testing

- [x] **Task 4.1: Unit Test Barcode Service:** Write unit tests for the `barcodeService` to mock API calls and test success/error cases.
- [x] **Task 4.2: Component Test BarcodeScanner:** Write component tests for the `BarcodeScanner` component to verify UI elements and permission requests. (Note: Camera interaction is difficult to test in Jest; focus on what can be tested).
- [x] **Task 4.3: Manual E2E Testing:** Manually test the full flow on physical devices (iOS and Android) with a variety of real-world barcodes.

### Phase 5: Deployment

- [x] **Task 5.1: Documentation:** Add comments and documentation for the new components and services.
- [x] **Task 5.2: Merge & Deploy:** Merge the feature branch into `main` and deploy as part of the next release.

---

## 2. Expiry Calendar View

**Description:** A calendar view showing what items expire on which days, with a meal planning overlay.

### Phase 1: Discovery & Setup

- [ ] **Task 1.1: Install Calendar Library:** Install `react-native-calendars` to be used for the calendar view.
- [ ] **Task 1.2: Data Fetching for Calendar:** Enhance `services/foodItems.ts` to include a function that fetches all food items with expiry dates to populate the calendar.

### Phase 2: Design & Prototyping

- [ ] **Task 2.1: Design Calendar UI:** Design the calendar view. Each day with expiring items should be marked. When a day is selected, it should show a list of items expiring on that day.
- [ ] **Task 2.2: Prototype Calendar Component:** Create a new screen `app/(tabs)/calendar.tsx` and add the basic `react-native-calendars` component.

### Phase 3: Implementation

- [ ] **Task 3.1: Populate Calendar with Data:** In `app/(tabs)/calendar.tsx`, fetch the food items and use the `marking` prop of the calendar component to mark dates with expiring items.
- [ ] **Task 3.2: Display Expiring Items:** When a user presses on a marked date, display a list of the items expiring on that day below the calendar.
- [ ] **Task 3.3: Add Navigation:** Add a new tab in the main tab navigator `app/(tabs)/_layout.tsx` for the "Calendar" screen.
- [ ] **Task 3.4: Meal Planning Overlay (Stretch Goal):** Implement a simple "Add to Meal Plan" button for each item in the list. This would be a future enhancement and not part of the initial implementation.

### Phase 4: Testing

- [ ] **Task 4.1: Unit Test Calendar Data Logic:** Write unit tests for the data transformation logic that prepares data for the calendar component.
- [ ] **Task 4.2: Component Test Calendar Screen:** Write component tests for the `calendar.tsx` screen to ensure it renders correctly with mock data.
- [ ] **Task 4.3: Manual E2E Testing:** Manually test the calendar on both iOS and Android, verifying that dates are marked correctly and item lists are accurate.

### Phase 5: Deployment

- [ ] **Task 5.1: Documentation:** Add comments and documentation for the new calendar screen.
- [ ] **Task 5.2: Merge & Deploy:** Merge the feature branch into `main` and deploy as part of the next release.

---

## Dependency Mapping

- **Barcode Scanner** is a standalone feature and has no dependencies on the Expiry Calendar.
- **Expiry Calendar** is also a standalone feature. It depends on the existing data structure for food items, specifically the `expiry_date` field.

Both features can be developed in parallel.

---

## Technical Risks & Mitigation Strategies

### Barcode Scanner

- **Risk:** The free `UPC-Search.org` API has poor data quality or is unreliable.
  - **Mitigation:** Be prepared to switch to a paid API like `Go-UPC`. The `barcodeService` will act as an abstraction layer, making it easier to swap out the underlying API provider with minimal code changes.
- **Risk:** Poor camera performance or barcode detection on older devices.
  - **Mitigation:** Test on a range of physical devices. Provide clear instructions to the user for getting a good scan (e.g., good lighting, hold steady). Include a manual entry fallback.

### Expiry Calendar View

- **Risk:** Performance issues when fetching and displaying a large number of items on the calendar.
  - **Mitigation:** Optimize data fetching to only get items within a reasonable time frame (e.g., a few months in the past and future). Use `useMemo` to prevent unnecessary re-renders of the item list.
- **Risk:** The `react-native-calendars` library has bugs or limitations.
  - **Mitigation:** Thoroughly test the library's functionality during the implementation phase. If significant issues are found, research alternative calendar libraries.
