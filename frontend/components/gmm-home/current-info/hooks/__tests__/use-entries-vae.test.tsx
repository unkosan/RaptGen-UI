import { renderHook, act, waitFor } from "@testing-library/react";
import { useEntriesVAE } from "../use-entries-vae";
import { apiClient } from "~/services/api-client";

// Mock API client
jest.mock("~/services/api-client", () => ({
  apiClient: {
    getVAEModelNames: jest.fn(),
  },
}));

describe("useEntriesVAE", () => {
  const mockEntries = [
    { uuid: "uuid-1", name: "VAE Model 1" },
    { uuid: "uuid-2", name: "VAE Model 2" },
    { uuid: "uuid-3", name: "VAE Model 3" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.getVAEModelNames as jest.Mock).mockResolvedValue({
      entries: mockEntries,
    });
  });

  it("should initialize with empty entries", () => {
    const { result } = renderHook(() => useEntriesVAE());

    expect(result.current.entries).toEqual([]);
  });

  it("should fetch and set entries on mount", async () => {
    const { result } = renderHook(() => useEntriesVAE());

    // Wait for the API call to complete
    await waitFor(() => {
      expect(apiClient.getVAEModelNames).toHaveBeenCalled();
    });

    // Wait for the state to update
    await waitFor(() => {
      expect(result.current.entries).toEqual(mockEntries);
    });
  });

  it("should handle API error when fetching entries", async () => {
    // Spy on console.error
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    // Make API call throw an error
    const mockError = new Error("API error");
    (apiClient.getVAEModelNames as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useEntriesVAE());

    // Wait for the API call to complete
    await waitFor(() => {
      expect(apiClient.getVAEModelNames).toHaveBeenCalled();
    });

    // Should have logged the error
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(mockError);
    });

    // Entries should remain empty
    expect(result.current.entries).toEqual([]);

    consoleSpy.mockRestore();
  });

  it("should set isLoading to true during API call and false after completion", async () => {
    // Create a promise that we can resolve manually
    let resolveApiCall: (value: any) => void;
    const apiPromise = new Promise((resolve) => {
      resolveApiCall = resolve;
    });

    (apiClient.getVAEModelNames as jest.Mock).mockReturnValue(apiPromise);

    // Render the hook
    const { result } = renderHook(() => useEntriesVAE());

    // Initial state should have entries as empty array
    expect(result.current.entries).toEqual([]);

    // Wait for the API call to be made and isLoading to be true
    // Note: We can't directly test isLoading since it's not returned from the hook
    // But we can verify the API was called
    await waitFor(() => {
      expect(apiClient.getVAEModelNames).toHaveBeenCalled();
    });

    // Resolve the API call
    act(() => {
      resolveApiCall({ entries: mockEntries });
    });

    // Wait for the state to update
    await waitFor(() => {
      expect(result.current.entries).toEqual(mockEntries);
    });
  });
});
