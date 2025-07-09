// components/OfflineStatusBar.tsx
import { useThemeColor } from "@/hooks/useThemeColor";
import { offlineDataService, SyncStatus } from "@/services/offlineDataService";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface OfflineStatusBarProps {
  visible?: boolean;
  onSyncPress?: () => void;
}

const OfflineStatusBar: React.FC<OfflineStatusBarProps> = ({
  visible = true,
  onSyncPress,
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [animatedHeight] = useState(new Animated.Value(0));
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  const backgroundColor = useThemeColor(
    { light: "#F3F4F6", dark: "#374151" },
    "background"
  );
  const textColor = useThemeColor(
    { light: "#374151", dark: "#F9FAFB" },
    "text"
  );
  const borderColor = useThemeColor(
    { light: "#E5E7EB", dark: "#4B5563" },
    "border"
  );

  useEffect(() => {
    loadSyncStatus();
    const interval = setInterval(loadSyncStatus, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (
      visible &&
      syncStatus &&
      (!syncStatus.isOnline || syncStatus.pendingActions > 0)
    ) {
      Animated.timing(animatedHeight, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(animatedHeight, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [visible, syncStatus, animatedHeight]);

  const loadSyncStatus = async () => {
    try {
      const status = await offlineDataService.getCurrentSyncStatus();
      setSyncStatus(status);
      setLastUpdateTime(new Date());
    } catch (error) {
      console.error("Error loading sync status:", error);
    }
  };

  const handleSyncPress = async () => {
    try {
      if (syncStatus?.isOnline) {
        await offlineDataService.manualSync();
        await loadSyncStatus();
        onSyncPress?.();
      } else {
        Alert.alert(
          "Offline",
          "Cannot sync while offline. Please check your internet connection."
        );
      }
    } catch (error) {
      Alert.alert("Sync Error", "Failed to sync data. Please try again.");
    }
  };

  const getStatusColor = () => {
    if (!syncStatus?.isOnline) return "#EF4444"; // Red for offline
    if (syncStatus.syncInProgress) return "#F59E0B"; // Orange for syncing
    if (syncStatus.pendingActions > 0) return "#3B82F6"; // Blue for pending
    return "#10B981"; // Green for synced
  };

  const getStatusIcon = () => {
    if (!syncStatus?.isOnline) return "cloud-offline";
    if (syncStatus.syncInProgress) return "sync";
    if (syncStatus.pendingActions > 0) return "cloud-upload";
    return "cloud-done";
  };

  const getStatusText = () => {
    if (!syncStatus?.isOnline) return "Offline";
    if (syncStatus.syncInProgress) return "Syncing...";
    if (syncStatus.pendingActions > 0) {
      return `${syncStatus.pendingActions} pending`;
    }
    return "Synced";
  };

  const getLastSyncText = () => {
    if (!syncStatus?.lastSyncTime) return "Never synced";

    const lastSync = new Date(syncStatus.lastSyncTime);
    const now = new Date();
    const diffMs = now.getTime() - lastSync.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (!syncStatus) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor,
          borderBottomColor: borderColor,
          maxHeight: animatedHeight.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 100],
          }),
          opacity: animatedHeight,
        },
      ]}
    >
      <View style={styles.content}>
        {/* Status Indicator */}
        <View style={styles.statusSection}>
          <View
            style={[styles.statusDot, { backgroundColor: getStatusColor() }]}
          />
          <Ionicons
            name={getStatusIcon() as any}
            size={16}
            color={getStatusColor()}
            style={[
              styles.statusIcon,
              syncStatus.syncInProgress && styles.rotating,
            ]}
          />
          <View style={styles.statusTextContainer}>
            <Text style={[styles.statusText, { color: textColor }]}>
              {getStatusText()}
            </Text>
            <Text style={[styles.lastSyncText, { color: textColor }]}>
              Last sync: {getLastSyncText()}
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: getStatusColor(),
              opacity: syncStatus.syncInProgress ? 0.6 : 1,
            },
          ]}
          onPress={handleSyncPress}
          disabled={syncStatus.syncInProgress}
        >
          <Ionicons
            name={syncStatus.isOnline ? "sync" : "refresh"}
            size={14}
            color="#FFFFFF"
          />
          <Text style={styles.actionButtonText}>
            {syncStatus.isOnline ? "Sync" : "Retry"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Progress Indicator */}
      {syncStatus.syncInProgress && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: borderColor }]}>
            <Animated.View
              style={[
                styles.progressFill,
                { backgroundColor: getStatusColor() },
              ]}
            />
          </View>
        </View>
      )}

      {/* Details */}
      {(syncStatus.pendingActions > 0 || syncStatus.failedActions > 0) && (
        <View style={styles.detailsContainer}>
          {syncStatus.pendingActions > 0 && (
            <View style={styles.detailItem}>
              <Ionicons name="time" size={12} color={textColor} />
              <Text style={[styles.detailText, { color: textColor }]}>
                {syncStatus.pendingActions} pending
              </Text>
            </View>
          )}

          {syncStatus.failedActions > 0 && (
            <View style={styles.detailItem}>
              <Ionicons name="warning" size={12} color="#EF4444" />
              <Text style={[styles.detailText, { color: "#EF4444" }]}>
                {syncStatus.failedActions} failed
              </Text>
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );
};

// Comprehensive offline sync panel component
export const OfflineSyncPanel: React.FC<{
  visible: boolean;
  onClose: () => void;
}> = ({ visible, onClose }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [storageStats, setStorageStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const backgroundColor = useThemeColor(
    { light: "#FFFFFF", dark: "#1D1D1D" },
    "background"
  );
  const surfaceColor = useThemeColor(
    { light: "#F8F9FA", dark: "#2C2C2E" },
    "background"
  );
  const textColor = useThemeColor(
    { light: "#11181C", dark: "#ECEDEE" },
    "text"
  );
  const borderColor = useThemeColor(
    { light: "#E0E0E0", dark: "#3C3C3E" },
    "border"
  );

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    try {
      const [status, stats] = await Promise.all([
        offlineDataService.getCurrentSyncStatus(),
        offlineDataService.getStorageStats(),
      ]);
      setSyncStatus(status);
      setStorageStats(stats);
    } catch (error) {
      console.error("Error loading offline data:", error);
    }
  };

  const handleForceSync = async () => {
    setLoading(true);
    try {
      await offlineDataService.forceSyncAll();
      await loadData();
      Alert.alert("Success", "Force sync completed successfully.");
    } catch (error) {
      Alert.alert("Error", "Failed to force sync. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    Alert.alert(
      "Clear Cache",
      "This will remove all cached data. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await offlineDataService.clearCache();
              await loadData();
              Alert.alert("Success", "Cache cleared successfully.");
            } catch (error) {
              Alert.alert("Error", "Failed to clear cache.");
            }
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    try {
      const backup = await offlineDataService.exportData();
      // In a real app, you would save this to a file or share it
      console.log("Backup data:", backup);
      Alert.alert("Success", "Data exported successfully.");
    } catch (error) {
      Alert.alert("Error", "Failed to export data.");
    }
  };

  if (!visible) return null;

  return (
    <View style={[styles.panel, { backgroundColor }]}>
      <View style={[styles.panelHeader, { borderBottomColor: borderColor }]}>
        <Text style={[styles.panelTitle, { color: textColor }]}>
          Offline Sync Status
        </Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={textColor} />
        </TouchableOpacity>
      </View>

      <View style={styles.panelContent}>
        {/* Connection Status */}
        <View style={[styles.section, { backgroundColor: surfaceColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Connection Status
          </Text>
          <View style={styles.statusRow}>
            <Ionicons
              name={syncStatus?.isOnline ? "wifi" : "wifi-off"}
              size={20}
              color={syncStatus?.isOnline ? "#10B981" : "#EF4444"}
            />
            <Text style={[styles.statusLabel, { color: textColor }]}>
              {syncStatus?.isOnline ? "Online" : "Offline"}
            </Text>
          </View>
        </View>

        {/* Storage Statistics */}
        {storageStats && (
          <View style={[styles.section, { backgroundColor: surfaceColor }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Storage Usage
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: textColor }]}>
                  {storageStats.cacheSize} MB
                </Text>
                <Text style={[styles.statLabel, { color: textColor }]}>
                  Cache Size
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: textColor }]}>
                  {storageStats.pendingActions}
                </Text>
                <Text style={[styles.statLabel, { color: textColor }]}>
                  Pending
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: textColor }]}>
                  {storageStats.failedActions}
                </Text>
                <Text style={[styles.statLabel, { color: textColor }]}>
                  Failed
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={[styles.section, { backgroundColor: surfaceColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Actions
          </Text>
          <View style={styles.actionsList}>
            <TouchableOpacity
              style={[styles.actionItem, { borderColor }]}
              onPress={handleForceSync}
              disabled={loading || !syncStatus?.isOnline}
            >
              <Ionicons name="sync" size={20} color="#3B82F6" />
              <Text style={[styles.actionText, { color: textColor }]}>
                Force Sync All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionItem, { borderColor }]}
              onPress={handleExportData}
              disabled={loading}
            >
              <Ionicons name="download" size={20} color="#10B981" />
              <Text style={[styles.actionText, { color: textColor }]}>
                Export Data
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionItem, { borderColor }]}
              onPress={handleClearCache}
              disabled={loading}
            >
              <Ionicons name="trash" size={20} color="#EF4444" />
              <Text style={[styles.actionText, { color: textColor }]}>
                Clear Cache
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    overflow: "hidden",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusIcon: {
    marginRight: 8,
  },
  rotating: {
    // Add rotation animation in a real implementation
  },
  statusTextContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  lastSyncText: {
    fontSize: 12,
    opacity: 0.7,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  progressBar: {
    height: 2,
    borderRadius: 1,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    width: "30%", // This would be animated based on actual progress
    borderRadius: 1,
  },
  detailsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 11,
  },
  // Panel styles
  panel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  panelContent: {
    flex: 1,
    padding: 16,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusLabel: {
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  actionsList: {
    gap: 12,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    gap: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
  },
});

export default OfflineStatusBar;
