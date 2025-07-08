import { barcodeService } from "@/services/barcodeService";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  View,
} from "react-native";
import BarcodeScanner from "./BarcodeScanner";
import { ThemedText } from "./ThemedText";

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onProductFound: (productData: { name: string; category?: string }) => void;
}

/**
 * A modal that displays a barcode scanner and handles API lookups
 */
const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  visible,
  onClose,
  onProductFound,
}) => {
  const [loading, setLoading] = useState(false);

  const handleBarcodeScan = async (barcode: string) => {
    setLoading(true);

    try {
      // Call the barcode service to lookup the product
      const result = await barcodeService.lookupBarcode(barcode);

      if (result.success && result.product) {
        // Product found, pass the data back to the parent component
        onProductFound({
          name: result.product.name,
          category: result.product.category,
        });
        onClose();
      } else {
        // Product not found
        Alert.alert(
          "Product Not Found",
          "The barcode was scanned successfully, but no product information was found. Would you like to enter the details manually?",
          [
            {
              text: "Try Again",
              onPress: () => {
                setLoading(false);
              },
            },
            {
              text: "Enter Manually",
              onPress: () => {
                onClose();
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error("Error looking up barcode:", error);
      Alert.alert(
        "Error",
        "An error occurred while looking up the product. Please try again or enter the details manually.",
        [
          {
            text: "Try Again",
            onPress: () => {
              setLoading(false);
            },
          },
          {
            text: "Enter Manually",
            onPress: () => {
              onClose();
            },
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      transparent={false}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <ThemedText style={styles.loadingText}>
            Looking up product information...
          </ThemedText>
        </View>
      ) : (
        <BarcodeScanner onScan={handleBarcodeScan} onClose={onClose} />
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    textAlign: "center",
    color: "#FFFFFF",
  },
});

export default BarcodeScannerModal;
