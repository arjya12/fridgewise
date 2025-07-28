import { Ionicons } from "@expo/vector-icons";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

/**
 * A component that provides barcode scanning using expo-camera
 * Falls back to manual entry if camera permissions are not granted
 */
const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [manualBarcode, setManualBarcode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [facing, setFacing] = useState<CameraType>("back");

  const inputRef = useRef<TextInput>(null);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const screenHeight = Dimensions.get("window").height;

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        setIsLoading(true);

        if (!permission) {
          // Permissions are still loading
          return;
        }

        if (!permission.granted) {
          // Request camera permissions
          const { granted } = await requestPermission();
          if (!granted) {
            // Fall back to manual entry if permissions denied
            setShowManualEntry(true);
          }
        }

        // Start the animation after a short delay
        setTimeout(() => {
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();

          setIsLoading(false);
        }, 300);
      } catch (error) {
        console.error("Error checking permissions:", error);
        setShowManualEntry(true);
        setIsLoading(false);
      }
    };

    checkPermissions();
  }, [permission, requestPermission]);

  // Handle barcode scan
  const handleBarcodeScanned = ({ data }: { data: string }) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onScan(data);
  };

  // Handle manual barcode submission
  const handleManualSubmit = () => {
    if (manualBarcode.trim().length > 0) {
      Keyboard.dismiss();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onScan(manualBarcode.trim());
    } else {
      Alert.alert("Invalid Barcode", "Please enter a valid barcode number.", [
        { text: "OK" },
      ]);
    }
  };

  // Handle keyboard submit
  const handleKeyPress = ({ nativeEvent }: any) => {
    if (nativeEvent.key === "Enter" && manualBarcode.trim().length > 0) {
      handleManualSubmit();
    }
  };

  // Toggle between camera and manual entry
  const toggleManualEntry = () => {
    setShowManualEntry(!showManualEntry);
    if (!showManualEntry && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // Animation styles
  const containerStyle = {
    opacity: animatedValue,
    transform: [
      {
        translateY: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [screenHeight * 0.1, 0],
        }),
      },
    ],
  };

  // Show loading indicator
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <ThemedText style={styles.loadingText}>Initializing...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  // Show permission denied message
  if (!permission?.granted && !showManualEntry) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.container, containerStyle]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            testID="close-button"
          >
            <Ionicons name="close-circle" size={30} color="#6B7280" />
          </TouchableOpacity>

          <Ionicons name="camera-outline" size={70} color="#EF4444" />
          <ThemedText style={styles.title}>Camera Permission Needed</ThemedText>
          <ThemedText style={styles.text}>
            We need camera access to scan barcodes. You can grant permission or
            enter the barcode manually.
          </ThemedText>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={requestPermission}>
              <Text style={styles.buttonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.manualButton}
            onPress={toggleManualEntry}
          >
            <ThemedText style={styles.manualButtonText}>
              Enter Manually
            </ThemedText>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // Show manual entry mode
  if (showManualEntry) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <Animated.View style={[styles.container, containerStyle]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              testID="close-button"
            >
              <Ionicons name="close-circle" size={30} color="#6B7280" />
            </TouchableOpacity>

            <Ionicons name="barcode-outline" size={70} color="#22C55E" />
            <ThemedText style={styles.title}>Enter Barcode</ThemedText>
            <ThemedText style={styles.text}>
              Enter the barcode number manually:
            </ThemedText>

            <TextInput
              ref={inputRef}
              style={styles.input}
              value={manualBarcode}
              onChangeText={setManualBarcode}
              placeholder="Enter barcode number"
              keyboardType="numeric"
              returnKeyType="done"
              onSubmitEditing={handleManualSubmit}
              onKeyPress={handleKeyPress}
              autoFocus
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  manualBarcode.trim().length === 0 && styles.disabledButton,
                ]}
                onPress={handleManualSubmit}
                disabled={manualBarcode.trim().length === 0}
              >
                <Text style={styles.buttonText}>Submit</Text>
              </TouchableOpacity>
            </View>

            {permission?.granted && (
              <TouchableOpacity
                style={styles.manualButton}
                onPress={toggleManualEntry}
              >
                <ThemedText style={styles.manualButtonText}>
                  Use Camera Instead
                </ThemedText>
              </TouchableOpacity>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Show camera scanner
  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View style={[styles.cameraContainer, containerStyle]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          testID="close-button"
        >
          <Ionicons name="close-circle" size={30} color="#FFFFFF" />
        </TouchableOpacity>

        <CameraView
          style={styles.camera}
          facing={facing}
          onBarcodeScanned={handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: [
              "qr",
              "ean13",
              "ean8",
              "upc_a",
              "upc_e",
              "code128",
              "code39",
              "code93",
              "codabar",
              "itf14",
              "datamatrix",
              "pdf417",
              "aztec",
            ],
          }}
        />

        <View style={styles.overlay}>
          <View style={styles.scannerFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          <ThemedText style={styles.scanText}>
            Point your camera at a barcode
          </ThemedText>
        </View>

        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={styles.manualButton}
            onPress={toggleManualEntry}
          >
            <Ionicons name="keypad-outline" size={20} color="#FFFFFF" />
            <ThemedText style={styles.manualButtonText}>
              Manual Entry
            </ThemedText>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    position: "relative",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  closeButton: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    color: "#666",
  },
  noteText: {
    marginTop: 24,
    fontSize: 12,
    textAlign: "center",
    color: "#888",
    paddingHorizontal: 20,
  },
  input: {
    width: "100%",
    height: 60,
    borderWidth: 2,
    borderColor: "#22C55E",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 24,
    marginBottom: 32,
    backgroundColor: "#fff",
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    flex: 1,
    backgroundColor: "#22C55E",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    marginLeft: 8,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#A7F3BE",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#6B7280",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    marginRight: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  manualButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#4F46E5",
    borderRadius: 12,
  },
  manualButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: "#000",
    position: "relative",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  scannerFrame: {
    width: "80%",
    height: "80%",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    borderRadius: 10,
    position: "absolute",
  },
  corner: {
    width: 20,
    height: 20,
    backgroundColor: "#FFFFFF",
    position: "absolute",
  },
  topLeft: {
    top: 0,
    left: 0,
  },
  topRight: {
    top: 0,
    right: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
  },
  scanText: {
    color: "#FFFFFF",
    fontSize: 18,
    marginTop: 20,
  },
  bottomControls: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
});

export default BarcodeScanner;
