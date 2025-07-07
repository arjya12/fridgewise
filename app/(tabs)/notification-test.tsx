import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import * as Notifications from "expo-notifications";
import React, { useState } from "react";
import { Alert, Button, Platform, StyleSheet, View } from "react-native";

export default function NotificationTestScreen() {
  const [loading, setLoading] = useState(false);
  const [lastNotificationId, setLastNotificationId] = useState<string | null>(
    null
  );

  // Test immediate notification
  const testImmediateNotification = async () => {
    setLoading(true);
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Test Notification",
          body: "This is a test notification from FridgeWise",
          data: { type: "test" },
        },
        trigger: null, // null means show immediately
      });

      setLastNotificationId(notificationId);
      Alert.alert(
        "Success",
        `Notification scheduled with ID: ${notificationId}`
      );
    } catch (error) {
      console.error("Error scheduling notification:", error);
      Alert.alert("Error", "Failed to schedule notification");
    } finally {
      setLoading(false);
    }
  };

  // Test expiry notification
  const testExpiryNotification = async () => {
    setLoading(true);
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Milk expires tomorrow",
          body: "Don't forget to use your milk before it expires!",
          data: { type: "expiry", itemId: "test-item-1" },
          ...(Platform.OS === "android" ? { channelId: "expiry-alerts" } : {}),
        },
        trigger: null,
      });

      setLastNotificationId(notificationId);
      Alert.alert(
        "Success",
        `Expiry notification scheduled with ID: ${notificationId}`
      );
    } catch (error) {
      console.error("Error scheduling expiry notification:", error);
      Alert.alert("Error", "Failed to schedule expiry notification");
    } finally {
      setLoading(false);
    }
  };

  // Test low stock notification
  const testLowStockNotification = async () => {
    setLoading(true);
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Running low on Eggs",
          body: "You only have 1 unit of Eggs left.",
          data: { type: "low_stock", itemId: "test-item-2" },
          ...(Platform.OS === "android"
            ? { channelId: "low-stock-alerts" }
            : {}),
        },
        trigger: null,
      });

      setLastNotificationId(notificationId);
      Alert.alert(
        "Success",
        `Low stock notification scheduled with ID: ${notificationId}`
      );
    } catch (error) {
      console.error("Error scheduling low stock notification:", error);
      Alert.alert("Error", "Failed to schedule low stock notification");
    } finally {
      setLoading(false);
    }
  };

  // Cancel the last notification
  const cancelLastNotification = async () => {
    if (!lastNotificationId) {
      Alert.alert("No Notification", "No notification has been scheduled yet");
      return;
    }

    try {
      await Notifications.cancelScheduledNotificationAsync(lastNotificationId);
      Alert.alert(
        "Success",
        `Notification with ID: ${lastNotificationId} canceled`
      );
      setLastNotificationId(null);
    } catch (error) {
      console.error("Error canceling notification:", error);
      Alert.alert("Error", "Failed to cancel notification");
    }
  };

  return (
    <SafeAreaWrapper>
      <ThemedView style={styles.container}>
        <ThemedText style={styles.title}>Notification Test Screen</ThemedText>
        <ThemedText style={styles.description}>
          Use the buttons below to test different types of notifications. These
          are all local notifications that are scheduled on your device.
        </ThemedText>

        <View style={styles.buttonContainer}>
          <Button
            title="Test Immediate Notification"
            onPress={testImmediateNotification}
            disabled={loading}
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Test Expiry Notification"
            onPress={testExpiryNotification}
            disabled={loading}
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Test Low Stock Notification"
            onPress={testLowStockNotification}
            disabled={loading}
          />
        </View>

        {lastNotificationId && (
          <View style={styles.buttonContainer}>
            <Button
              title="Cancel Last Notification"
              onPress={cancelLastNotification}
              color="red"
            />
          </View>
        )}

        {lastNotificationId && (
          <ThemedText style={styles.notificationId}>
            Last Notification ID: {lastNotificationId}
          </ThemedText>
        )}
      </ThemedView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
  },
  buttonContainer: {
    marginVertical: 8,
  },
  notificationId: {
    marginTop: 20,
    fontSize: 14,
    fontStyle: "italic",
  },
});
