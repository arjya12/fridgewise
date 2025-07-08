import { useFocusEffect } from "@react-navigation/native";
import React, { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BarcodeScanner from "../../components/BarcodeScanner";
import { ThemedText } from "../../components/ThemedText";
import { ThemedView } from "../../components/ThemedView";

/**
 * Screen for testing the barcode scanner functionality
 */
export default function BarcodeTestScreen() {
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);

  // Auto-open scanner when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Short delay to ensure the screen is fully rendered
      const timer = setTimeout(() => {
        setIsScannerVisible(true);
      }, 300);

      return () => clearTimeout(timer);
    }, [])
  );

  const handleScan = (barcode: string) => {
    setScannedBarcode(barcode);
    setIsScannerVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText style={styles.title}>Barcode Scanner</ThemedText>

        {!isScannerVisible && (
          <>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setIsScannerVisible(true)}
            >
              <Text style={styles.buttonText}>Scan Again</Text>
            </TouchableOpacity>

            {scannedBarcode && (
              <View style={styles.resultContainer}>
                <ThemedText style={styles.resultLabel}>
                  Scanned Barcode:
                </ThemedText>
                <ThemedText style={styles.resultValue}>
                  {scannedBarcode}
                </ThemedText>
              </View>
            )}
          </>
        )}

        <Modal
          visible={isScannerVisible}
          animationType="slide"
          onRequestClose={() => setIsScannerVisible(false)}
        >
          <BarcodeScanner
            onScan={handleScan}
            onClose={() => setIsScannerVisible(false)}
          />
        </Modal>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#22C55E",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  resultContainer: {
    marginTop: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  resultLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  resultValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
});
