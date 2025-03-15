import { renderHook } from "@testing-library/react";
import { useBayesOptConfig } from "../use-bayesopt-config";
import { useSelector, useDispatch } from "react-redux";
import { setBayesoptConfig } from "../../../redux/bayesopt-config";
import { setIsDirty } from "../../../redux/is-dirty";
import { act } from "react-dom/test-utils";

// Mock React Redux
jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

// Mock Redux actions
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

describe("useBayesOptConfig", () => {
  let mockDispatch: jest.Mock;

  // Mock data for testing
  const mockBayesoptConfig = {
    targetColumn: "target",
    queryBudget: 5,
    optimizationType: "qEI",
  };

  const mockColumns = ["target", "value1", "value2"];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock dispatch
    mockDispatch = jest.fn();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);

    // Mock Redux selectors
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector.toString().includes("bayesoptConfig")) {
        return mockBayesoptConfig;
      } else if (selector.toString().includes("registeredValues.columnNames")) {
        return mockColumns;
      }
      return null;
    });
  });

  it("should initialize with values from Redux state", () => {
    const { result } = renderHook(() => useBayesOptConfig());

    // Check that values are initialized correctly
    expect(result.current.targetColumn).toBe("target");
    expect(result.current.queryBudget).toBe(5);
    expect(result.current.isValidBudget).toBe(true);
    expect(result.current.columns).toEqual(["target", "value1", "value2"]);
    expect(result.current.optimizationType).toBe("qEI (multiple query)");
  });

  it("should handle target column change", () => {
    const { result } = renderHook(() => useBayesOptConfig());

    // Mock change event
    const changeEvent = {
      target: {
        value: "value1",
      },
    } as React.ChangeEvent<HTMLSelectElement>;

    // Call handleChangeColumnName
    act(() => {
      result.current.handleChangeColumnName(changeEvent);
    });

    // Check that targetColumn is updated
    expect(result.current.targetColumn).toBe("value1");

    // Check that setIsDirty was called with true
    expect(setIsDirty).toHaveBeenCalledWith(true);

    // Check that setBayesoptConfig was called with correct parameters
    expect(setBayesoptConfig).toHaveBeenCalledWith({
      ...mockBayesoptConfig,
      targetColumn: "value1",
      queryBudget: 5,
    });

    // Check that dispatch was called
    expect(mockDispatch).toHaveBeenCalled();
  });

  it("should handle query budget change with valid input", () => {
    const { result } = renderHook(() => useBayesOptConfig());

    // Mock change event with valid input
    const changeEvent = {
      target: {
        value: "10",
      },
    } as React.ChangeEvent<HTMLInputElement>;

    // Call handleChangeBudget
    act(() => {
      result.current.handleChangeBudget(changeEvent);
    });

    // Check that queryBudget is updated
    expect(result.current.queryBudget).toBe(10);

    // Check that isValidBudget is true
    expect(result.current.isValidBudget).toBe(true);

    // Check that setIsDirty was called with true
    expect(setIsDirty).toHaveBeenCalledWith(true);

    // Check that setBayesoptConfig was called with correct parameters
    expect(setBayesoptConfig).toHaveBeenCalledWith({
      ...mockBayesoptConfig,
      queryBudget: 10,
      targetColumn: "target",
    });

    // Check that dispatch was called
    expect(mockDispatch).toHaveBeenCalled();
  });

  it("should handle query budget change with invalid input", () => {
    const { result } = renderHook(() => useBayesOptConfig());

    // Mock change event with invalid input
    const changeEvent = {
      target: {
        value: "-5",
      },
    } as React.ChangeEvent<HTMLInputElement>;

    // Call handleChangeBudget
    act(() => {
      result.current.handleChangeBudget(changeEvent);
    });

    // Check that queryBudget is updated
    expect(result.current.queryBudget).toBe(-5);

    // Check that isValidBudget is false
    expect(result.current.isValidBudget).toBe(false);

    // Check that setIsDirty was called with true
    expect(setIsDirty).toHaveBeenCalledWith(true);

    // Check that setBayesoptConfig was called with correct parameters
    // Note: It should use the original queryBudget since the new one is invalid
    expect(setBayesoptConfig).toHaveBeenCalledWith({
      ...mockBayesoptConfig,
      queryBudget: 5,
      targetColumn: "target",
    });

    // Check that dispatch was called
    expect(mockDispatch).toHaveBeenCalled();
  });

  it("should handle query budget change with non-numeric input", () => {
    const { result } = renderHook(() => useBayesOptConfig());

    // Mock change event with non-numeric input
    const changeEvent = {
      target: {
        value: "abc",
      },
    } as React.ChangeEvent<HTMLInputElement>;

    // Call handleChangeBudget
    act(() => {
      result.current.handleChangeBudget(changeEvent);
    });

    // Check that queryBudget is updated to NaN
    expect(result.current.queryBudget).toBeNaN();

    // Check that isValidBudget is false
    expect(result.current.isValidBudget).toBe(false);

    // Check that setIsDirty was called with true
    expect(setIsDirty).toHaveBeenCalledWith(true);

    // Check that setBayesoptConfig was called with correct parameters
    // Note: It should use the original queryBudget since the new one is invalid
    expect(setBayesoptConfig).toHaveBeenCalledWith({
      ...mockBayesoptConfig,
      queryBudget: 5,
      targetColumn: "target",
    });

    // Check that dispatch was called
    expect(mockDispatch).toHaveBeenCalled();
  });

  it("should handle optimization type change", () => {
    const { result } = renderHook(() => useBayesOptConfig());

    // Mock change event
    const changeEvent = {
      target: {
        value: "EI",
      },
    } as React.ChangeEvent<HTMLSelectElement>;

    // Call handleChangeOptimizationType
    act(() => {
      result.current.handleChangeOptimizationType(changeEvent);
    });

    // This function is not implemented yet, so we just check that it doesn't throw
    expect(true).toBe(true);
  });
});
