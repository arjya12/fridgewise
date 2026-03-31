import {
  modalRowPrimaryContainer,
  modalRowPrimaryLabel,
  modalRowSecondaryContainer,
  modalRowSecondaryLabel,
} from "@/theme/modalActionStyles";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export type SettingsConfirmPrimaryVariant = "green" | "danger" | "dangerOutline";

export type SettingsConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  primaryLabel?: string;
  onPrimary?: () => void;
  primaryVariant?: SettingsConfirmPrimaryVariant;
  secondaryLabel?: string;
  onSecondary?: () => void;
  busy?: boolean;
  onRequestClose: () => void;
  /** No bottom actions; use with showHeaderClose and/or autoDismissMs */
  hideFooter?: boolean;
  /** Top-right close control (e.g. success toast) */
  showHeaderClose?: boolean;
  headerCloseColor?: string;
  /** Calls onRequestClose after this many ms while visible */
  autoDismissMs?: number;
  /** Centered warning icon + light card tint for final destructive steps */
  accent?: "none" | "destructive";
};

export function SettingsConfirmModal({
  visible,
  title,
  message,
  primaryLabel,
  onPrimary,
  primaryVariant = "green",
  secondaryLabel = "Cancel",
  onSecondary,
  busy = false,
  onRequestClose,
  hideFooter = false,
  showHeaderClose = false,
  headerCloseColor = "#15803D",
  autoDismissMs,
  accent = "none",
}: SettingsConfirmModalProps) {
  const singleAction = !onSecondary;

  useEffect(() => {
    if (!visible || !autoDismissMs || busy) return;
    const t = setTimeout(() => onRequestClose(), autoDismissMs);
    return () => clearTimeout(t);
  }, [visible, autoDismissMs, busy, onRequestClose]);

  const showActions = !hideFooter && (singleAction ? !!primaryLabel && !!onPrimary : !!onSecondary && !!onPrimary);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={busy ? undefined : onRequestClose}
    >
      <Pressable style={styles.backdrop} onPress={busy ? undefined : onRequestClose}>
        <View style={styles.centered}>
          <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
            {accent === "destructive" ? (
              <View style={styles.destructiveAccent} accessibilityElementsHidden>
                <Ionicons name="warning" size={28} color="#DC2626" />
              </View>
            ) : null}
            {showHeaderClose ? (
              <Pressable
                style={styles.headerClose}
                onPress={onRequestClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={24} color={headerCloseColor} />
              </Pressable>
            ) : null}
            <Text
              style={[
                styles.title,
                showHeaderClose && styles.titleWithClose,
                accent === "destructive" && styles.titleDestructive,
              ]}
            >
              {title}
            </Text>
            <Text
              style={[
                styles.message,
                accent === "destructive" && styles.messageDestructive,
                !showActions && styles.messageTightBottom,
              ]}
            >
              {message}
            </Text>
            {showActions && singleAction ? (
              <Pressable
                style={[styles.singleBtn, styles.cancelWide]}
                onPress={onPrimary}
                disabled={busy}
              >
                {busy ? (
                  <ActivityIndicator color="#111827" />
                ) : (
                  <Text style={styles.singleBtnTextDark}>{primaryLabel}</Text>
                )}
              </Pressable>
            ) : null}
            {showActions && !singleAction ? (
              <View style={styles.actionsRow}>
                <Pressable
                  style={styles.cancelBtn}
                  onPress={onSecondary}
                  disabled={busy}
                >
                  <Text style={styles.cancelBtnText}>{secondaryLabel}</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.primaryBtn,
                    primaryVariant === "green" && styles.primaryGreen,
                    primaryVariant === "danger" && styles.primaryDanger,
                    primaryVariant === "dangerOutline" && styles.primaryDangerOutline,
                  ]}
                  onPress={onPrimary}
                  disabled={busy}
                >
                  {busy ? (
                    <ActivityIndicator
                      color={primaryVariant === "dangerOutline" ? "#B91C1C" : "#FFFFFF"}
                    />
                  ) : (
                    <Text
                      style={[
                        styles.primaryBtnText,
                        primaryVariant === "dangerOutline" && styles.primaryBtnTextDangerOutline,
                      ]}
                    >
                      {primaryLabel}
                    </Text>
                  )}
                </Pressable>
              </View>
            ) : null}
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  centered: {
    width: "100%",
    maxWidth: 340,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
    position: "relative",
  },
  destructiveAccent: {
    alignItems: "center",
    marginBottom: 10,
  },
  headerClose: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 2,
    padding: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
    marginBottom: 10,
  },
  titleDestructive: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  titleWithClose: {
    paddingHorizontal: 36,
    marginTop: 2,
  },
  message: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 18,
  },
  messageDestructive: {
    fontSize: 13.5,
    lineHeight: 20,
    color: "#475569",
    paddingHorizontal: 4,
  },
  messageTightBottom: {
    marginBottom: 4,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  cancelBtn: {
    ...modalRowSecondaryContainer,
  },
  cancelBtnText: {
    ...modalRowSecondaryLabel,
  },
  primaryBtn: {
    ...modalRowPrimaryContainer,
  },
  primaryGreen: {
    backgroundColor: "#22C55E",
  },
  primaryDanger: {
    backgroundColor: "#DC2626",
  },
  primaryDangerOutline: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
  },
  primaryBtnText: {
    ...modalRowPrimaryLabel,
    fontWeight: "600",
  },
  primaryBtnTextDangerOutline: {
    color: "#B91C1C",
  },
  singleBtn: {
    borderRadius: 999,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  cancelWide: {
    backgroundColor: "#E5E7EB",
    alignSelf: "stretch",
  },
  singleBtnTextDark: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
});
