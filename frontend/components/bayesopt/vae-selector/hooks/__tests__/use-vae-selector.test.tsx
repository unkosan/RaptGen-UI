import { renderHook, waitFor } from "@testing-library/react";
import { useVaeSelector } from "../use-vae-selector";
import { useSelector, useDispatch } from "react-redux";
import { apiClient } from "~/services/api-client";
import { setIsDirty } from "../../../redux/is-dirty";
import { setSessionConfigByVaeIdName } from "../../../redux/session-config";
import { setRegisteredValues } from "../../../redux/registered-values";
import { setQueriedValues } from "../../../redux/queried-values";
import { setAcquisitionValues } from "../../../redux/acquisition-values";
import { act } from "react-dom/test-utils";

// Mock React Redux
jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

// Mock API client
jest.mock("~/services/api-client", () => ({
  apiClient: {
    getVAEModelNames: jest.fn(),
    encode: jest.fn(),
  },
}));

// Mock Redux actions
jest.mock("../../../redux/is-dirty", () => ({
  setIsDirty: jest.fn((data) => ({
    type: "isDirty/setIsDirty",
    payload: data,
  })),
}));

jest.mock("../../../redux/session-config", () => ({
  setSessionConfigByVaeIdName: jest.fn((data) => ({
    type: "sessionConfig/setSessionConfigByVaeIdName",
    payload: { ...data, sessionId: "new-session-id" },
  })),
}));

jest.mock("../../../redux/registered-values", () => ({
  setRegisteredValues: jest.fn((data) => ({
    type: "registeredValues/setRegisteredValues",
    payload: data,
  })),
}));

jest.mock("../../../redux/queried-values", () => ({
  setQueriedValues: jest.fn((data) => ({
    type: "queriedValues/setQueriedValues",
    payload: data,
  })),
}));

jest.mock("../../../redux/acquisition-values", () => ({
  setAcquisitionValues: jest.fn((data) => ({
    type: "acquisitionValues/setAcquisitionValues",
    payload: data,
  })),
}));

describe("useVaeSelector", () => {
  let mockDispatch: jest.Mock;

  // Mock data for testing
  const mockModels = [
    { name: "Model 1", uuid: "uuid1" },
    { name: "Model 2", uuid: "uuid2" },
  ];

  const mockSessionConfig = {
    sessionId: "session-id",
    vaeId: "uuid1",
    vaeName: "Model 1",
  };

  const mockRegisteredValues = {
    id: ["id1", "id2"],
    randomRegion: ["AUCG", "GCAU"],
    coordX: [1.0, 2.0],
    coordY: [1.5, 2.5],
    staged: [true, false],
    masterboxChecked: true,
    columnNames: ["col1", "col2"],
    sequenceIndex: [0, 0, 1, 1],
    column: ["col1", "col2", "col1", "col2"],
    value: [10, 20, 30, 40],
  };

  const mockEncodeResponse = {
    coords_x: [3.0, 4.0],
    coords_y: [3.5, 4.5],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock dispatch
    mockDispatch = jest.fn((action) => action);
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);

    // Mock API responses
    (apiClient.getVAEModelNames as jest.Mock).mockResolvedValue({
      entries: mockModels,
    });
    (apiClient.encode as jest.Mock).mockResolvedValue(mockEncodeResponse);

    // Mock Redux selectors
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector.toString().includes("sessionConfig")) {
        return mockSessionConfig;
      } else if (selector.toString().includes("registeredValues")) {
        return mockRegisteredValues;
      }
      return null;
    });
  });

  it("should fetch VAE model names on mount", async () => {
    const { result } = renderHook(() => useVaeSelector());

    // Wait for the useEffect to run
    await waitFor(() => {
      expect(apiClient.getVAEModelNames).toHaveBeenCalled();
    });

    // Check that models is set correctly
    expect(result.current.models).toEqual(mockModels);
  });

  it("should initialize selectedModel from sessionConfig", async () => {
    const { result } = renderHook(() => useVaeSelector());

    // Wait for the useEffect to run
    await waitFor(() => {
      expect(result.current.selectedModel).toBe("uuid1");
    });
  });

  it("should update selectedModel when sessionConfig changes", async () => {
    // Initial render
    const { result, rerender } = renderHook(() => useVaeSelector());

    // Wait for the initial useEffect to run
    await waitFor(() => {
      expect(result.current.selectedModel).toBe("uuid1");
    });

    // Mock updated sessionConfig
    const updatedSessionConfig = {
      ...mockSessionConfig,
      vaeId: "uuid2",
      vaeName: "Model 2",
    };

    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector.toString().includes("sessionConfig")) {
        return updatedSessionConfig;
      } else if (selector.toString().includes("registeredValues")) {
        return mockRegisteredValues;
      }
      return null;
    });

    // Rerender the hook
    rerender();

    // Check that selectedModel is updated
    expect(result.current.selectedModel).toBe("uuid2");
  });

  it("should handle model change", async () => {
    const { result } = renderHook(() => useVaeSelector());

    // Wait for the useEffect to run
    await waitFor(() => {
      expect(result.current.models).toEqual(mockModels);
    });

    // Mock change event
    const changeEvent = {
      target: {
        value: "uuid2",
      },
    } as React.ChangeEvent<HTMLSelectElement>;

    // Call handleModelChange
    await act(async () => {
      await result.current.handleModelChange(changeEvent);
    });

    // Check that setIsDirty was called with true
    expect(setIsDirty).toHaveBeenCalledWith(true);

    // Check that selectedModel is updated
    expect(result.current.selectedModel).toBe("uuid2");

    // Check that setSessionConfigByVaeIdName was called with correct parameters
    expect(setSessionConfigByVaeIdName).toHaveBeenCalledWith({
      vaeId: "uuid2",
      vaeName: "Model 2",
    });

    // Check that encode was called with correct parameters
    expect(apiClient.encode).toHaveBeenCalledWith({
      session_uuid: "new-session-id",
      sequences: mockRegisteredValues.randomRegion,
    });

    // Check that setRegisteredValues was called with correct parameters
    expect(setRegisteredValues).toHaveBeenCalledWith({
      ...mockRegisteredValues,
      coordX: mockEncodeResponse.coords_x,
      coordY: mockEncodeResponse.coords_y,
    });

    // Check that setQueriedValues was called to reset queried values
    expect(setQueriedValues).toHaveBeenCalledWith({
      masterboxChecked: false,
      randomRegion: [],
      coordX: [],
      coordY: [],
      coordOriginalX: [],
      coordOriginalY: [],
      staged: [],
    });

    // Check that setAcquisitionValues was called to reset acquisition values
    expect(setAcquisitionValues).toHaveBeenCalledWith({
      acquisitionValues: [],
      coordX: [],
      coordY: [],
    });

    // Check that dispatch was called for each action
    expect(mockDispatch).toHaveBeenCalledTimes(5);
  });

  it("should not update if model is not found", async () => {
    const { result } = renderHook(() => useVaeSelector());

    // Wait for the useEffect to run
    await waitFor(() => {
      expect(result.current.models).toEqual(mockModels);
    });

    // Mock change event with invalid UUID
    const changeEvent = {
      target: {
        value: "invalid-uuid",
      },
    } as React.ChangeEvent<HTMLSelectElement>;

    // Call handleModelChange
    await act(async () => {
      await result.current.handleModelChange(changeEvent);
    });

    // Check that setIsDirty was not called
    expect(setIsDirty).not.toHaveBeenCalled();

    // Check that selectedModel is not updated
    expect(result.current.selectedModel).toBe("uuid1");

    // Check that setSessionConfigByVaeIdName was not called
    expect(setSessionConfigByVaeIdName).not.toHaveBeenCalled();

    // Check that encode was not called
    expect(apiClient.encode).not.toHaveBeenCalled();
  });

  it("should handle API errors gracefully", async () => {
    // Mock API error
    const mockError = new Error("API error");
    (apiClient.encode as jest.Mock).mockRejectedValue(mockError);

    // Spy on console.error
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    const { result } = renderHook(() => useVaeSelector());

    // Wait for the useEffect to run
    await waitFor(() => {
      expect(result.current.models).toEqual(mockModels);
    });

    // Mock change event
    const changeEvent = {
      target: {
        value: "uuid2",
      },
    } as React.ChangeEvent<HTMLSelectElement>;

    // Call handleModelChange
    await act(async () => {
      await result.current.handleModelChange(changeEvent);
    });

    // Check that error was logged
    expect(consoleSpy).toHaveBeenCalledWith(mockError);

    // Should not be loading after error
    expect(result.current.isLoading).toBe(false);

    consoleSpy.mockRestore();
  });
});
