import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

// Define the settings interface
interface SettingsContextType {
  // Notification settings
  expiryAlerts: boolean;
  setExpiryAlerts: (enabled: boolean) => void;
  lowStockAlerts: boolean;
  setLowStockAlerts: (enabled: boolean) => void;
  helpfulTips: boolean;
  setHelpfulTips: (enabled: boolean) => void;

  // Privacy settings
  analytics: boolean;
  setAnalytics: (enabled: boolean) => void;
  crashReports: boolean;
  setCrashReports: (enabled: boolean) => void;
}

// Storage keys
const STORAGE_KEYS = {
  EXPIRY_ALERTS: "settings.expiryAlerts",
  LOW_STOCK_ALERTS: "settings.lowStockAlerts",
  HELPFUL_TIPS: "settings.helpfulTips",
  // APP_UPDATES removed (migration cleans old key)
  ANALYTICS: "settings.analytics",
  CRASH_REPORTS: "settings.crashReports",
};

// Create the context with default values
const SettingsContext = createContext<SettingsContextType>({
  expiryAlerts: true,
  setExpiryAlerts: () => {},
  lowStockAlerts: true,
  setLowStockAlerts: () => {},
  helpfulTips: true,
  setHelpfulTips: () => {},
  analytics: true,
  setAnalytics: () => {},
  crashReports: true,
  setCrashReports: () => {},
});

// Provider component
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  // State for all settings
  const [expiryAlerts, setExpiryAlertsState] = useState(true);
  const [lowStockAlerts, setLowStockAlertsState] = useState(true);
  const [helpfulTips, setHelpfulTipsState] = useState(true);
  const [analytics, setAnalyticsState] = useState(true);
  const [crashReports, setCrashReportsState] = useState(true);

  // Load settings from AsyncStorage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
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

        // Remove legacy app updates key if present (migration)
        try {
          await AsyncStorage.removeItem("settings.appUpdates");
        } catch {}

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

  // setAppUpdates removed

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
    expiryAlerts,
    setExpiryAlerts,
    lowStockAlerts,
    setLowStockAlerts,
    helpfulTips,
    setHelpfulTips,
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
