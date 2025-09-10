/**
 * API Configuration for external services
 */

// UPC-Search.org API configuration
export const BARCODE_API = {
  // Free tier doesn't require an API key, but we'll structure it for future paid APIs
  BASE_URL: "https://www.upc-search.org/api",
  KEY: "", // No key needed for free tier
};

// Fallback API configuration (if primary fails)
export const FALLBACK_BARCODE_API = {
  BASE_URL: "https://go-upc.com/api/v1",
  KEY: "", // Would need to sign up for this paid API if needed
};
