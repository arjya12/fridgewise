import { Platform, UIManager } from "react-native";

/**
 * Enables LayoutAnimation on Android when using the legacy bridge.
 * On New Architecture (Bridgeless), `setLayoutAnimationEnabledExperimental` is a no-op
 * and emits a dev warning — do not call it there.
 */
export function enableAndroidLayoutAnimationExperimental(): void {
  if (Platform.OS !== "android") return;
  if ((global as unknown as { RN$Bridgeless?: boolean }).RN$Bridgeless === true) {
    return;
  }
  const fn = UIManager.setLayoutAnimationEnabledExperimental;
  if (typeof fn === "function") {
    fn(true);
  }
}
