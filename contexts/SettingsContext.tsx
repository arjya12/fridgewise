import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme as useDeviceColorScheme } from "react-native";

// Define the theme types
type ThemeType = "light" | "dark" | "system";

// Define the settings interface
interface SettingsContextType {
  // Theme settings
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  effectiveTheme: "light" | "dark"; // The actual theme applied (resolves 'system')

  // Language settings
  language: string;
  setLanguage: (language: string) => void;

  // Notification settings
  expiryAlerts: boolean;
  setExpiryAlerts: (enabled: boolean) => void;
  lowStockAlerts: boolean;
  setLowStockAlerts: (enabled: boolean) => void;
  helpfulTips: boolean;
  setHelpfulTips: (enabled: boolean) => void;
  appUpdates: boolean;
  setAppUpdates: (enabled: boolean) => void;

  // Privacy settings
  analytics: boolean;
  setAnalytics: (enabled: boolean) => void;
  crashReports: boolean;
  setCrashReports: (enabled: boolean) => void;
}

// Storage keys
const STORAGE_KEYS = {
  THEME: "settings.theme",
  LANGUAGE: "settings.language",
  EXPIRY_ALERTS: "settings.expiryAlerts",
  LOW_STOCK_ALERTS: "settings.lowStockAlerts",
  HELPFUL_TIPS: "settings.helpfulTips",
  APP_UPDATES: "settings.appUpdates",
  ANALYTICS: "settings.analytics",
  CRASH_REPORTS: "settings.crashReports",
};

// Create the context with default values
const SettingsContext = createContext<SettingsContextType>({
  theme: "system",
  setTheme: () => {},
  effectiveTheme: "light",
  language: "English",
  setLanguage: () => {},
  expiryAlerts: true,
  setExpiryAlerts: () => {},
  lowStockAlerts: true,
  setLowStockAlerts: () => {},
  helpfulTips: true,
  setHelpfulTips: () => {},
  appUpdates: false,
  setAppUpdates: () => {},
  analytics: true,
  setAnalytics: () => {},
  crashReports: true,
  setCrashReports: () => {},
});

// Provider component
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  // Device theme from the system
  const deviceTheme = useDeviceColorScheme();

  // State for all settings
  const [theme, setThemeState] = useState<ThemeType>("system");
  const [language, setLanguageState] = useState("English");
  const [expiryAlerts, setExpiryAlertsState] = useState(true);
  const [lowStockAlerts, setLowStockAlertsState] = useState(true);
  const [helpfulTips, setHelpfulTipsState] = useState(true);
  const [appUpdates, setAppUpdatesState] = useState(false);
  const [analytics, setAnalyticsState] = useState(true);
  const [crashReports, setCrashReportsState] = useState(true);

  // Calculate the effective theme (resolving 'system')
  const effectiveTheme = theme === "system" ? deviceTheme || "light" : theme;

  // Load settings from AsyncStorage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load theme
        const savedTheme = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
        if (savedTheme) {
          setThemeState(savedTheme as ThemeType);
        }

        // Load language
        const savedLanguage = await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE);
        if (savedLanguage) {
          setLanguageState(savedLanguage);
        }

        // Load notification settings
        const savedExpiryAlerts = await AsyncStorage.getItem(
          STORAGE_KEYS.EXPIRY_ALERTS
        );
        if (savedExpiryAlerts !== null) {
          setExpiryAlertsState(savedExpiryAlerts === "true");
        }

        const savedLowStockAlerts = await AsyncStorage.getItem(
          STORAGE_KEYS.LOW_STOCK_ALERTS
        );
        if (savedLowStockAlerts !== null) {
          setLowStockAlertsState(savedLowStockAlerts === "true");
        }

        const savedHelpfulTips = await AsyncStorage.getItem(
          STORAGE_KEYS.HELPFUL_TIPS
        );
        if (savedHelpfulTips !== null) {
          setHelpfulTipsState(savedHelpfulTips === "true");
        }

        const savedAppUpdates = await AsyncStorage.getItem(
          STORAGE_KEYS.APP_UPDATES
        );
        if (savedAppUpdates !== null) {
          setAppUpdatesState(savedAppUpdates === "true");
        }

        // Load privacy settings
        const savedAnalytics = await AsyncStorage.getItem(
          STORAGE_KEYS.ANALYTICS
        );
        if (savedAnalytics !== null) {
          setAnalyticsState(savedAnalytics === "true");
        }

        const savedCrashReports = await AsyncStorage.getItem(
          STORAGE_KEYS.CRASH_REPORTS
        );
        if (savedCrashReports !== null) {
          setCrashReportsState(savedCrashReports === "true");
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    };

    loadSettings();
  }, []);

  // Save settings to AsyncStorage when they change
  const setTheme = async (newTheme: ThemeType) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME, newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error("Failed to save theme setting:", error);
    }
  };

  const setLanguage = async (newLanguage: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, newLanguage);
      setLanguageState(newLanguage);
    } catch (error) {
      console.error("Failed to save language setting:", error);
    }
  };

  const setExpiryAlerts = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.EXPIRY_ALERTS, String(enabled));
      setExpiryAlertsState(enabled);
    } catch (error) {
      console.error("Failed to save expiry alerts setting:", error);
    }
  };

  const setLowStockAlerts = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.LOW_STOCK_ALERTS,
        String(enabled)
      );
      setLowStockAlertsState(enabled);
    } catch (error) {
      console.error("Failed to save low stock alerts setting:", error);
    }
  };

  const setHelpfulTips = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HELPFUL_TIPS, String(enabled));
      setHelpfulTipsState(enabled);
    } catch (error) {
      console.error("Failed to save helpful tips setting:", error);
    }
  };

  const setAppUpdates = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.APP_UPDATES, String(enabled));
      setAppUpdatesState(enabled);
    } catch (error) {
      console.error("Failed to save app updates setting:", error);
    }
  };

  const setAnalytics = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ANALYTICS, String(enabled));
      setAnalyticsState(enabled);
    } catch (error) {
      console.error("Failed to save analytics setting:", error);
    }
  };

  const setCrashReports = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CRASH_REPORTS, String(enabled));
      setCrashReportsState(enabled);
    } catch (error) {
      console.error("Failed to save crash reports setting:", error);
    }
  };

  // Create the value object
  const value: SettingsContextType = {
    theme,
    setTheme,
    effectiveTheme,
    language,
    setLanguage,
    expiryAlerts,
    setExpiryAlerts,
    lowStockAlerts,
    setLowStockAlerts,
    helpfulTips,
    setHelpfulTips,
    appUpdates,
    setAppUpdates,
    analytics,
    setAnalytics,
    crashReports,
    setCrashReports,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// Custom hook to use the settings context
export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
