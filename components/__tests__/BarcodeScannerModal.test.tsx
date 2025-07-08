import { barcodeService } from "@/services/barcodeService";
import { render } from "@testing-library/react-native";
import React from "react";
import { Alert } from "react-native";
import BarcodeScannerModal from "../BarcodeScannerModal";

// Mock the BarcodeScanner component
jest.mock("../BarcodeScanner", () => {
  return jest.fn().mockImplementation(({ onScan, onClose }) => {
    return {
      type: "BarcodeScanner",
      props: { onScan, onClose },
      // This is just a mock for testing, not a real component
    };
  });
});

// Mock the barcodeService
jest.mock("@/services/barcodeService", () => ({
  barcodeService: {
    lookupBarcode: jest.fn(),
  },
}));

// Mock Alert
jest.spyOn(Alert, "alert").mockImplementation(() => {});

describe("BarcodeScannerModal", () => {
  const mockOnClose = jest.fn();
  const mockOnProductFound = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call onProductFound when a product is found", async () => {
    // Mock successful product lookup
    (barcodeService.lookupBarcode as jest.Mock).mockResolvedValue({
      success: true,
      product: {
        name: "Test Product",
        category: "Test Category",
      },
    });

    // Render the modal
    render(
      <BarcodeScannerModal
        visible={true}
        onClose={mockOnClose}
        onProductFound={mockOnProductFound}
      />
    );

    // Get the mock BarcodeScanner component
    const BarcodeScannerMock = require("../BarcodeScanner");
    const mockInstance = BarcodeScannerMock.mock.calls[0][0];

    // Simulate a barcode scan by calling onScan
    await mockInstance.onScan("123456789012");

    // Verify that the barcode service was called
    expect(barcodeService.lookupBarcode).toHaveBeenCalledWith("123456789012");

    // Verify that onProductFound and onClose were called
    expect(mockOnProductFound).toHaveBeenCalledWith({
      name: "Test Product",
      category: "Test Category",
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should show an alert when product is not found", async () => {
    // Mock product not found
    (barcodeService.lookupBarcode as jest.Mock).mockResolvedValue({
      success: false,
      error: "Product not found",
    });

    // Render the modal
    render(
      <BarcodeScannerModal
        visible={true}
        onClose={mockOnClose}
        onProductFound={mockOnProductFound}
      />
    );

    // Get the mock BarcodeScanner component
    const BarcodeScannerMock = require("../BarcodeScanner");
    const mockInstance = BarcodeScannerMock.mock.calls[0][0];

    // Simulate a barcode scan by calling onScan
    await mockInstance.onScan("123456789012");

    // Verify that the barcode service was called
    expect(barcodeService.lookupBarcode).toHaveBeenCalledWith("123456789012");

    // Verify that an alert was shown
    expect(Alert.alert).toHaveBeenCalledWith(
      "Product Not Found",
      expect.any(String),
      expect.any(Array)
    );
  });

  it("should call onClose when the scanner is closed", () => {
    // Render the modal
    render(
      <BarcodeScannerModal
        visible={true}
        onClose={mockOnClose}
        onProductFound={mockOnProductFound}
      />
    );

    // Get the mock BarcodeScanner component
    const BarcodeScannerMock = require("../BarcodeScanner");
    const mockInstance = BarcodeScannerMock.mock.calls[0][0];

    // Simulate closing the scanner
    mockInstance.onClose();

    // Verify that onClose was called
    expect(mockOnClose).toHaveBeenCalled();
  });
});
