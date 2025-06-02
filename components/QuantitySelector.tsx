import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type QuantitySelectorProps = {
  initialValue?: number;
  minValue?: number;
  maxValue?: number;
  onChange: (value: number) => void;
};

/**
 * A component to select quantity values with increment and decrement controls
 */
const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  initialValue = 1,
  minValue = 1,
  maxValue = 99,
  onChange,
}) => {
  const [value, setValue] = useState(initialValue);

  const handleDecrement = () => {
    if (value > minValue) {
      const newValue = value - 1;
      setValue(newValue);
      onChange(newValue);
    }
  };

  const handleIncrement = () => {
    if (value < maxValue) {
      const newValue = value + 1;
      setValue(newValue);
      onChange(newValue);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Qty:</Text>

      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.decrementButton}
          onPress={handleDecrement}
          accessibilityLabel="Decrease quantity"
          disabled={value <= minValue}
        >
          <Text
            style={[
              styles.controlButtonText,
              value <= minValue && styles.disabledButtonText,
            ]}
          >
            −
          </Text>
        </TouchableOpacity>

        <View style={styles.valueContainer}>
          <Text style={styles.valueText}>{value}</Text>
        </View>

        <TouchableOpacity
          style={styles.incrementButton}
          onPress={handleIncrement}
          accessibilityLabel="Increase quantity"
          disabled={value >= maxValue}
        >
          <Text
            style={[
              styles.controlButtonText,
              value >= maxValue && styles.disabledButtonText,
            ]}
          >
            +
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginRight: 12,
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  decrementButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  valueContainer: {
    width: 40,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  valueText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  incrementButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  controlButtonText: {
    fontSize: 20,
    color: "#374151",
    lineHeight: 24,
  },
  disabledButtonText: {
    color: "#9CA3AF",
  },
});

export default QuantitySelector;
