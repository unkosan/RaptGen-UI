import { renderHook, act } from "@testing-library/react";
import { useGraphConfig } from "../use-graph-config";
import { useDispatch, useSelector } from "react-redux";
import { setGraphConfig } from "../../../redux/graph-config";

// Mock React Redux
jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

// Mock Redux actions
jest.mock("../../../redux/graph-config", () => ({
  setGraphConfig: jest.fn((config) => ({
    type: "graphConfig2/setGraphConfig",
    payload: config,
  })),
}));

describe("useGraphConfig", () => {
  const mockDispatch = jest.fn();
  const mockGraphConfig = {
    minCount: 5,
    showGMM: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Mock the selector function to return our mock state
      return mockGraphConfig;
    });
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useGraphConfig());

    expect(result.current.showGMM).toBe(true);
    expect(result.current.minCount).toBe(5);
    expect(result.current.isValidMinCount).toBe(true);
  });

  it("should update minCount when handleMinCountChange is called with valid input", () => {
    const { result } = renderHook(() => useGraphConfig());

    const mockEvent = {
      target: {
        value: "10",
      },
    } as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleMinCountChange(mockEvent);
    });

    expect(result.current.minCount).toBe(10);
    expect(result.current.isValidMinCount).toBe(true);
  });

  it("should mark minCount as invalid when handleMinCountChange is called with invalid input", () => {
    const { result } = renderHook(() => useGraphConfig());

    const mockEvent = {
      target: {
        value: "invalid",
      },
    } as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleMinCountChange(mockEvent);
    });

    expect(result.current.minCount).toBeNaN();
    expect(result.current.isValidMinCount).toBe(false);
  });

  it("should mark minCount as invalid when handleMinCountChange is called with value less than 1", () => {
    const { result } = renderHook(() => useGraphConfig());

    const mockEvent = {
      target: {
        value: "0",
      },
    } as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleMinCountChange(mockEvent);
    });

    expect(result.current.minCount).toBe(0);
    expect(result.current.isValidMinCount).toBe(false);
  });

  it("should update showGMM when handleShowGMMChange is called", () => {
    const { result } = renderHook(() => useGraphConfig());

    const mockEvent = {
      target: {
        checked: false,
      },
    } as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleShowGMMChange(mockEvent);
    });

    expect(result.current.showGMM).toBe(false);
  });

  it("should dispatch setGraphConfig with updated values when state changes", () => {
    const { result } = renderHook(() => useGraphConfig());

    // Update minCount
    const mockMinCountEvent = {
      target: {
        value: "10",
      },
    } as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleMinCountChange(mockMinCountEvent);
    });

    // Update showGMM
    const mockShowGMMEvent = {
      target: {
        checked: false,
      },
    } as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleShowGMMChange(mockShowGMMEvent);
    });

    // Check that setGraphConfig was called with the correct values
    expect(setGraphConfig).toHaveBeenCalledWith({
      ...mockGraphConfig,
      minCount: 10,
      showGMM: false,
    });

    // Check that dispatch was called with the action
    expect(mockDispatch).toHaveBeenCalled();
  });

  it("should not update minCount in Redux when input is invalid", () => {
    const { result } = renderHook(() => useGraphConfig());

    // Update minCount with invalid value
    const mockMinCountEvent = {
      target: {
        value: "invalid",
      },
    } as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleMinCountChange(mockMinCountEvent);
    });

    // Check that setGraphConfig was called with the original minCount
    expect(setGraphConfig).toHaveBeenCalledWith({
      ...mockGraphConfig,
      minCount: mockGraphConfig.minCount, // Should keep the original value
      showGMM: true,
    });
  });
});
