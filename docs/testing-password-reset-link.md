# Testing the password reset deep link

The reset link uses the custom scheme `fridgewise://reset-password`. It **only works in a development or production build**, not in Expo Go.

## 1. Use a development build

Custom schemes are registered when you build the app. If you're using **Expo Go**, the link will not open your app.

```bash
# Build and run on device/simulator
npx expo run:ios
# or
npx expo run:android
```

Rebuild after any change to `scheme` in `app.json`.

## 2. Test the deep link without email

**Open the app first** (cold launch from a link can be unreliable). Then in a **second terminal** run:

```bash
# iOS Simulator or connected iPhone
npm run test:deep-link:ios

# Android emulator or connected device
npm run test:deep-link:android
```

Or without the script:

```bash
npx uri-scheme open "fridgewise://reset-password" --ios
npx uri-scheme open "fridgewise://reset-password" --android
```

If routing is correct, the app should switch to the reset-password screen (it will show "Link expired" or "Verifying link…" because there are no tokens in the URL; that’s expected).

## 3. Test the real email link

1. In the app, use **Forgot password** and enter your email.
2. In Supabase: **Authentication → URL Configuration → Redirect URLs** includes `fridgewise://reset-password` or `fridgewise://**`.
3. Open the reset email on the **same device** where the dev build is installed.
4. Tap the link. It should open the app and land on the reset-password screen with the form.

If the link opens in a browser instead of the app, the device may not have the app installed with the `fridgewise` scheme, or you may be on a simulator/emulator where the email client uses a different context. Try opening the link from the device’s mail app with the dev build installed and in the foreground.

## Summary

| Environment   | `fridgewise://` link works? |
|---------------|----------------------------|
| Expo Go       | No                         |
| Dev build     | Yes (after `expo run:ios` / `expo run:android`) |
| Production app| Yes                        |
