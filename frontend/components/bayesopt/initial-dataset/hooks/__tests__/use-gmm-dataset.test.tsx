import { renderHook, waitFor } from "@testing-library/react";
import { useGmmDataset } from "../use-gmm-dataset";
import { useSelector, useDispatch } from "react-redux";
import { apiClient } from "~/services/api-client";
import { setRegisteredValues } from "../../../redux/registered-values";
import { setBayesoptConfig } from "../../../redux/bayesopt-config";
import { setIsDirty } from "../../../redux/is-dirty";
import { act } from "react-dom/test-utils";

// Mock React Redux
jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

// Mock API client
jest.mock("~/services/api-client", () => ({
  apiClient: {
    getGMMModelNames: jest.fn(),
    getGMMModel: jest.fn(),
    decode: jest.fn(),
    encode: jest.fn(),
  },
}));

// Mock Redux actions
jest.mock("../../../redux/registered-values", () => ({
  setRegisteredValues: jest.fn((data) => ({
    type: "registeredValues/setRegisteredValues",
    payload: data,
  })),
}));

jest.mock("../../../redux/bayesopt-config", () => ({
  setBayesoptConfig: jest.fn((data) => ({
    type: "bayesoptConfig/setBayesoptConfig",
    payload: data,
  })),
}));

jest.mock("../../../redux/is-dirty", () => ({
  setIsDirty: jest.fn((data) => ({
    type: "isDirty/setIsDirty",
    payload: data,
  })),
}));

describe("useGmmDataset", () => {
  let mockDispatch: jest.Mock;

  // Mock data for testing
  const mockSessionConfig = {
    sessionId: "session-id",
    vaeId: "vae-id",
    vaeName: "Model 1",
  };

  const mockBayesoptConfig = {
    targetColumn: "target",
    queryBudget: 3,
    optimizationType: "qEI",
  };

  const mockGmmModels = {
    entries: [
      { uuid: "gmm-uuid-1", name: "GMM Model 1" },
      { uuid: "gmm-uuid-2", name: "GMM Model 2" },
    ],
  };

  const mockGmmModel = {
    means: [
      [1.0, 1.5],
      [2.0, 2.5],
    ],
  };

  const mockDecodeResponse = {
    sequences: ["AUGC_N", "CGUA_N"],
  };

  const mockEncodeResponse = {
    coords_x: [1.1, 2.1],
    coords_y: [1.6, 2.6],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock dispatch
    mockDispatch = jest.fn();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);

    // Mock Redux selectors
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector.toString().includes("sessionConfig")) {
        return mockSessionConfig;
      } else if (selector.toString().includes("bayesoptConfig")) {
        return mockBayesoptConfig;
      }
      return null;
    });

    // Mock API responses
    (apiClient.getGMMModelNames as jest.Mock).mockResolvedValue(mockGmmModels);
    (apiClient.getGMMModel as jest.Mock).mockResolvedValue(mockGmmModel);
    (apiClient.decode as jest.Mock).mockResolvedValue(mockDecodeResponse);
    (apiClient.encode as jest.Mock).mockResolvedValue(mockEncodeResponse);
  });

  it("should fetch GMM models on mount", async () => {
    renderHook(() => useGmmDataset());

    // Wait for the useEffect to run
    await waitFor(() => {
      expect(apiClient.getGMMModelNames).toHaveBeenCalledWith({
        queries: {
          vae_uuid: "vae-id",
        },
      });
    });
  });

  it("should initialize with the first GMM model", async () => {
    const { result } = renderHook(() => useGmmDataset());

    // Wait for the useEffect to run
    await waitFor(() => {
      expect(result.current.selectedModel).toBe("gmm-uuid-1");
    });

    // Check that gmmModels is set correctly
    expect(result.current.gmmModels).toEqual(mockGmmModels.entries);
  });

  it("should handle GMM model selection", async () => {
    const { result } = renderHook(() => useGmmDataset());

    // Wait for the useEffect to run
    await waitFor(() => {
      expect(result.current.selectedModel).toBe("gmm-uuid-1");
    });

    // Change selected model
    act(() => {
      result.current.setSelectedModel("gmm-uuid-2");
    });

    // Check that selectedModel is updated
    expect(result.current.selectedModel).toBe("gmm-uuid-2");
  });

  it("should handle clicking Apply GMM", async () => {
    const { result } = renderHook(() => useGmmDataset());

    // Wait for the useEffect to run
    await waitFor(() => {
      expect(result.current.selectedModel).toBe("gmm-uuid-1");
    });

    // Call handleClickApplyGMM
    await act(async () => {
      await result.current.handleClickApplyGMM();
    });

    // Check that getGMMModel was called with correct parameters
    expect(apiClient.getGMMModel).toHaveBeenCalledWith({
      queries: {
        gmm_uuid: "gmm-uuid-1",
      },
    });

    // Check that decode was called with correct parameters
    expect(apiClient.decode).toHaveBeenCalledWith({
      session_uuid: "session-id",
      coords_x: [1.0, 2.0],
      coords_y: [1.5, 2.5],
    });

    // Check that encode was called with correct parameters
    expect(apiClient.encode).toHaveBeenCalledWith({
      session_uuid: "session-id",
      sequences: ["AUGC", "CGUA"],
    });

    // Check that setIsDirty was called with true
    expect(setIsDirty).toHaveBeenCalledWith(true);

    // Check that setRegisteredValues was called with correct parameters
    expect(setRegisteredValues).toHaveBeenCalled();
    const registeredCall = (setRegisteredValues as unknown as jest.Mock).mock
      .calls[0][0];
    expect(registeredCall.id).toEqual(["MoG No.1", "MoG No.2"]);
    expect(registeredCall.randomRegion).toEqual(["AUGC", "CGUA"]);
    expect(registeredCall.coordX).toEqual([1.1, 2.1]);
    expect(registeredCall.coordY).toEqual([1.6, 2.6]);
    expect(registeredCall.columnNames).toEqual(["value"]);

    // Check that setBayesoptConfig was called with correct parameters
    expect(setBayesoptConfig).toHaveBeenCalledWith({
      ...mockBayesoptConfig,
      targetColumn: "value",
    });

    // Check that isLoading is false after completion
    expect(result.current.isLoading).toBe(false);
  });

  it("should do nothing when no model is selected", async () => {
    // Mock empty selectedModel
    const { result } = renderHook(() => useGmmDataset());

    // Set selectedModel to empty string
    act(() => {
      result.current.setSelectedModel("");
    });

    // Call handleClickApplyGMM
    await act(async () => {
      await result.current.handleClickApplyGMM();
    });

    // Check that getGMMModel was not called
    expect(apiClient.getGMMModel).not.toHaveBeenCalled();

    // Check that isLoading is false
    expect(result.current.isLoading).toBe(false);
  });

  it("should handle API errors gracefully", async () => {
    // Mock API error
    const mockError = new Error("API error");
    (apiClient.getGMMModel as jest.Mock).mockRejectedValue(mockError);

    // Spy on console.error
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    const { result } = renderHook(() => useGmmDataset());

    // Wait for the useEffect to run
    await waitFor(() => {
      expect(result.current.selectedModel).toBe("gmm-uuid-1");
    });

    // Call handleClickApplyGMM
    await act(async () => {
      await result.current.handleClickApplyGMM();
    });

    // Check that error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error applying GMM model:",
      mockError
    );

    // Check that isLoading is false after error
    expect(result.current.isLoading).toBe(false);

    consoleSpy.mockRestore();
  });

  it("should handle empty GMM models list", async () => {
    // Mock empty GMM models
    (apiClient.getGMMModelNames as jest.Mock).mockResolvedValue({
      entries: [],
    });

    const { result } = renderHook(() => useGmmDataset());

    // Wait for the useEffect to run
    await waitFor(() => {
      expect(apiClient.getGMMModelNames).toHaveBeenCalled();
    });

    // Check that gmmModels is empty
    expect(result.current.gmmModels).toEqual([]);

    // Check that selectedModel is empty
    expect(result.current.selectedModel).toBe("");
  });
});
