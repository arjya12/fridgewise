/**
 * Centered info dialog with title, body, and a single centered OK control — matches waste-report / in-app info style.
 */

import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export type SimpleInfoModalProps = {
  visible: boolean;
  title: string;
  message: string;
  okLabel?: string;
  onDismiss: () => void;
  /** Primary action color (FridgeWise green on auth flows). */
  accentColor?: string;
};

export function SimpleInfoModal({
  visible,
  title,
  message,
  okLabel = "OK",
  onDismiss,
  accentColor = "#15803D",
}: SimpleInfoModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
      >
        <Pressable
          style={styles.card}
          onPress={(e) => e.stopPropagation()}
          accessibilityViewIsModal
        >
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <Pressable
            onPress={onDismiss}
            style={styles.okBtn}
            accessibilityRole="button"
            accessibilityLabel={okLabel}
            testID="simple-info-modal-ok"
          >
            <Text style={[styles.okText, { color: accentColor }]}>{okLabel}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 6,
  },
  okBtn: {
    alignSelf: "center",
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  okText: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
    textAlign: "center",
  },
});
