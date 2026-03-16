/**
 * Modal to choose how much of an item was consumed.
 * Logs to usage history and reduces/removes from inventory on confirm.
 */

import { FoodItem } from "@/lib/supabase";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export interface ConsumeModalProps {
  visible: boolean;
  item: FoodItem | null;
  onConfirm: (quantity: number) => void;
  onCancel: () => void;
}

export function ConsumeModal({
  visible,
  item,
  onConfirm,
  onCancel,
}: ConsumeModalProps) {
  const maxQty = item ? (typeof item.quantity === "number" ? item.quantity : 1) : 1;
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (visible && item) {
      setQuantity(1);
    }
  }, [visible, item]);

  const unit = item?.unit ?? "pcs";

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleIncrement = () => {
    setQuantity((prev) => Math.min(maxQty, prev + 1));
  };

  const handleConfirm = () => {
    onConfirm(quantity);
  };

  if (!item) return null;

  const locationLabel = item.location === "fridge" ? "Fridge" : "Shelf";

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
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.question}>How much did you use?</Text>
            <Text style={styles.availability}>
              {maxQty} {unit} available in {locationLabel}
            </Text>

            <View style={styles.quantitySection}>
              <View style={styles.quantityRow}>
                <TouchableOpacity
                  style={[styles.qtyBtnOutlined, quantity <= 1 && styles.qtyBtnDisabled]}
                  onPress={handleDecrement}
                  disabled={quantity <= 1}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.qtyBtnText, quantity <= 1 && styles.qtyBtnTextDisabled]}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyNumber}>{quantity}</Text>
                <TouchableOpacity
                  style={[styles.qtyBtnOutlined, quantity >= maxQty && styles.qtyBtnDisabled]}
                  onPress={handleIncrement}
                  disabled={quantity >= maxQty}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.qtyBtnText, quantity >= maxQty && styles.qtyBtnTextDisabled]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirm}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmBtnText}>Consume</Text>
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
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  centered: {
    width: "100%",
    maxWidth: 300,
  },
  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  question: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 4,
  },
  availability: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 14,
  },
  quantitySection: {
    marginBottom: 16,
    alignItems: "center",
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  qtyBtnOutlined: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnDisabled: {
    opacity: 0.45,
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#475569",
    lineHeight: 18,
    includeFontPadding: false,
  },
  qtyBtnTextDisabled: {
    color: "#94A3B8",
  },
  qtyNumber: {
    fontSize: 24,
    fontWeight: "600",
    color: "#334155",
    minWidth: 40,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  cancelBtn: {
    width: 100,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    borderWidth: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
    textAlign: "center",
  },
  confirmBtn: {
    width: 100,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmBtnText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FFFFFF",
    textAlign: "center",
  },
});
