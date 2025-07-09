// components/SyncStatusIndicator.tsx
import {
  OfflineAction,
  offlineStorageService,
  SyncStatus,
} from "@/services/offlineStorageService";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface SyncStatusIndicatorProps {
  textColor: string;
  backgroundColor: string;
  borderColor: string;
}

export default function SyncStatusIndicator({
  textColor,
  backgroundColor,
  borderColor,
}: SyncStatusIndicatorProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    lastSyncTime: 0,
    pendingActions: 0,
    failedActions: 0,
    syncInProgress: false,
  });
  const [showDetails, setShowDetails] = useState(false);
  const [failedActions, setFailedActions] = useState<OfflineAction[]>([]);

  const pulseAnimation = React.useRef(new Animated.Value(1)).current;
  const spinAnimation = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initial load
    loadSyncStatus();

    // Set up polling for sync status
    const interval = setInterval(loadSyncStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Animate based on sync status
    if (syncStatus.syncInProgress) {
      startSpinAnimation();
    } else if (syncStatus.pendingActions > 0 || syncStatus.failedActions > 0) {
      startPulseAnimation();
    } else {
      stopAnimations();
    }
  }, [syncStatus]);

  const loadSyncStatus = async () => {
    try {
      const status = await offlineStorageService.getSyncStatus();
      setSyncStatus(status);

      if (status.failedActions > 0) {
        const failed = await offlineStorageService.getFailedActions();
        setFailedActions(failed);
      }
    } catch (error) {
      console.error("Failed to load sync status:", error);
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startSpinAnimation = () => {
    Animated.loop(
      Animated.timing(spinAnimation, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopAnimations = () => {
    pulseAnimation.stopAnimation();
    spinAnimation.stopAnimation();
    pulseAnimation.setValue(1);
    spinAnimation.setValue(0);
  };

  const handleManualSync = async () => {
    if (!syncStatus.isOnline) {
      Alert.alert(
        "Offline",
        "Cannot sync while offline. Please check your internet connection."
      );
      return;
    }

    if (syncStatus.syncInProgress) {
      Alert.alert("Sync in Progress", "A sync operation is already running.");
      return;
    }

    try {
      await offlineStorageService.forcSync();
      await loadSyncStatus();
      Alert.alert("Success", "Manual sync completed successfully.");
    } catch (error) {
      Alert.alert("Sync Failed", "Manual sync failed. Please try again later.");
    }
  };

  const handleRetryFailedAction = async (actionId: string) => {
    try {
      await offlineStorageService.retryFailedAction(actionId);
      await loadSyncStatus();
      Alert.alert("Success", "Action retried successfully.");
    } catch (error) {
      Alert.alert("Retry Failed", "Failed to retry action. Please try again.");
    }
  };

  const handleClearFailedActions = async () => {
    Alert.alert(
      "Clear Failed Actions",
      "Are you sure you want to clear all failed actions? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              await offlineStorageService.clearFailedActions();
              await loadSyncStatus();
              setFailedActions([]);
            } catch (error) {
              Alert.alert("Error", "Failed to clear failed actions.");
            }
          },
        },
      ]
    );
  };

  const getStatusIcon = (): keyof typeof Ionicons.glyphMap => {
    if (!syncStatus.isOnline) return "cloud-offline";
    if (syncStatus.syncInProgress) return "sync";
    if (syncStatus.failedActions > 0) return "warning";
    if (syncStatus.pendingActions > 0) return "cloud-upload";
    return "cloud-done";
  };

  const getStatusColor = (): string => {
    if (!syncStatus.isOnline) return "#8E8E93";
    if (syncStatus.syncInProgress) return "#007AFF";
    if (syncStatus.failedActions > 0) return "#EF4444";
    if (syncStatus.pendingActions > 0) return "#FF9500";
    return "#34C759";
  };

  const getStatusText = (): string => {
    if (!syncStatus.isOnline) return "Offline";
    if (syncStatus.syncInProgress) return "Syncing...";
    if (syncStatus.failedActions > 0)
      return `${syncStatus.failedActions} failed`;
    if (syncStatus.pendingActions > 0)
      return `${syncStatus.pendingActions} pending`;
    return "Synced";
  };

  const formatLastSync = (): string => {
    if (syncStatus.lastSyncTime === 0) return "Never";

    const now = Date.now();
    const diff = now - syncStatus.lastSyncTime;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  const spin = spinAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <>
      <TouchableOpacity
        style={[styles.container, { backgroundColor, borderColor }]}
        onPress={() => setShowDetails(true)}
      >
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [
                { scale: pulseAnimation },
                { rotate: syncStatus.syncInProgress ? spin : "0deg" },
              ],
            },
          ]}
        >
          <Ionicons name={getStatusIcon()} size={16} color={getStatusColor()} />
        </Animated.View>

        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>

        {(syncStatus.pendingActions > 0 || syncStatus.failedActions > 0) && (
          <View style={[styles.badge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.badgeText}>
              {syncStatus.pendingActions + syncStatus.failedActions}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Detailed Status Modal */}
      <Modal
        visible={showDetails}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={[styles.modal, { backgroundColor }]}>
          {/* Header */}
          <View
            style={[styles.modalHeader, { borderBottomColor: borderColor }]}
          >
            <TouchableOpacity onPress={() => setShowDetails(false)}>
              <Ionicons name="close" size={24} color={textColor} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: textColor }]}>
              Sync Status
            </Text>
            <TouchableOpacity
              onPress={handleManualSync}
              disabled={!syncStatus.isOnline || syncStatus.syncInProgress}
            >
              <Ionicons
                name="refresh"
                size={24}
                color={
                  !syncStatus.isOnline || syncStatus.syncInProgress
                    ? "#8E8E93"
                    : "#007AFF"
                }
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Current Status */}
            <View style={[styles.section, { borderColor }]}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Current Status
              </Text>

              <View style={styles.statusRow}>
                <Ionicons name="wifi" size={20} color={textColor} />
                <Text style={[styles.statusLabel, { color: textColor }]}>
                  Connection
                </Text>
                <Text
                  style={[
                    styles.statusValue,
                    { color: syncStatus.isOnline ? "#34C759" : "#EF4444" },
                  ]}
                >
                  {syncStatus.isOnline ? "Online" : "Offline"}
                </Text>
              </View>

              <View style={styles.statusRow}>
                <Ionicons name="time" size={20} color={textColor} />
                <Text style={[styles.statusLabel, { color: textColor }]}>
                  Last Sync
                </Text>
                <Text style={[styles.statusValue, { color: textColor }]}>
                  {formatLastSync()}
                </Text>
              </View>

              <View style={styles.statusRow}>
                <Ionicons name="cloud-upload" size={20} color={textColor} />
                <Text style={[styles.statusLabel, { color: textColor }]}>
                  Pending Actions
                </Text>
                <Text
                  style={[
                    styles.statusValue,
                    {
                      color:
                        syncStatus.pendingActions > 0 ? "#FF9500" : textColor,
                    },
                  ]}
                >
                  {syncStatus.pendingActions}
                </Text>
              </View>

              <View style={styles.statusRow}>
                <Ionicons name="warning" size={20} color={textColor} />
                <Text style={[styles.statusLabel, { color: textColor }]}>
                  Failed Actions
                </Text>
                <Text
                  style={[
                    styles.statusValue,
                    {
                      color:
                        syncStatus.failedActions > 0 ? "#EF4444" : textColor,
                    },
                  ]}
                >
                  {syncStatus.failedActions}
                </Text>
              </View>
            </View>

            {/* Sync Actions */}
            <View style={[styles.section, { borderColor }]}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Sync Actions
              </Text>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { borderColor: "#007AFF" },
                  (!syncStatus.isOnline || syncStatus.syncInProgress) &&
                    styles.actionButtonDisabled,
                ]}
                onPress={handleManualSync}
                disabled={!syncStatus.isOnline || syncStatus.syncInProgress}
              >
                <Ionicons name="refresh" size={20} color="#007AFF" />
                <Text style={[styles.actionButtonText, { color: "#007AFF" }]}>
                  Manual Sync
                </Text>
              </TouchableOpacity>

              {syncStatus.failedActions > 0 && (
                <TouchableOpacity
                  style={[styles.actionButton, { borderColor: "#EF4444" }]}
                  onPress={handleClearFailedActions}
                >
                  <Ionicons name="trash" size={20} color="#EF4444" />
                  <Text style={[styles.actionButtonText, { color: "#EF4444" }]}>
                    Clear Failed Actions
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Failed Actions Details */}
            {failedActions.length > 0 && (
              <View style={[styles.section, { borderColor }]}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>
                  Failed Actions ({failedActions.length})
                </Text>

                {failedActions.map((action) => (
                  <View
                    key={action.id}
                    style={[styles.failedAction, { borderColor }]}
                  >
                    <View style={styles.failedActionInfo}>
                      <Text
                        style={[styles.failedActionType, { color: textColor }]}
                      >
                        {action.type.toUpperCase()} - {action.tableName}
                      </Text>
                      <Text
                        style={[
                          styles.failedActionDetails,
                          { color: textColor },
                        ]}
                      >
                        Attempts: {action.retryCount}/{action.maxRetries}
                      </Text>
                      <Text
                        style={[styles.failedActionTime, { color: textColor }]}
                      >
                        {new Date(action.localTimestamp).toLocaleString()}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.retryButton,
                        { backgroundColor: "#007AFF" },
                      ]}
                      onPress={() => handleRetryFailedAction(action.id)}
                    >
                      <Ionicons name="refresh" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Info Section */}
            <View style={[styles.section, { borderColor }]}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                About Offline Mode
              </Text>
              <Text style={[styles.infoText, { color: textColor }]}>
                When offline, your changes are saved locally and will be synced
                automatically when you reconnect to the internet. Failed actions
                may require manual attention.
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  badge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },

  // Modal Styles
  modal: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
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
    paddingVertical: 8,
    gap: 12,
  },
  statusLabel: {
    flex: 1,
    fontSize: 14,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  failedAction: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  failedActionInfo: {
    flex: 1,
  },
  failedActionType: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  failedActionDetails: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 2,
  },
  failedActionTime: {
    fontSize: 11,
    opacity: 0.5,
  },
  retryButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
});
