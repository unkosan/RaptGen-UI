import { renderHook } from "@testing-library/react";
import { useGraphConfig } from "../use-graph-config";
import { useSelector, useDispatch } from "react-redux";
import { setIsDirty } from "../../../redux/is-dirty";
import { setGraphConfig } from "../../../redux/graph-config";
import { act } from "react-dom/test-utils";

// Mock React Redux
jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

// Mock Redux actions
jest.mock("../../../redux/is-dirty", () => ({
  setIsDirty: jest.fn((data) => ({
    type: "isDirty/setIsDirty",
    payload: data,
  })),
}));

jest.mock("../../../redux/graph-config", () => ({
  setGraphConfig: jest.fn((data) => ({
    type: "graphConfig/setGraphConfig",
    payload: data,
  })),
}));

describe("useGraphConfig", () => {
  let mockDispatch: jest.Mock;

  // Mock data for testing
  const mockGraphConfig = {
    minCount: 5,
    showSelex: true,
    showTitle: false,
    showAcquisition: false,
    vaeName: "test-vae",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock dispatch
    mockDispatch = jest.fn();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);

    // Mock Redux selectors
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector.toString().includes("graphConfig")) {
        return mockGraphConfig;
      }
      return null;
    });
  });

  it("should initialize with values from graphConfig", () => {
    const { result } = renderHook(() => useGraphConfig());

    // Check that local state is initialized correctly
    expect(result.current.minCount).toBe(5);
    expect(result.current.showSelex).toBe(true);
    expect(result.current.showTitle).toBe(false);
    expect(result.current.showContour).toBe(false);
    expect(result.current.isValidMinCount).toBe(true);
  });

  it("should handle minCount change with valid input", () => {
    const { result } = renderHook(() => useGraphConfig());

    // Mock change event with valid input
    const changeEvent = {
      currentTarget: {
        value: "10",
      },
    } as React.ChangeEvent<HTMLInputElement>;

    // Call handleMinCountChange
    act(() => {
      result.current.handleMinCountChange(changeEvent);
    });

    // Check that local state is updated correctly
    expect(result.current.minCount).toBe(10);
    expect(result.current.isValidMinCount).toBe(true);

    // Check that setIsDirty was called with true
    expect(setIsDirty).toHaveBeenCalledWith(true);

    // Check that setGraphConfig was called with correct parameters
    expect(setGraphConfig).toHaveBeenCalledWith({
      ...mockGraphConfig,
      minCount: 10,
    });

    // Check that dispatch was called for each action
    expect(mockDispatch).toHaveBeenCalledTimes(2);
  });

  it("should handle minCount change with invalid input", () => {
    const { result } = renderHook(() => useGraphConfig());

    // Mock change event with invalid input
    const changeEvent = {
      currentTarget: {
        value: "-5",
      },
    } as React.ChangeEvent<HTMLInputElement>;

    // Call handleMinCountChange
    act(() => {
      result.current.handleMinCountChange(changeEvent);
    });

    // Check that local state is updated correctly
    expect(result.current.minCount).toBe(-5);
    expect(result.current.isValidMinCount).toBe(false);

    // Check that setIsDirty was called with true
    expect(setIsDirty).toHaveBeenCalledWith(true);

    // Check that setGraphConfig was not called
    expect(setGraphConfig).not.toHaveBeenCalled();

    // Check that dispatch was called only for setIsDirty
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });

  it("should handle minCount change with non-numeric input", () => {
    const { result } = renderHook(() => useGraphConfig());

    // Mock change event with non-numeric input
    const changeEvent = {
      currentTarget: {
        value: "abc",
      },
    } as React.ChangeEvent<HTMLInputElement>;

    // Call handleMinCountChange
    act(() => {
      result.current.handleMinCountChange(changeEvent);
    });

    // Check that local state is updated correctly
    expect(result.current.minCount).toBe(NaN);
    expect(result.current.isValidMinCount).toBe(false);

    // Check that setIsDirty was called with true
    expect(setIsDirty).toHaveBeenCalledWith(true);

    // Check that setGraphConfig was not called
    expect(setGraphConfig).not.toHaveBeenCalled();

    // Check that dispatch was called only for setIsDirty
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });

  it("should handle showSelex change", () => {
    const { result } = renderHook(() => useGraphConfig());

    // Mock change event
    const changeEvent = {
      currentTarget: {
        checked: false,
      },
    } as React.ChangeEvent<HTMLInputElement>;

    // Call handleShowSelexChange
    act(() => {
      result.current.handleChangeShowSelex(changeEvent);
    });

    // Check that local state is updated correctly
    expect(result.current.showSelex).toBe(false);

    // Check that setIsDirty was called with true
    expect(setIsDirty).toHaveBeenCalledWith(true);

    // Check that setGraphConfig was called with correct parameters
    expect(setGraphConfig).toHaveBeenCalledWith({
      ...mockGraphConfig,
      showSelex: false,
    });

    // Check that dispatch was called for each action
    expect(mockDispatch).toHaveBeenCalledTimes(2);
  });

  it("should handle showContour change", () => {
    const { result } = renderHook(() => useGraphConfig());

    // Mock change event
    const changeEvent = {
      currentTarget: {
        checked: true,
      },
    } as React.ChangeEvent<HTMLInputElement>;

    // Call handleChangeShowContour
    act(() => {
      result.current.handleChangeShowContour(changeEvent);
    });

    // Check that local state is updated correctly
    expect(result.current.showContour).toBe(true);

    // Check that setIsDirty was called with true
    expect(setIsDirty).toHaveBeenCalledWith(true);

    // Check that setGraphConfig was called with correct parameters
    expect(setGraphConfig).toHaveBeenCalledWith({
      ...mockGraphConfig,
      showAcquisition: true,
    });

    // Check that dispatch was called for each action
    expect(mockDispatch).toHaveBeenCalledTimes(2);
  });

  it("should handle showTitle change", () => {
    const { result } = renderHook(() => useGraphConfig());

    // Mock change event
    const changeEvent = {
      currentTarget: {
        checked: true,
      },
    } as React.ChangeEvent<HTMLInputElement>;

    // Call handleChangeShowTitle
    act(() => {
      result.current.handleChangeShowTitle(changeEvent);
    });

    // Check that local state is updated correctly
    expect(result.current.showTitle).toBe(true);

    // Check that setIsDirty was not called
    expect(setIsDirty).not.toHaveBeenCalled();

    // Check that setGraphConfig was called with correct parameters
    expect(setGraphConfig).toHaveBeenCalledWith({
      ...mockGraphConfig,
      showTitle: true,
    });

    // Check that dispatch was called for once
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });

  it("should handle errors when updating graph config", () => {
    // Mock dispatch to throw an error
    mockDispatch.mockImplementation(() => {
      throw new Error("Dispatch error");
    });

    // Spy on console.error
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    const { result } = renderHook(() => useGraphConfig());

    // Mock change event
    const changeEvent = {
      currentTarget: {
        checked: true,
      },
    } as React.ChangeEvent<HTMLInputElement>;

    // Call handleChangeShowContour
    act(() => {
      result.current.handleChangeShowContour(changeEvent);
    });

    // Check that error was logged
    expect(consoleSpy).toHaveBeenCalled();

    // Check that local state is still updated
    expect(result.current.showContour).toBe(true);

    consoleSpy.mockRestore();
  });
});
