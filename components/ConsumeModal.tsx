/**
 * Modal to choose how much of an item was consumed.
 * Logs to usage history and reduces/removes from inventory on confirm.
 */

import {
  modalRowPrimaryContainer,
  modalRowPrimaryLabel,
  modalRowSecondaryContainer,
  modalRowSecondaryLabel,
} from "@/theme/modalActionStyles";
import { FoodItem } from "@/lib/supabase";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { formatQuantityWithUnit } from "@/utils/formatQuantityUnit";
import {
  MAX_INVENTORY_QUANTITY,
  parseDigitsToClampedQuantity,
} from "@/utils/quantityLimits";

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
  const stockQty = item ? (typeof item.quantity === "number" ? item.quantity : 1) : 1;
  const maxQty = Math.min(stockQty, MAX_INVENTORY_QUANTITY);
  const isMultiQty = maxQty > 1;
  const halfQty = Math.floor(maxQty / 2);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (visible && item) {
      setQuantity(1);
    }
  }, [visible, item]);

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleIncrement = () => {
    setQuantity((prev) => Math.min(maxQty, prev + 1));
  };

  const onQuantityTextChange = (t: string) => {
    setQuantity(parseDigitsToClampedQuantity(t, 1, maxQty));
  };

  const handleConfirm = () => {
    onConfirm(quantity);
  };

  if (!visible || !item) return null;

  const locationLabel = item.location === "fridge" ? "Fridge" : "Shelf";
  const isConsumeAllSelected =
    isMultiQty && quantity >= maxQty && maxQty === stockQty;
  const showMinAction = isMultiQty && quantity > halfQty;

  const handleToggleMinMax = () => {
    setQuantity((prev) => {
      if (!isMultiQty) return prev;
      return prev > halfQty ? 1 : maxQty;
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <View style={styles.centered}>
          <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.question}>How much did you use?</Text>
            <Text style={styles.availability}>
              Available: {formatQuantityWithUnit(maxQty, item.unit, { fallbackUnit: "pcs" })} in{" "}
              {locationLabel}
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
                <TextInput
                  style={styles.qtyInput}
                  value={String(quantity)}
                  onChangeText={onQuantityTextChange}
                  keyboardType="number-pad"
                  selectTextOnFocus
                  accessibilityLabel="Quantity to consume"
                />
                <TouchableOpacity
                  style={[styles.qtyBtnOutlined, quantity >= maxQty && styles.qtyBtnDisabled]}
                  onPress={handleIncrement}
                  disabled={quantity >= maxQty}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.qtyBtnText,
                      quantity >= maxQty && styles.qtyBtnTextDisabled,
                    ]}
                  >
                    +
                  </Text>
                </TouchableOpacity>
              </View>
              {isMultiQty ? (
                <TouchableOpacity
                  style={styles.maxLinkWrap}
                  onPress={handleToggleMinMax}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={
                    showMinAction
                      ? "Set quantity to minimum"
                      : `Set quantity to max ${maxQty}`
                  }
                >
                  <Text style={styles.maxLinkText}>{showMinAction ? "Min" : "Max"}</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.8}>
                <Text style={styles.confirmBtnText}>
                  {isConsumeAllSelected ? "Consume all" : "Consume"}
                </Text>
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
  qtyInput: {
    fontSize: 24,
    fontWeight: "600",
    color: "#334155",
    minWidth: 44,
    paddingVertical: 4,
    paddingHorizontal: 6,
    textAlign: "center",
  },
  maxLinkWrap: {
    marginTop: 8,
    alignSelf: "center",
  },
  maxLinkText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#15803D",
  },
  maxLinkTextDisabled: {
    color: "#94A3B8",
  },
  actions: {
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
  confirmBtn: {
    ...modalRowPrimaryContainer,
    backgroundColor: "#22C55E",
  },
  confirmBtnText: {
    ...modalRowPrimaryLabel,
  },
});
