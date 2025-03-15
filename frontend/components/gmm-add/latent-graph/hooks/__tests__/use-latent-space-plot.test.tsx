import { renderHook, act } from "@testing-library/react";
import { useLatentSpacePlot } from "../use-latent-space-plot";
import { useSelector } from "react-redux";
import { apiClient } from "~/services/api-client";

// Mock React Redux
jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
}));

// Mock API client
jest.mock("~/services/api-client", () => ({
  apiClient: {
    getSelexData: jest.fn(),
  },
}));

describe("useLatentSpacePlot", () => {
  const mockParams = {
    vaeId: "test-vae-id",
    gmmName: "Test GMM",
    minNumComponents: 5,
    maxNumComponents: 15,
    stepSize: 1,
    numTrials: 10,
  };

  const mockSelexData = {
    duplicates: [1, 5, 10, 15, 20],
    coord_x: [1.1, 2.2, 3.3, 4.4, 5.5],
    coord_y: [0.1, 0.2, 0.3, 0.4, 0.5],
    random_regions: ["AUCG", "GCAU", "UAGC", "CGUA", "ACGU"],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useSelector as jest.Mock).mockImplementation((selector) => {
      return selector({ params: mockParams });
    });
    (apiClient.getSelexData as jest.Mock).mockResolvedValue(mockSelexData);
  });

  it("should fetch SELEX data on mount if vaeId is provided", async () => {
    const { result } = renderHook(() => useLatentSpacePlot(5));

    // Should start loading
    expect(result.current.isLoading).toBe(true);

    // Wait for the API call to resolve
    await act(async () => {
      await Promise.resolve();
    });

    // Should have called the API with the correct parameters
    expect(apiClient.getSelexData).toHaveBeenCalledWith({
      queries: { vae_uuid: "test-vae-id" },
    });

    // Should have updated the state with the API response
    expect(result.current.selexData).toEqual(mockSelexData);

    // Should no longer be loading
    expect(result.current.isLoading).toBe(false);
  });

  it("should not fetch SELEX data if vaeId is empty", async () => {
    // Mock empty vaeId
    (useSelector as jest.Mock).mockImplementation((selector) => {
      return selector({ params: { ...mockParams, vaeId: "" } });
    });

    const { result } = renderHook(() => useLatentSpacePlot(5));

    // Should not be loading
    expect(result.current.isLoading).toBe(false);

    // Wait for any potential API calls
    await act(async () => {
      await Promise.resolve();
    });

    // Should not have called the API
    expect(apiClient.getSelexData).not.toHaveBeenCalled();

    // State should remain unchanged
    expect(result.current.selexData).toEqual({
      duplicates: [],
      coord_x: [],
      coord_y: [],
      random_regions: [],
    });
  });

  it("should handle API error when fetching SELEX data", async () => {
    // Spy on console.error
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    // Make API call throw an error
    (apiClient.getSelexData as jest.Mock).mockRejectedValue(
      new Error("API error")
    );

    const { result } = renderHook(() => useLatentSpacePlot(5));

    // Should start loading
    expect(result.current.isLoading).toBe(true);

    // Wait for the API call to reject
    await act(async () => {
      await Promise.resolve();
    });

    // Should have logged the error
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching SELEX data:",
      expect.any(Error)
    );

    // Should no longer be loading
    expect(result.current.isLoading).toBe(false);

    // State should remain unchanged
    expect(result.current.selexData).toEqual({
      duplicates: [],
      coord_x: [],
      coord_y: [],
      random_regions: [],
    });

    consoleSpy.mockRestore();
  });

  it("should filter data based on minCount", async () => {
    const { result } = renderHook(() => useLatentSpacePlot(10));

    // Wait for the API call to resolve
    await act(async () => {
      await Promise.resolve();
    });

    // Should have filtered the data based on minCount
    // Only points with duplicates >= 10 should be included
    expect(result.current.vaeDataPlot).toEqual(
      expect.objectContaining({
        x: [3.3, 4.4, 5.5], // Corresponding to duplicates 10, 15, 20
        y: [0.3, 0.4, 0.5], // Corresponding to duplicates 10, 15, 20
        customdata: ["UAGC", "CGUA", "ACGU"], // Corresponding to duplicates 10, 15, 20
      })
    );
  });

  it("should update plot data when minCount changes", async () => {
    const { result, rerender } = renderHook(
      (props) => useLatentSpacePlot(props),
      { initialProps: 5 }
    );

    // Wait for the API call to resolve
    await act(async () => {
      await Promise.resolve();
    });

    // Initially should include all points with duplicates >= 5
    expect(result.current.vaeDataPlot).toEqual(
      expect.objectContaining({
        x: [2.2, 3.3, 4.4, 5.5], // Corresponding to duplicates 5, 10, 15, 20
        y: [0.2, 0.3, 0.4, 0.5], // Corresponding to duplicates 5, 10, 15, 20
        customdata: ["GCAU", "UAGC", "CGUA", "ACGU"], // Corresponding to duplicates 5, 10, 15, 20
      })
    );

    // Change minCount to 15
    rerender(15);

    // Should now only include points with duplicates >= 15
    expect(result.current.vaeDataPlot).toEqual(
      expect.objectContaining({
        x: [4.4, 5.5], // Corresponding to duplicates 15, 20
        y: [0.4, 0.5], // Corresponding to duplicates 15, 20
        customdata: ["CGUA", "ACGU"], // Corresponding to duplicates 15, 20
      })
    );
  });

  it("should set marker sizes based on duplicate counts", async () => {
    const { result } = renderHook(() => useLatentSpacePlot(5));

    // Wait for the API call to resolve
    await act(async () => {
      await Promise.resolve();
    });

    // Check that marker sizes are calculated correctly
    // Size should be Math.max(2, Math.sqrt(duplicateCount))
    expect(result.current.vaeDataPlot.marker).toEqual(
      expect.objectContaining({
        size: [
          Math.sqrt(5), // sqrt(5) ≈ 2.24
          Math.sqrt(10), // sqrt(10) ≈ 3.16
          Math.sqrt(15), // sqrt(15) ≈ 3.87
          Math.sqrt(20), // sqrt(20) ≈ 4.47
        ],
      })
    );
  });
});
