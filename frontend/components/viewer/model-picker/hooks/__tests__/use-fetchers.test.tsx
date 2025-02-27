import { renderHook, act } from "@testing-library/react-hooks";
import {
  useEntriesVAE,
  useEntriesGMM,
  useParamsVAE,
  useParamsGMM,
} from "../use-fetchers";
import { usePickVAE, usePickGMM } from "../use-dispatchers";
import { apiClient } from "~/services/api-client";

// Mock Next.js router
jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

// Mock API client
jest.mock("~/services/api-client", () => ({
  apiClient: {
    getVAEModelNames: jest.fn(),
    getGMMModelNames: jest.fn(),
    getVAEModelParameters: jest.fn(),
    getGMMModelParameters: jest.fn(),
  },
}));

// Mock dispatcher hooks
jest.mock("../use-dispatchers", () => ({
  usePickVAE: jest.fn(),
  usePickGMM: jest.fn(),
}));

describe("useEntriesVAE", () => {
  // Template of results from useRouter
  let mockPush: jest.Mock;
  const mockRouter = {
    isReady: true,
    query: {},
    push: jest.fn(),
  };

  // Template of results from usePickVAE
  let mockSetModelId: jest.Mock;
  const mockPickVAE = {
    modelId: "",
    setModelId: jest.fn(),
    sessionId: "",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup router mock
    mockPush = jest.fn();
    mockRouter.push = mockPush;
    (require("next/router").useRouter as jest.Mock).mockReturnValue(mockRouter);

    // Setup usePickVAE mock
    mockSetModelId = jest.fn();
    mockPickVAE.setModelId = mockSetModelId;
    (usePickVAE as jest.Mock).mockReturnValue(mockPickVAE);
  });

  it("should fetch VAE entries and return them", async () => {
    // Setup mock API response
    const mockEntries = [
      { uuid: "vae-1", name: "VAE Model 1" },
      { uuid: "vae-2", name: "VAE Model 2" },
    ];
    (apiClient.getVAEModelNames as jest.Mock).mockResolvedValue({
      entries: mockEntries,
    });

    // Render the hook
    const { result, waitForNextUpdate } = renderHook(() => useEntriesVAE());

    // Wait for the effect to run
    await waitForNextUpdate();

    // Verify the API was called
    expect(apiClient.getVAEModelNames).toHaveBeenCalled();

    // Verify the entries were returned
    expect(result.current.entries).toEqual(mockEntries);
    expect(result.current.isLoading).toBe(false);

    // Verify router.push was called with the first entry
    expect(mockPush).toHaveBeenCalledWith(
      `?uuid=${mockEntries[0].uuid}`,
      undefined,
      { shallow: true }
    );
  });

  it("should select VAE model from URL query", async () => {
    // Setup router with query param
    const queryRouter = {
      ...mockRouter,
      query: { uuid: "vae-2" },
    };
    (require("next/router").useRouter as jest.Mock).mockReturnValue(
      queryRouter
    );

    // Setup mock API response
    const mockEntries = [
      { uuid: "vae-1", name: "VAE Model 1" },
      { uuid: "vae-2", name: "VAE Model 2" },
    ];
    (apiClient.getVAEModelNames as jest.Mock).mockResolvedValue({
      entries: mockEntries,
    });

    // Render the hook
    const { result, waitForNextUpdate } = renderHook(() => useEntriesVAE());

    // Wait for the effect to run
    await waitForNextUpdate();

    // Verify setModelId was called with the correct parameters
    expect(mockSetModelId).toHaveBeenCalledWith("vae-2", "VAE Model 2");

    // Verify router.push was not called (no need to change URL)
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("should set empty model when no entries are returned", async () => {
    // Setup mock API response with no entries
    (apiClient.getVAEModelNames as jest.Mock).mockResolvedValue({
      entries: [],
    });

    // Render the hook
    const { result, waitForNextUpdate } = renderHook(() => useEntriesVAE());

    // Wait for the effect to run
    await waitForNextUpdate();

    // Verify setModelId was called with empty strings
    expect(mockSetModelId).toHaveBeenCalledWith("", "");

    // Verify the empty entries array was returned
    expect(result.current.entries).toEqual([]);
  });

  it("should handle API error gracefully", async () => {
    // Setup mock API to throw an error
    const mockError = new Error("API error");
    (apiClient.getVAEModelNames as jest.Mock).mockRejectedValue(mockError);

    // Spy on console.error
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    // Render the hook
    const { result, waitForNextUpdate } = renderHook(() => useEntriesVAE());

    // Wait for the effect to run
    await waitForNextUpdate();

    // Verify the error was logged
    expect(consoleSpy).toHaveBeenCalledWith(mockError);

    // Verify an empty array was returned and loading state is false
    expect(result.current.entries).toEqual([]);
    expect(result.current.isLoading).toBe(false);

    consoleSpy.mockRestore();
  });

  it("should have a refresh function that triggers data reload", async () => {
    // Setup mock API response
    const mockEntries = [{ uuid: "vae-1", name: "VAE Model 1" }];
    (apiClient.getVAEModelNames as jest.Mock).mockResolvedValue({
      entries: mockEntries,
    });

    // Render the hook
    const { result, waitForNextUpdate } = renderHook(() => useEntriesVAE());

    // Wait for the effect to run
    await waitForNextUpdate();

    // Clear the mocks to check for subsequent calls
    jest.clearAllMocks();

    // Call the refresh function
    act(() => {
      result.current.refresh();
    });

    // Wait for the effect to run again
    await waitForNextUpdate();

    // Verify the API was called again
    expect(apiClient.getVAEModelNames).toHaveBeenCalled();
  });
});

describe("useEntriesGMM", () => {
  // Template of the result from usePickGMM
  let mockSetModelId: jest.Mock;
  const mockPickGMM = {
    modelId: "",
    setModelId: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup usePickGMM mock
    mockSetModelId = jest.fn();
    mockPickGMM.setModelId = mockSetModelId;
    (usePickGMM as jest.Mock).mockReturnValue(mockPickGMM);
  });

  it("should return empty entries when vaeId is empty", async () => {
    // Render the hook with empty vaeId
    const { result } = renderHook(() => useEntriesGMM(""));

    // Verify API was not called
    expect(apiClient.getGMMModelNames).not.toHaveBeenCalled();

    // Verify empty entries were returned
    expect(result.current.entries).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it("should fetch GMM entries for valid vaeId", async () => {
    // Setup mock API response
    const mockEntries = [
      { uuid: "gmm-1", name: "GMM Model 1" },
      { uuid: "gmm-2", name: "GMM Model 2" },
    ];
    (apiClient.getGMMModelNames as jest.Mock).mockResolvedValue({
      entries: mockEntries,
    });

    // Render the hook with a valid vaeId
    const { result, waitForNextUpdate } = renderHook(() =>
      useEntriesGMM("vae-1")
    );

    // Wait for the effect to run
    await waitForNextUpdate();

    // Verify the API was called with the correct parameters
    expect(apiClient.getGMMModelNames).toHaveBeenCalledWith({
      queries: { vae_uuid: "vae-1" },
    });

    // Verify the entries were returned
    expect(result.current.entries).toEqual(mockEntries);
    expect(result.current.isLoading).toBe(false);

    // Verify setModelId was called with the first entry's uuid
    expect(mockSetModelId).toHaveBeenCalledWith("gmm-1");
  });

  it("should handle API error gracefully", async () => {
    // Setup mock API to throw an error
    const mockError = new Error("API error");
    (apiClient.getGMMModelNames as jest.Mock).mockRejectedValue(mockError);

    // Spy on console.error
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    // Render the hook with a valid vaeId
    const { result, waitForNextUpdate } = renderHook(() =>
      useEntriesGMM("vae-1")
    );

    // Wait for the effect to run
    await waitForNextUpdate();

    // Verify the error was logged
    expect(consoleSpy).toHaveBeenCalledWith(mockError);

    // Verify an empty array was returned and loading state is false
    expect(result.current.entries).toEqual([]);
    expect(result.current.isLoading).toBe(false);

    consoleSpy.mockRestore();
  });
});

describe("useParamsVAE", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not fetch parameters when vaeId is empty", () => {
    // Render the hook with empty vaeId
    const { result } = renderHook(() => useParamsVAE(""));

    // Verify API was not called
    expect(apiClient.getVAEModelParameters).not.toHaveBeenCalled();

    // Verify empty records were returned
    expect(result.current.records).toEqual({});
    expect(result.current.isLoading).toBe(false);
  });

  it("should fetch VAE parameters for valid vaeId", async () => {
    // Setup mock API response
    const mockParameters = {
      param1: "value1",
      param2: 42,
      param3: true,
    };
    (apiClient.getVAEModelParameters as jest.Mock).mockResolvedValue(
      mockParameters
    );

    // Render the hook with a valid vaeId
    const { result, waitForNextUpdate } = renderHook(() =>
      useParamsVAE("vae-1")
    );

    // Wait for the effect to run
    await waitForNextUpdate();

    // Verify the API was called with the correct parameters
    expect(apiClient.getVAEModelParameters).toHaveBeenCalledWith({
      queries: { vae_uuid: "vae-1" },
    });

    // Verify the parameters were returned with values converted to strings
    expect(result.current.records).toEqual({
      param1: "value1",
      param2: "42",
      param3: "true",
    });
    expect(result.current.isLoading).toBe(false);
  });

  it("should handle API error gracefully", async () => {
    // Setup mock API to throw an error
    const mockError = new Error("API error");
    (apiClient.getVAEModelParameters as jest.Mock).mockRejectedValue(mockError);

    // Spy on console.error
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    // Render the hook with a valid vaeId
    const { result, waitForNextUpdate } = renderHook(() =>
      useParamsVAE("vae-1")
    );

    // Wait for the effect to run
    await waitForNextUpdate();

    // Verify the error was logged
    expect(consoleSpy).toHaveBeenCalledWith(mockError);

    // Verify empty records were returned and loading state is false
    expect(result.current.records).toEqual({});
    expect(result.current.isLoading).toBe(false);

    consoleSpy.mockRestore();
  });
});

describe("useParamsGMM", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not fetch parameters when gmmId is empty", () => {
    // Render the hook with empty gmmId
    const { result } = renderHook(() => useParamsGMM(""));

    // Verify API was not called
    expect(apiClient.getGMMModelParameters).not.toHaveBeenCalled();

    // Verify empty records were returned
    expect(result.current.records).toEqual({});
    expect(result.current.isLoading).toBe(false);
  });

  it("should fetch GMM parameters for valid gmmId", async () => {
    // Setup mock API response
    const mockParameters = {
      param1: "value1",
      param2: 42,
      param3: true,
    };
    (apiClient.getGMMModelParameters as jest.Mock).mockResolvedValue(
      mockParameters
    );

    // Render the hook with a valid gmmId
    const { result, waitForNextUpdate } = renderHook(() =>
      useParamsGMM("gmm-1")
    );

    // Wait for the effect to run
    await waitForNextUpdate();

    // Verify the API was called with the correct parameters
    expect(apiClient.getGMMModelParameters).toHaveBeenCalledWith({
      queries: { gmm_uuid: "gmm-1" },
    });

    // Verify the parameters were returned with values converted to strings
    expect(result.current.records).toEqual({
      param1: "value1",
      param2: "42",
      param3: "true",
    });
    expect(result.current.isLoading).toBe(false);
  });

  it("should handle API error gracefully", async () => {
    // Setup mock API to throw an error
    const mockError = new Error("API error");
    (apiClient.getGMMModelParameters as jest.Mock).mockRejectedValue(mockError);

    // Spy on console.error
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    // Render the hook with a valid gmmId
    const { result, waitForNextUpdate } = renderHook(() =>
      useParamsGMM("gmm-1")
    );

    // Wait for the effect to run
    await waitForNextUpdate();

    // Verify the error was logged
    expect(consoleSpy).toHaveBeenCalledWith(mockError);

    // Verify empty records were returned and loading state is false
    expect(result.current.records).toEqual({});
    expect(result.current.isLoading).toBe(false);

    consoleSpy.mockRestore();
  });
});
