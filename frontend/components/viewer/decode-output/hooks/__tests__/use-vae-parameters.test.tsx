import { renderHook, waitFor } from "@testing-library/react";
import { useVaeParameters } from "../use-vae-parameters";
import { apiClient } from "~/services/api-client";
import { act } from "react-dom/test-utils";

// Mock API client
jest.mock("~/services/api-client", () => ({
  apiClient: {
    getVAEModelParameters: jest.fn(),
  },
}));

describe("useVaeParameters", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty strings when vaeId is null", () => {
    const { result } = renderHook(() => useVaeParameters(null));

    expect(result.current.forward).toBe("");
    expect(result.current.reverse).toBe("");
    expect(apiClient.getVAEModelParameters).not.toHaveBeenCalled();
  });

  it("should fetch VAE parameters when vaeId is provided", async () => {
    const mockResponse = {
      forward_adapter: "FORWARD_ADAPTER",
      reverse_adapter: "REVERSE_ADAPTER",
    };

    (apiClient.getVAEModelParameters as jest.Mock).mockResolvedValue(
      mockResponse
    );

    const { result } = renderHook(() => useVaeParameters("test-vae-id"));

    // Initial state should be empty strings
    expect(result.current.forward).toBe("");
    expect(result.current.reverse).toBe("");

    // Wait for the effect to run
    await waitFor(() => {
      expect(result.current.forward).toBe("FORWARD_ADAPTER");
      expect(result.current.reverse).toBe("REVERSE_ADAPTER");
    });

    // Check that API was called with correct parameters
    expect(apiClient.getVAEModelParameters).toHaveBeenCalledWith({
      queries: {
        vae_uuid: "test-vae-id",
      },
    });
  });

  it("should handle API errors gracefully", async () => {
    // Spy on console.error
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    // Mock API error
    const mockError = new Error("API error");
    (apiClient.getVAEModelParameters as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useVaeParameters("error-vae-id"));

    // Wait for the effect to run and catch the error
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error fetching VAE parameters:",
        mockError
      );
    });

    // State should remain as initial values
    expect(result.current.forward).toBe("");
    expect(result.current.reverse).toBe("");

    consoleSpy.mockRestore();
  });

  it("should handle missing adapter values", async () => {
    const mockResponse = {
      // Missing adapters
    };

    (apiClient.getVAEModelParameters as jest.Mock).mockResolvedValue(
      mockResponse
    );

    const { result } = renderHook(() => useVaeParameters("test-vae-id"));

    // Wait for the effect to run
    await waitFor(() => {
      expect(apiClient.getVAEModelParameters).toHaveBeenCalled();
    });

    // Should default to empty strings
    expect(result.current.forward).toBe("");
    expect(result.current.reverse).toBe("");
  });
});
