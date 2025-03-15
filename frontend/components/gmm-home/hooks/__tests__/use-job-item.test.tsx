import { renderHook, act, waitFor } from "@testing-library/react";
import { useJobItem } from "../use-job-item";
import { useRouter } from "next/router";
import { apiClient } from "~/services/api-client";

// Mock Next.js router
jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

// Mock API client
jest.mock("~/services/api-client", () => ({
  apiClient: {
    getGMMJobs: jest.fn(),
  },
}));

describe("useJobItem", () => {
  const mockUuid = "test-uuid";
  const mockNComponents = "5";
  const mockRouter = {
    isReady: true,
    query: {
      experiment: mockUuid,
      n_components: mockNComponents,
    },
  };

  const mockJobResponse = {
    uuid: mockUuid,
    name: "Test GMM Job",
    status: "success" as const,
    start: 1234567890,
    duration: 3600,
    target: "target-uuid",
    params: {
      minimum_n_components: 1,
      maximum_n_components: 10,
      step_size: 1,
      n_trials_per_component: 5,
    },
    gmm: {
      current_n_components: 5,
      optimal_n_components: 5,
      weights: [0.2, 0.3, 0.1, 0.2, 0.2],
      means: [
        [0.1, 0.2],
        [0.3, 0.4],
        [0.5, 0.6],
        [0.7, 0.8],
        [0.9, 1.0],
      ],
      covs: [
        [
          [0.1, 0],
          [0, 0.1],
        ],
        [
          [0.1, 0],
          [0, 0.1],
        ],
        [
          [0.1, 0],
          [0, 0.1],
        ],
        [
          [0.1, 0],
          [0, 0.1],
        ],
        [
          [0.1, 0],
          [0, 0.1],
        ],
      ],
    },
    latent: {
      random_regions: ["AUCG", "GCAU", "UAGC", "CGUA", "ACGU"],
      coords_x: [0.1, 0.3, 0.5, 0.7, 0.9],
      coords_y: [0.2, 0.4, 0.6, 0.8, 1.0],
      duplicates: [1, 1, 1, 1, 1],
    },
    bic: {
      n_components: [1, 2, 3, 4, 5],
      bics: [100, 90, 80, 70, 60],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (apiClient.getGMMJobs as jest.Mock).mockResolvedValue(mockJobResponse);
  });

  it("should fetch job information when router is ready", async () => {
    const { result } = renderHook(() => useJobItem());

    // Loading starts
    expect(result.current.isLoading).toBe(true);
    expect(result.current.jobItem).toBe(null);

    // Wait for the effect to run
    await waitFor(() => {
      expect(apiClient.getGMMJobs).toHaveBeenCalled();
    });

    // Should have called the API with the correct parameters
    expect(apiClient.getGMMJobs).toHaveBeenCalledWith({
      params: { uuid: mockUuid },
      queries: {
        n_components: parseInt(mockNComponents),
      },
    });

    // Wait for the state to update
    await waitFor(() => {
      expect(result.current.jobItem).not.toBe(null);
    });

    // Should have updated the state with the API response
    expect(result.current.jobItem).toEqual(mockJobResponse);
    expect(result.current.isLoading).toBe(false);
  });

  it("should not fetch job information when router is not ready", async () => {
    // Mock router as not ready
    (useRouter as jest.Mock).mockReturnValue({
      ...mockRouter,
      isReady: false,
    });

    const { result } = renderHook(() => useJobItem());

    // Should not have called the API
    expect(apiClient.getGMMJobs).not.toHaveBeenCalled();

    // State should remain unchanged
    expect(result.current.jobItem).toBe(null);
    expect(result.current.isLoading).toBe(false);
  });

  it("should not fetch job information when uuid is not provided", async () => {
    // Mock router without uuid
    (useRouter as jest.Mock).mockReturnValue({
      isReady: true,
      query: {
        n_components: mockNComponents,
      },
    });

    const { result } = renderHook(() => useJobItem());

    // Should not have called the API
    expect(apiClient.getGMMJobs).not.toHaveBeenCalled();

    // State should remain unchanged
    expect(result.current.jobItem).toBe(null);
    expect(result.current.isLoading).toBe(false);
  });

  it("should handle API error when fetching job information", async () => {
    // Spy on console.error
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    // Make API call throw an error
    const mockError = new Error("API error");
    (apiClient.getGMMJobs as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useJobItem());

    // Wait for the effect to run
    await waitFor(() => {
      expect(apiClient.getGMMJobs).toHaveBeenCalled();
    });

    // Should have logged the error
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(mockError);
    });

    // State should be updated correctly
    expect(result.current.jobItem).toBe(null);
    expect(result.current.isLoading).toBe(false);

    consoleSpy.mockRestore();
  });

  it("should refresh job information when refresh is called", async () => {
    const { result } = renderHook(() => useJobItem());

    // Wait for the initial fetch to complete
    await waitFor(() => {
      expect(apiClient.getGMMJobs).toHaveBeenCalled();
    });

    // Clear the mock to track new calls
    (apiClient.getGMMJobs as jest.Mock).mockClear();

    // Call refresh
    act(() => {
      result.current.refresh();
    });

    // Wait for the refresh to complete
    await waitFor(() => {
      expect(apiClient.getGMMJobs).toHaveBeenCalled();
    });

    // Should have called the API again
    expect(apiClient.getGMMJobs).toHaveBeenCalledWith({
      params: { uuid: mockUuid },
      queries: {
        n_components: parseInt(mockNComponents),
      },
    });
  });

  it("should set isLoading to true during API call and false after completion", async () => {
    // Create a promise that we can resolve manually
    let resolveApiCall: (value: any) => void;
    const apiPromise = new Promise((resolve) => {
      resolveApiCall = resolve;
    });

    (apiClient.getGMMJobs as jest.Mock).mockReturnValue(apiPromise);

    const { result } = renderHook(() => useJobItem());

    // Loading starts
    expect(result.current.isLoading).toBe(true);

    // Wait for isLoading to become true
    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    // Resolve the API call
    act(() => {
      resolveApiCall(mockJobResponse);
    });

    // Wait for isLoading to become false
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have updated the state with the API response
    expect(result.current.jobItem).toEqual(mockJobResponse);
  });
});
