<p align="center">
  <img src="https://github.com/arjya12/fridgewise/blob/879b97162eb277c0e224c68141dddec544da5249/Screenshot_1757475399.png" alt="FridgeWise logo" width="96" />
</p>
<h2 align="center">FridgeWise — Smart Food Inventory & Expiry Tracking</h2>
<p align="center">Turn your kitchen notes into organized lists, timely reminders, and less waste.</p>

---

![Welcome screen](https://github.com/arjya12/fridgewise/blob/879b97162eb277c0e224c68141dddec544da5249/Screenshot_1757475409.png)

![Create Account](https://github.com/arjya12/fridgewise/blob/879b97162eb277c0e224c68141dddec544da5249/Screenshot_1757475424.png)

![Sign In](https://github.com/arjya12/fridgewise/blob/879b97162eb277c0e224c68141dddec544da5249/Screenshot_1757475437.png)

![Home Dashboard](https://github.com/arjya12/fridgewise/blob/879b97162eb277c0e224c68141dddec544da5249/Screenshot_1757475457.png)

![Food Expiry Calendar](docs/screenshots/calendar.png)

![Shopping List](https://github.com/arjya12/fridgewise/blob/879b97162eb277c0e224c68141dddec544da5249/Screenshot_1757475466.png)

![More / Profile](https://github.com/arjya12/fridgewise/blob/879b97162eb277c0e224c68141dddec544da5249/Screenshot_1757475468.png)

---

### Overview / Introduction

FridgeWise helps households and meal preppers track food inventory across fridge, freezer, and pantry. It scans barcodes, predicts expiry windows, sends timely notifications, and provides insights to reduce waste and optimize shopping. Built with Expo and React Native, it runs on iOS, Android, and the web.

---

### Features

- Barcode scanning via camera to auto-fill item details
- Smart expiry tracking with extend/consume actions and swipe gestures
- Rich calendar views (day/week/month) and upcoming-expiry lists
- Batch selection and quick actions for power users
- Local notifications with customizable preferences
- Inventory analytics, waste insights, and achievement system
- Offline-ready storage and sync with Supabase backend
- Accessible UI with dark mode and responsive layouts
- Cross-platform support (iOS, Android, Web) using Expo

---

### Tech Stack

- Core: TypeScript, React 19, React Native 0.79, Expo 53, Expo Router 5
- Navigation: React Navigation 7
- UI/UX: Reanimated 3, React Native Gesture Handler 2, react-native-safe-area-context
- Device & OS: expo-camera, expo-image, expo-notifications, expo-splash-screen, expo-linking
- Data & Networking: Supabase JS, AsyncStorage, Axios
- Tooling: Metro bundler, ESLint (Expo config), Jest + jest-expo, React Native Testing Library
- Build & Distribution: EAS Build/Submit

---

### Installation / Setup Instructions

Prerequisites:

- Node.js 18+ and npm 9+
- Git
- Expo CLI (recommended):

```bash
npm i -g expo
```

- For native testing:
  - Android Studio (Android SDK + emulator)
  - Xcode (iOS simulator) on macOS

1. Clone the repository

```bash
git clone <your-fork-or-origin-url> fridgewise
cd fridgewise
```

2. Install dependencies

```bash
npm install
# or for clean CI-like installs
npm ci
```

3. Configure environment variables

Expo loads `.env` by default. Create a `.env` file in the project root:

```bash
cp .env.example .env # If you have an example file
# Otherwise, create it manually:
```

```bash
# .env
EXPO_PUBLIC_SUPABASE_URL=<your-supabase-url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

4. Start the development server

```bash
npm run start
```

Then:

- Press `a` for Android, `i` for iOS (macOS), or `w` for web.
- Or open Expo Go on your device and scan the QR code.

Optional shortcuts:

```bash
npm run android
npm run ios
npm run web
```

---

### Usage

- Authentication: Sign in/up (Supabase) from the auth screens.
- Add items: Use the “Add Item” flow or scan a barcode to autofill.
- Manage inventory: Swipe cards to extend expiry, consume, or move locations.
- Calendar: View upcoming expiries in calendar views and 7‑day summaries.
- Notifications: Enable push permissions and configure preferences in settings.

See screenshots above.

Developer utilities:

```bash
# Run tests
npm test

# Run lint, typecheck, and tests together
npm run check

# Test local notification (example helper script)
node scripts/test-local-notification.js
```

---

---

### License

MIT © FridgeWise contributors. See the [LICENSE](#) file.

---

### Maintainers & Support

- <Add maintainer/contact or discussion link here>

For issues and feature requests, please open a GitHub Issue with reproduction steps and device info.
