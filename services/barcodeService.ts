import axios from "axios";
import { BARCODE_API } from "../lib/apiConfig";

/**
 * Response type for barcode lookup
 */
export interface BarcodeProductResponse {
  success: boolean;
  product?: {
    name: string;
    description?: string;
    brand?: string;
    category?: string;
    image?: string;
  };
  error?: string;
}

/**
 * Service for barcode scanning and product lookup
 */
export const barcodeService = {
  /**
   * Lookup a product by barcode
   * @param barcode The barcode to lookup (UPC, EAN, etc.)
   * @returns Product information if found
   */
  async lookupBarcode(barcode: string): Promise<BarcodeProductResponse> {
    try {
      // Remove any non-numeric characters from the barcode
      const cleanBarcode = barcode.replace(/\D/g, "");

      // Call the UPC-Search.org API
      const response = await axios.get(`${BARCODE_API.BASE_URL}/lookup`, {
        params: {
          upc: cleanBarcode,
        },
      });

      // Check if the API returned a valid product
      if (response.data && response.data.product) {
        return {
          success: true,
          product: {
            name: response.data.product.name || "Unknown Product",
            description: response.data.product.description,
            brand: response.data.product.brand,
            category: response.data.product.category,
            image: response.data.product.image,
          },
        };
      }

      // No product found
      return {
        success: false,
        error: "Product not found",
      };
    } catch (error) {
      console.error("Error looking up barcode:", error);
      return {
        success: false,
        error: "Failed to lookup barcode",
      };
    }
  },

  /**
   * Fallback method to use a different API if the primary one fails
   * This would be implemented if we decide to use a paid API
   */
  async lookupBarcodeFallback(
    barcode: string
  ): Promise<BarcodeProductResponse> {
    // Placeholder: no external call yet; return a consistent error response
    const _ = barcode; // keep signature used
    return Promise.resolve({
      success: false,
      error: "Fallback API not implemented",
    });
  },
};
