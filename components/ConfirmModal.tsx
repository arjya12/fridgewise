/**
 * Themed confirmation modal — matches FridgeWise and uses RN Modal
 * so the whole screen (including bottom nav) is dimmed by the system.
 */

import {
  modalRowPrimaryContainer,
  modalRowPrimaryLabel,
  modalRowSecondaryContainer,
  modalRowSecondaryLabel,
} from "@/theme/modalActionStyles";
import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export type ConfirmModalVariant = "destructive" | "default";

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  cancelLabel?: string;
  confirmLabel?: string;
  variant?: ConfirmModalVariant;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  cancelLabel = "Cancel",
  confirmLabel = "Delete",
  variant = "destructive",
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  const isDestructive = variant === "destructive";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <View style={styles.centered}>
          <Pressable
            style={styles.card}
            onPress={(e) => {
              e.stopPropagation();
            }}
          >
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onCancel}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>{cancelLabel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  isDestructive && styles.confirmBtnDestructive,
                ]}
                onPress={onConfirm}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmBtnText}>{confirmLabel}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  centered: {
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 6,
  },
  message: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 18,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  cancelBtn: {
    ...modalRowSecondaryContainer,
  },
  cancelBtnText: {
    ...modalRowSecondaryLabel,
  },
  confirmBtn: {
    ...modalRowPrimaryContainer,
    backgroundColor: "#22C55E",
  },
  confirmBtnDestructive: {
    backgroundColor: "#EF4444",
  },
  confirmBtnText: {
    ...modalRowPrimaryLabel,
  },
});
