import { renderHook } from "@testing-library/react";
import { useRunBayesOptButton } from "../use-run-bayesopt-button";
import { useSelector, useDispatch } from "react-redux";
import { setQueriedValues } from "../../../redux/queried-values";
import { setAcquisitionValues } from "../../../redux/acquisition-values";
import { setIsDirty } from "../../../redux/is-dirty";
import { apiClient } from "~/services/api-client";
import { act } from "react-dom/test-utils";

// Mock React Redux
jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

// Mock Redux actions
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

jest.mock("../../../redux/is-dirty", () => ({
  setIsDirty: jest.fn((data) => ({
    type: "isDirty/setIsDirty",
    payload: data,
  })),
}));

// Mock API client
jest.mock("~/services/api-client", () => ({
  apiClient: {
    runBayesopt: jest.fn(),
    decode: jest.fn(),
    encode: jest.fn(),
  },
}));

// Mock window.alert
const mockAlert = jest.fn();
global.alert = mockAlert;

describe("useRunBayesOptButton", () => {
  let mockDispatch: jest.Mock;

  // Mock data for testing
  const mockBayesoptConfig = {
    targetColumn: "col1",
    queryBudget: 5,
  };

  const mockRegisteredData = {
    id: ["id1", "id2"],
    randomRegion: ["AUCG", "GCAU"],
    coordX: [1.0, 2.0],
    coordY: [1.5, 2.5],
    staged: [true, false],
    masterboxChecked: true,
    columnNames: ["col1", "col2"],
    sequenceIndex: [0, 1],
    column: ["col1", "col2"],
    value: [10, 20],
  };

  const mockQueryData = {
    masterboxChecked: true,
    randomRegion: [],
    coordX: [],
    coordY: [],
    coordOriginalX: [],
    coordOriginalY: [],
    staged: [],
  };

  const mockSessionId = "test-session-id";

  // Mock API responses
  const mockRunBayesoptResponse = {
    query_data: {
      coords_x: [3.0, 4.0],
      coords_y: [3.5, 4.5],
    },
    acquisition_data: {
      coords_x: [1.0, 2.0, 3.0, 4.0],
      coords_y: [1.5, 2.5, 3.5, 4.5],
      values: [0.1, 0.2, 0.3, 0.4],
    },
  };

  const mockDecodeResponse = {
    sequences: ["AUGC_N", "CGUA_N"],
  };

  const mockEncodeResponse = {
    coords_x: [3.1, 4.1],
    coords_y: [3.6, 4.6],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch = jest.fn();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Mock the selector function to return appropriate data
      if (selector.toString().includes("bayesoptConfig")) {
        return mockBayesoptConfig;
      } else if (selector.toString().includes("registeredValues")) {
        return mockRegisteredData;
      } else if (selector.toString().includes("queriedValues")) {
        return mockQueryData;
      } else if (selector.toString().includes("sessionConfig")) {
        return { sessionId: mockSessionId };
      }
      return null;
    });

    // Mock API responses
    (apiClient.runBayesopt as jest.Mock).mockResolvedValue(
      mockRunBayesoptResponse
    );
    (apiClient.decode as jest.Mock).mockResolvedValue(mockDecodeResponse);
    (apiClient.encode as jest.Mock).mockResolvedValue(mockEncodeResponse);
  });

  it("should initialize with isLoading set to false", () => {
    const { result } = renderHook(() => useRunBayesOptButton());
    expect(result.current.isLoading).toBe(false);
  });

  it("should validate input data before running Bayesian optimization", async () => {
    const { result } = renderHook(() => useRunBayesOptButton());

    // Call handleClick
    await act(async () => {
      await result.current.handleClick();
    });

    // Check that API was called with correct parameters
    expect(apiClient.runBayesopt).toHaveBeenCalledWith({
      coords_x: [1.0],
      coords_y: [1.5],
      optimization_args: {
        method_name: "qEI",
        query_budget: 5,
      },
      distribution_args: {
        xlim_max: 3.5,
        xlim_min: -3.5,
        ylim_max: 3.5,
        ylim_min: -3.5,
      },
      values: [[10]],
    });
  });

  it("should update Redux store with results after successful API calls", async () => {
    const { result } = renderHook(() => useRunBayesOptButton());

    // Call handleClick
    await act(async () => {
      await result.current.handleClick();
    });

    // Check that setQueriedValues was called with correct data
    expect(setQueriedValues).toHaveBeenCalled();
    const queriedCall = (setQueriedValues as unknown as jest.Mock).mock
      .calls[0][0];

    // Verify that the query data was updated correctly
    expect(queriedCall.randomRegion).toEqual(["AUGC", "CGUA"]);
    expect(queriedCall.coordX).toEqual([3.1, 4.1]);
    expect(queriedCall.coordY).toEqual([3.6, 4.6]);
    expect(queriedCall.coordOriginalX).toEqual([3.0, 4.0]);
    expect(queriedCall.coordOriginalY).toEqual([3.5, 4.5]);

    // Check that setAcquisitionValues was called with correct data
    expect(setAcquisitionValues).toHaveBeenCalled();
    const acquisitionCall = (setAcquisitionValues as unknown as jest.Mock).mock
      .calls[0][0];

    // Verify that the acquisition data was updated correctly
    expect(acquisitionCall.acquisitionValues).toEqual([0.1, 0.2, 0.3, 0.4]);
    expect(acquisitionCall.coordX).toEqual([1.0, 2.0, 3.0, 4.0]);
    expect(acquisitionCall.coordY).toEqual([1.5, 2.5, 3.5, 4.5]);

    // Check that setIsDirty was called with true
    expect(setIsDirty).toHaveBeenCalledWith(true);

    // Check that dispatch was called for each action
    expect(mockDispatch).toHaveBeenCalledTimes(3);
  });

  it("should show alert when target column is not selected", async () => {
    // Mock bayesopt config with empty target column
    const emptyTargetConfig = {
      ...mockBayesoptConfig,
      targetColumn: "",
    };

    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector.toString().includes("bayesoptConfig")) {
        return emptyTargetConfig;
      } else if (selector.toString().includes("registeredValues")) {
        return mockRegisteredData;
      } else if (selector.toString().includes("queriedValues")) {
        return mockQueryData;
      } else if (selector.toString().includes("sessionConfig")) {
        return { sessionId: mockSessionId };
      }
      return null;
    });

    const { result } = renderHook(() => useRunBayesOptButton());

    // Call handleClick
    await act(async () => {
      await result.current.handleClick();
    });

    // Check that alert was called with correct message
    expect(mockAlert).toHaveBeenCalledWith("Please select the target column");

    // Check that API was not called
    expect(apiClient.runBayesopt).not.toHaveBeenCalled();
  });

  it("should show alert when query budget is 0", async () => {
    // Mock bayesopt config with zero query budget
    const zeroBudgetConfig = {
      ...mockBayesoptConfig,
      queryBudget: 0,
    };

    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector.toString().includes("bayesoptConfig")) {
        return zeroBudgetConfig;
      } else if (selector.toString().includes("registeredValues")) {
        return mockRegisteredData;
      } else if (selector.toString().includes("queriedValues")) {
        return mockQueryData;
      } else if (selector.toString().includes("sessionConfig")) {
        return { sessionId: mockSessionId };
      }
      return null;
    });

    const { result } = renderHook(() => useRunBayesOptButton());

    // Call handleClick
    await act(async () => {
      await result.current.handleClick();
    });

    // Check that alert was called with correct message
    expect(mockAlert).toHaveBeenCalledWith("Please set the query budget");

    // Check that API was not called
    expect(apiClient.runBayesopt).not.toHaveBeenCalled();
  });

  it("should show alert when no values are registered", async () => {
    // Mock registered data with no staged items
    const noStagedRegisteredData = {
      ...mockRegisteredData,
      staged: [false, false],
    };

    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector.toString().includes("bayesoptConfig")) {
        return mockBayesoptConfig;
      } else if (selector.toString().includes("registeredValues")) {
        return noStagedRegisteredData;
      } else if (selector.toString().includes("queriedValues")) {
        return mockQueryData;
      } else if (selector.toString().includes("sessionConfig")) {
        return { sessionId: mockSessionId };
      }
      return null;
    });

    const { result } = renderHook(() => useRunBayesOptButton());

    // Call handleClick
    await act(async () => {
      await result.current.handleClick();
    });

    // Check that alert was called with correct message
    expect(mockAlert).toHaveBeenCalledWith(
      "Please register at least one value"
    );

    // Check that API was not called
    expect(apiClient.runBayesopt).not.toHaveBeenCalled();
  });

  it("should handle API errors gracefully", async () => {
    // Mock API error
    const mockError = new Error("API error");
    (apiClient.runBayesopt as jest.Mock).mockRejectedValue(mockError);

    // Spy on console.error
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    const { result } = renderHook(() => useRunBayesOptButton());

    // Call handleClick
    await act(async () => {
      await result.current.handleClick();
    });

    // Check that error was logged
    expect(consoleSpy).toHaveBeenCalledWith(mockError);

    // Should not be loading after error
    expect(result.current.isLoading).toBe(false);

    consoleSpy.mockRestore();
  });
});
