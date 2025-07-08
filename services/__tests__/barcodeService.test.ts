import axios from "axios";
import { barcodeService } from "../barcodeService";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("barcodeService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("lookupBarcode", () => {
    it("should return product data when API call is successful", async () => {
      // Mock successful API response
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          code: "123456789012",
          status: "OK",
          total: 1,
          product: {
            name: "Test Product",
            description: "A test product description",
            brand: "Test Brand",
            category: "Test Category",
            image: "https://example.com/image.jpg",
          },
        },
      });

      const result = await barcodeService.lookupBarcode("123456789012");

      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        success: true,
        product: {
          name: "Test Product",
          description: "A test product description",
          brand: "Test Brand",
          category: "Test Category",
          image: "https://example.com/image.jpg",
        },
      });
    });

    it("should return error when API call fails with an error", async () => {
      // Mock API error response
      mockedAxios.get.mockRejectedValueOnce(new Error("API Error"));

      const result = await barcodeService.lookupBarcode("123456789012");

      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        success: false,
        error: "Failed to lookup barcode",
      });
    });

    it("should return error when API returns no product data", async () => {
      // Mock API response with no product data
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          code: "123456789012",
          status: "NOT_FOUND",
          total: 0,
        },
      });

      const result = await barcodeService.lookupBarcode("123456789012");

      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        success: false,
        error: "Product not found",
      });
    });

    it("should clean non-numeric characters from barcode", async () => {
      // Mock successful API response
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          code: "123456789012",
          status: "OK",
          total: 1,
          product: {
            name: "Test Product",
          },
        },
      });

      await barcodeService.lookupBarcode("123-456-789-012");

      // Verify that the barcode was cleaned before making the API call
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            upc: "123456789012",
          }),
        })
      );
    });
  });
});
