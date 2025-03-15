import { renderHook, act } from "@testing-library/react";
import { useGraphConfig } from "../use-graph-config";
import { useDispatch, useSelector } from "react-redux";
import { setGraphConfig } from "../../../redux/graphConfig";

// Mock React Redux
jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

// Mock Redux actions
jest.mock("../../../redux/graphConfig", () => ({
  setGraphConfig: jest.fn((data) => ({
    type: "graphConfig/setGraphConfig",
    payload: data,
  })),
}));

describe("useGraphConfig", () => {
  let mockDispatch: jest.Mock;

  const mockGraphConfig = {
    minCount: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch = jest.fn();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Mock the selector function to return our mock state
      if (selector.name === "selector") {
        return selector({ graphConfig: mockGraphConfig });
      }
      return mockGraphConfig;
    });
  });

  it("should initialize with the correct state from Redux", () => {
    const { result } = renderHook(() => useGraphConfig());

    expect(result.current.minCount).toBe(5);
    expect(result.current.isValidMinCount).toBe(true);
  });

  it("should handle valid minCount change", () => {
    const { result } = renderHook(() => useGraphConfig());

    // Simulate changing the minCount to a valid value
    act(() => {
      result.current.handleMinCountChange({
        target: { value: "10" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // Check that the local state was updated
    expect(result.current.minCount).toBe(10);
    expect(result.current.isValidMinCount).toBe(true);

    // Check that the Redux action was dispatched
    expect(setGraphConfig).toHaveBeenCalledWith({
      ...mockGraphConfig,
      minCount: 10,
    });
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "graphConfig/setGraphConfig",
        payload: expect.objectContaining({
          minCount: 10,
        }),
      })
    );
  });

  it("should handle invalid minCount change", () => {
    const { result } = renderHook(() => useGraphConfig());

    // Simulate changing the minCount to an invalid value (negative)
    act(() => {
      result.current.handleMinCountChange({
        target: { value: "-5" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // Check that the local state was updated but marked as invalid
    expect(result.current.minCount).toBe(-5);
    expect(result.current.isValidMinCount).toBe(false);

    // Check that the Redux action was NOT dispatched for invalid value
    expect(setGraphConfig).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("should handle non-numeric minCount change", () => {
    const { result } = renderHook(() => useGraphConfig());

    // Simulate changing the minCount to a non-numeric value
    act(() => {
      result.current.handleMinCountChange({
        target: { value: "abc" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // Check that the local state was updated but marked as invalid
    // NaN is not equal to itself, so we need to check isNaN
    expect(isNaN(result.current.minCount)).toBe(true);
    expect(result.current.isValidMinCount).toBe(false);

    // Check that the Redux action was NOT dispatched for invalid value
    expect(setGraphConfig).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("should handle zero minCount change", () => {
    const { result } = renderHook(() => useGraphConfig());

    // Simulate changing the minCount to zero (invalid)
    act(() => {
      result.current.handleMinCountChange({
        target: { value: "0" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // Check that the local state was updated but marked as invalid
    expect(result.current.minCount).toBe(0);
    expect(result.current.isValidMinCount).toBe(false);

    // Check that the Redux action was NOT dispatched for invalid value
    expect(setGraphConfig).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("should handle error during dispatch", () => {
    // Make dispatch throw an error
    mockDispatch.mockImplementation(() => {
      throw new Error("Dispatch error");
    });

    const { result } = renderHook(() => useGraphConfig());

    // Simulate changing the minCount to a valid value
    // This should not throw even though dispatch throws
    expect(() => {
      act(() => {
        result.current.handleMinCountChange({
          target: { value: "10" },
        } as React.ChangeEvent<HTMLInputElement>);
      });
    }).not.toThrow();

    // Check that the local state was still updated
    expect(result.current.minCount).toBe(10);
    expect(result.current.isValidMinCount).toBe(true);
  });
});
