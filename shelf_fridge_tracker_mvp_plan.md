# Shelf & Fridge Tracker - MVP Development Plan

This document outlines the plan for building the Minimum Viable Product (MVP) of the Shelf & Fridge Tracker mobile app. The goal of the MVP is to deliver core functionalities: manual item entry, categorized item display, expiry date tracking, and pre-expiry notifications.

**Team:** You + 1 Friend (2 Developers)
**Target Platforms:** iOS & Android (using React Native)
**Backend:** Supabase
**Design:** Basic UI/UX template provided

---

## Phase 1: Foundation & Setup (Estimated: 1-2 Weeks)

**Goal:** Prepare the development environment and necessary backend services.

- [ ] **Project Setup & Version Control (Developer 1 & 2)**
  - [ ] Initialize React Native project.
  - [ ] Set up Git repository (e.g., on GitHub, GitLab).
  - [ ] Define branching strategy (e.g., main, develop, feature branches).
  - [ ] Ensure both developers can build and run the basic React Native app on their respective simulators/devices.
- [ ] **Supabase Setup (Developer 1 or 2)**
  - [ ] Create a new Supabase project.
  - [ ] Design initial database schema for food items:
    - `items` table: `id` (PK), `user_id` (FK to Supabase auth users), `name` (text), `quantity` (text/integer), `expiry_date` (date/timestamp), `location` (text - e.g., "fridge", "shelf"), `created_at` (timestamp).
  - [ ] Set up basic authentication (email/password) using Supabase Auth.
  - [ ] Familiarize with Supabase JavaScript client library for React Native.
- [ ] **Development Environment & Tools (Developer 1 & 2)**
  - [ ] Standardize Node.js and npm/yarn versions.
  - [ ] Choose and set up a code editor/IDE (e.g., VS Code) with relevant extensions (ESLint, Prettier).
  - [ ] Set up basic navigation (e.g., React Navigation).

---

## Phase 2: Core Feature Development - Item Management (Estimated: 2-3 Weeks)

**Goal:** Implement the ability for users to add, view, edit, and delete food items.

- [ ] **User Authentication Screens (Developer 1)**
  - [ ] Implement Sign Up screen.
  - [ ] Implement Log In screen.
  - [ ] Implement basic Log Out functionality.
  - [ ] Integrate with Supabase Auth.
- [ ] **"Add Item" Functionality (Developer 2)**
  - [ ] Create the "Add Item" screen/form with fields:
    - Item Name (text input)
    - Quantity (text/number input)
    - Expiry Date (date picker)
    - Location (dropdown/segmented control: "Fridge", "Shelf")
  - [ ] Implement form validation (e.g., name and expiry date are mandatory).
  - [ ] Save item data to Supabase `items` table, associating with the logged-in user.
- [ ] **"View Items" Functionality (Developer 1)**
  - [ ] Create a main screen to display items.
  - [ ] Fetch items from Supabase for the logged-in user.
  - [ ] Display items in a list format.
  - [ ] Implement basic separation/filtering by `location` (e.g., "Fridge" section, "Shelf" section, or tabs).
  - [ ] Show key item details: name, quantity, expiry date.
- [ ] **"Edit Item" Functionality (Developer 2)**
  - [ ] Allow users to select an item from the list to edit.
  - [ ] Pre-fill the "Add Item" form (or a similar form) with existing item data.
  - [ ] Update item data in Supabase.
- [ ] **"Delete Item" Functionality (Developer 1)**
  - [ ] Allow users to delete an item from the list (e.g., swipe to delete, long-press menu).
  - [ ] Confirm deletion with the user.
  - [ ] Remove item data from Supabase.

---

## Phase 3: Core Feature Development - Expiry Tracking & Notifications (Estimated: 2-3 Weeks)

**Goal:** Implement expiry date tracking and local notifications to alert users.

- [ ] **Expiry Date Logic & Display (Developer 2)**
  - [ ] Visually indicate items nearing expiry or expired in the item list (e.g., color coding, icons).
  - [ ] Sort items by expiry date (optional, but helpful).
- [ ] **Local Notifications Setup (Developer 1)**
  - [ ] Integrate a React Native local notifications library (e.g., `react-native-push-notification` or Expo's Notifications module if using Expo).
  - [ ] Request notification permissions from the user (iOS & Android).
- [ ] **Scheduling Expiry Notifications (Developer 2)**
  - [ ] When an item is added or edited, schedule local notifications:
    - e.g., 3 days before expiry.
    - e.g., 1 day before expiry.
    - e.g., on the day of expiry.
  - [ ] Ensure notifications are clear (e.g., "Your [Item Name] is expiring in 3 days!").
  - [ ] Handle updates/cancellation of notifications if an item's expiry date changes or if the item is deleted.
- [ ] **Background Notification Handling (Research & Basic Implementation) (Developer 1)**
  - [ ] Investigate how to ensure notifications can be triggered even if the app is not in the foreground (this can be complex; for MVP, focus on foreground/scheduled notifications if background proves too challenging quickly).
  - [ ] Implement basic handling for users tapping on a notification (e.g., open the app).

---

## Phase 4: UI Implementation & Basic Styling (Estimated: 1-2 Weeks)

**Goal:** Apply the provided UI/UX design template and ensure a clean, user-friendly interface.

- [ ] **Apply Global Styles (Developer 1)**
  - [ ] Implement a basic theme (colors, fonts) based on the UI/UX template.
  - [ ] Create reusable UI components (buttons, input fields, cards) as needed.
- [ ] **Style Authentication Screens (Developer 2)**
  - [ ] Apply styles to Sign Up and Log In screens.
- [ ] **Style Item Management Screens (Developer 1)**
  - [ ] Apply styles to the "Add Item" form.
  - [ ] Apply styles to the item list display, ensuring clarity for item details and expiry status.
- [ ] **Navigation Styling (Developer 2)**
  - [ ] Style tab bars, headers, or any other navigation elements according to the design.
- [ ] **Cross-Platform UI Consistency Check (Developer 1 & 2)**
  - [ ] Review UI on both iOS and Android simulators/devices to ensure acceptable consistency and address platform-specific quirks.

---

## Phase 5: Testing & Refinement (Estimated: 1-2 Weeks)

**Goal:** Ensure the app is stable, user-friendly, and core features work as expected.

- [ ] **Unit & Component Testing (Developer 1 & 2)**
  - [ ] Write basic unit tests for critical functions (e.g., date calculations, form validation). (Optional for MVP if time is very tight, but recommended).
- [ ] **Manual End-to-End Testing (Developer 1 & 2)**
  - [ ] Test all user flows:
    - Sign up, log in, log out.
    - Add various items (different names, quantities, expiry dates, locations).
    - View items in fridge/shelf.
    - Edit existing items.
    - Delete items.
    - Receive expiry notifications correctly.
  - [ ] Test on different devices/screen sizes if possible.
  - [ ] Test edge cases (e.g., what happens if an expiry date is in the past? No items?).
- [ ] **Bug Fixing (Developer 1 & 2)**
  - [ ] Prioritize and fix bugs identified during testing.
- [ ] **Usability Review & Feedback (Developer 1 & 2 with potential external testers if available)**
  - [ ] Get feedback from a few potential users (friends, family) if possible.
  - [ ] Make small usability improvements based on feedback.
  - [ ] Ensure the app is intuitive and achieves its goal of helping users track food.

---

## Phase 6: Deployment & Launch Preparation (Estimated: 1 Week)

**Goal:** Prepare the app for submission to app stores.

- [ ] **App Icons & Splash Screen (Developer 1)**
  - [ ] Create and integrate app icons for iOS and Android.
  - [ ] Create and integrate a splash screen.
- [ ] **Build Configuration for Release (Developer 2)**
  - [ ] Configure app for release builds (bundle identifiers, versioning, signing).
- [ ] **App Store Listing Preparation (Developer 1 or 2)**
  - [ ] Write app title, description, keywords.
  - [ ] Prepare screenshots for app store listings.
  - [ ] Familiarize with App Store Connect (iOS) and Google Play Console (Android) submission processes.
- [ ] **Final Testing of Release Builds (Developer 1 & 2)**
  - [ ] Test the release builds thoroughly on physical devices.
- [ ] **(Decision Point) Choose Initial Launch Platform (You)**
  - [ ] Decide whether to launch on iOS first, Android first, or both simultaneously.
- [ ] **Submission to App Store(s) (Developer 1 or 2)**
  - [ ] Follow the submission guidelines for the chosen platform(s).

---

### Post-MVP Considerations (For Future Planning - Not part of this MVP plan)

- Barcode Scanning
- Photo Entry (with or without OCR/Image Recognition)
- Advanced Consumption Logging & Waste Insights
- Smart Shopping Lists
- Recipe Suggestions
- Multi-User Support / Shared Households
- Voice Commands
- Offline Support
- Enhanced Data Privacy Features
- Analytics (user behavior, feature usage)

---

**Notes:**

- This timeline is an estimate. Actual time may vary based on developer experience and unforeseen challenges.
- Regular communication and code reviews between the two developers are crucial.
- Prioritize functionality that directly helps users reduce waste and save money.
- Keep it simple for the MVP. Features can be added in later iterations based on user feedback.
