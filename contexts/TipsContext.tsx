import { getCurrentTip, getNextTip, Tip } from "@/services/tipService";
import React, { createContext, useContext, useEffect, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useSettings } from "./SettingsContext";

interface TipsContextType {
  currentTip: Tip | null;
  refreshTip: () => Promise<void>;
}

const TipsContext = createContext<TipsContextType>({
  currentTip: null,
  refreshTip: async () => {},
});

export const TipsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentTip, setCurrentTip] = useState<Tip | null>(null);
  const { helpfulTips } = useSettings();
  const [appState, setAppState] = useState<AppStateStatus>(
    AppState.currentState
  );

  // Load the current tip when the component mounts
  useEffect(() => {
    loadCurrentTip();
  }, []);

  // Listen for app state changes to refresh tip when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => {
      subscription.remove();
    };
  }, [appState, helpfulTips]);

  // Handle app state changes
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    // When app comes to foreground from background
    if (appState.match(/inactive|background/) && nextAppState === "active") {
      refreshTip();
    }
    setAppState(nextAppState);
  };

  // Load the current tip from storage
  const loadCurrentTip = async () => {
    if (helpfulTips) {
      try {
        const tip = await getCurrentTip();
        setCurrentTip(tip);
      } catch (error) {
        console.error("Error loading current tip:", error);
      }
    } else {
      setCurrentTip(null);
    }
  };

  // Get the next tip and update the state
  const refreshTip = async () => {
    if (helpfulTips) {
      try {
        const tip = await getNextTip();
        setCurrentTip(tip);
      } catch (error) {
        console.error("Error refreshing tip:", error);
      }
    } else {
      setCurrentTip(null);
    }
  };

  // Update tip when helpfulTips setting changes
  useEffect(() => {
    if (helpfulTips) {
      loadCurrentTip();
    } else {
      setCurrentTip(null);
    }
  }, [helpfulTips]);

  const value = {
    currentTip,
    refreshTip,
  };

  return <TipsContext.Provider value={value}>{children}</TipsContext.Provider>;
};

export const useTips = () => useContext(TipsContext);
