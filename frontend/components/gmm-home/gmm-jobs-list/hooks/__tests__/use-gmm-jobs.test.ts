import { renderHook, act, waitFor } from "@testing-library/react";
import { useGmmJobs } from "../use-gmm-jobs";
import { apiClient } from "~/services/api-client";

// Mock API client
jest.mock("~/services/api-client", () => ({
  apiClient: {
    searchGMMJobs: jest.fn(),
  },
}));

// Mock setInterval and clearInterval
jest.useFakeTimers();

describe("useGmmJobs", () => {
  const mockJobs = [
    {
      uuid: "uuid-1",
      name: "Running Job 1",
      status: "progress" as const,
      start: 1234567890,
      duration: 3600,
      trials_total: 10,
      trials_current: 5,
    },
    {
      uuid: "uuid-2",
      name: "Running Job 2",
      status: "pending" as const,
      start: 1234567890,
      duration: 3600,
      trials_total: 10,
      trials_current: 0,
    },
    {
      uuid: "uuid-3",
      name: "Finished Job 1",
      status: "success" as const,
      start: 1234567890,
      duration: 3600,
      trials_total: 10,
      trials_current: 10,
    },
    {
      uuid: "uuid-4",
      name: "Finished Job 2",
      status: "failure" as const,
      start: 1234567890,
      duration: 3600,
      trials_total: 10,
      trials_current: 3,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.searchGMMJobs as jest.Mock).mockResolvedValue(mockJobs);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it("should initialize with empty jobs arrays and empty search query", () => {
    const { result } = renderHook(() => useGmmJobs());

    expect(result.current.runningJobs).toEqual([]);
    expect(result.current.finishedJobs).toEqual([]);
    expect(result.current.searchQuery).toBe("");
  });

  it("should fetch jobs on mount and sort them correctly", async () => {
    const { result } = renderHook(() => useGmmJobs());

    // Wait for the API call to complete
    await waitFor(() => {
      expect(apiClient.searchGMMJobs).toHaveBeenCalled();
    });

    // Wait for the state to update
    await waitFor(() => {
      expect(result.current.runningJobs.length).toBe(2);
      expect(result.current.finishedJobs.length).toBe(2);
    });

    // Check that jobs are sorted correctly
    expect(result.current.runningJobs).toEqual([
      mockJobs[0], // progress
      mockJobs[1], // pending
    ]);
    expect(result.current.finishedJobs).toEqual([
      mockJobs[2], // success
      mockJobs[3], // failure
    ]);
  });

  it("should call searchGMMJobs with search query when provided", async () => {
    const { result } = renderHook(() => useGmmJobs());

    // Wait for the initial API call to complete
    await waitFor(() => {
      expect(apiClient.searchGMMJobs).toHaveBeenCalled();
    });

    // Set search query
    act(() => {
      result.current.setSearchQuery("test query");
    });

    // Should call API with search query
    await waitFor(() => {
      expect(apiClient.searchGMMJobs).toHaveBeenCalledWith({
        search_regex: "test query",
      });
    });
  });

  it("should call searchGMMJobs without search_regex when query is empty", async () => {
    const { result } = renderHook(() => useGmmJobs());

    // Wait for the initial API call to complete
    await waitFor(() => {
      expect(apiClient.searchGMMJobs).toHaveBeenCalledWith({
        search_regex: undefined,
      });
    });

    // Set search query to empty string
    act(() => {
      result.current.setSearchQuery("");
    });

    // Should call API without search_regex
    await waitFor(() => {
      expect(apiClient.searchGMMJobs).toHaveBeenCalledWith({
        search_regex: undefined,
      });
    });
  });

  it("should set up interval for periodic updates", async () => {
    renderHook(() => useGmmJobs());

    // Wait for the initial API call to complete
    await waitFor(() => {
      expect(apiClient.searchGMMJobs).toHaveBeenCalled();
    });

    // Clear the mock to track new calls
    (apiClient.searchGMMJobs as jest.Mock).mockClear();

    // Advance timers to trigger interval
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Should have called the API again
    expect(apiClient.searchGMMJobs).toHaveBeenCalled();
  });

  it("should clean up interval on unmount", async () => {
    const { unmount } = renderHook(() => useGmmJobs());

    // Wait for the initial API call to complete
    await waitFor(() => {
      expect(apiClient.searchGMMJobs).toHaveBeenCalled();
    });

    // Spy on clearInterval
    const clearIntervalSpy = jest.spyOn(global, "clearInterval");

    // Unmount the hook
    unmount();

    // Should have called clearInterval
    expect(clearIntervalSpy).toHaveBeenCalled();

    clearIntervalSpy.mockRestore();
  });

  it("should handle API error when fetching jobs", async () => {
    // Spy on console.error
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    // Make API call throw an error
    const mockError = new Error("API error");
    (apiClient.searchGMMJobs as jest.Mock).mockRejectedValue(mockError);

    renderHook(() => useGmmJobs());

    // Wait for the API call to complete
    await waitFor(() => {
      expect(apiClient.searchGMMJobs).toHaveBeenCalled();
    });

    // Advance timers to trigger interval
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Should have called the API again despite the error
    expect(apiClient.searchGMMJobs).toHaveBeenCalledTimes(2);

    consoleSpy.mockRestore();
  });
});
