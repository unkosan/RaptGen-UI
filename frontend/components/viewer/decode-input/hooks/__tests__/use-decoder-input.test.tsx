import { renderHook, waitFor } from "@testing-library/react";
import { useCoords, useGridConfig } from "../use-decoder-input";
import { useDispatch, useSelector } from "react-redux";
import { setDecodeGrid } from "../../../redux/interaction-data";
import { setGraphConfig } from "../../../redux/graph-config";
import { act } from "react-dom/test-utils";

// Mock React Redux
jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

// Mock Redux actions
jest.mock("../../../redux/interaction-data", () => ({
  setDecodeGrid: jest.fn((data) => ({
    type: "interactionData/setDecodeGrid",
    payload: data,
  })),
}));

jest.mock("../../../redux/graph-config", () => ({
  setGraphConfig: jest.fn((data) => ({
    type: "graphConfig2/setGraphConfig",
    payload: data,
  })),
}));

describe("useCoords", () => {
  let mockDispatch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch = jest.fn();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useCoords());

    expect(result.current.pointX).toBe("0");
    expect(result.current.pointY).toBe("0");
    expect(result.current.isValidX).toBe(true);
    expect(result.current.isValidY).toBe(true);
  });

  it("should update pointX and validate on onChangeX", () => {
    const { result } = renderHook(() => useCoords());

    // Valid input
    act(() => {
      result.current.handleChangeX({
        target: { value: "1.5" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.pointX).toBe("1.5");
    expect(result.current.isValidX).toBe(true);

    // Invalid input
    act(() => {
      result.current.handleChangeX({
        target: { value: "abc" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.pointX).toBe("abc");
    expect(result.current.isValidX).toBe(false);
  });

  it("should update pointY and validate on onChangeY", () => {
    const { result } = renderHook(() => useCoords());

    // Valid input
    act(() => {
      result.current.handleChangeY({
        target: { value: "2.5" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.pointY).toBe("2.5");
    expect(result.current.isValidY).toBe(true);

    // Invalid input
    act(() => {
      result.current.handleChangeY({
        target: { value: "xyz" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.pointY).toBe("xyz");
    expect(result.current.isValidY).toBe(false);
  });

  it("should dispatch setDecodeGrid when both coordinates are valid", async () => {
    const { result } = renderHook(() => useCoords());

    // Set valid coordinates
    act(() => {
      result.current.handleChangeX({
        target: { value: "1.5" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleChangeY({
        target: { value: "2.5" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // Wait for the useEffect to run
    await waitFor(() => {
      expect(setDecodeGrid).toHaveBeenCalledWith({
        coordX: 1.5,
        coordY: 2.5,
      });
    });

    // Check that dispatch was called with the action
    expect(mockDispatch).toHaveBeenCalled();
  });

  it("should not dispatch setDecodeGrid with invalid X coordinate value", async () => {
    const { result } = renderHook(() => useCoords());

    // Reset mock calls from initialization
    jest.clearAllMocks();

    // Set invalid X coordinate
    act(() => {
      result.current.handleChangeX({
        target: { value: "abc" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleChangeY({
        target: { value: "2.5" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // Wait for the useEffect to run
    await waitFor(() => {
      // The useEffect will still run, but it should not dispatch with the invalid X value
      expect(setDecodeGrid).not.toHaveBeenCalledWith({
        coordX: NaN, // This would be the result of parseFloat("abc")
        coordY: 2.5,
      });
    });
  });

  it("should not dispatch setDecodeGrid with invalid Y coordinate value", async () => {
    const { result } = renderHook(() => useCoords());

    // Reset mock calls from initialization
    jest.clearAllMocks();

    // Set invalid Y coordinate
    act(() => {
      result.current.handleChangeX({
        target: { value: "1.5" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleChangeY({
        target: { value: "xyz" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // Wait for the useEffect to run
    await waitFor(() => {
      // The useEffect will still run, but it should not dispatch with the invalid Y value
      expect(setDecodeGrid).not.toHaveBeenCalledWith({
        coordX: 1.5,
        coordY: NaN, // This would be the result of parseFloat("xyz")
      });
    });
  });
});

describe("useGridConfig", () => {
  let mockDispatch: jest.Mock;
  const mockGraphConfig = {
    minCount: 5,
    showGMM: true,
    showDecodeGrid: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch = jest.fn();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useSelector as jest.Mock).mockImplementation(() => mockGraphConfig);
  });

  it("should return showGrid value from Redux state", () => {
    const { result } = renderHook(() => useGridConfig());

    expect(result.current.showGrid).toBe(false);
  });

  it("should dispatch setGraphConfig with updated showDecodeGrid on onChangeShowGrid", () => {
    const { result } = renderHook(() => useGridConfig());

    // Toggle grid visibility to true
    act(() => {
      result.current.handleChangeShowGrid({
        target: { checked: true },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // Check that setGraphConfig was called with correct data
    expect(setGraphConfig).toHaveBeenCalledWith({
      ...mockGraphConfig,
      showDecodeGrid: true,
    });

    // Check that dispatch was called with the action
    expect(mockDispatch).toHaveBeenCalled();
  });

  it("should dispatch setGraphConfig with updated showDecodeGrid when toggled off", () => {
    // Update mock to have showDecodeGrid as true
    const updatedMockGraphConfig = {
      ...mockGraphConfig,
      showDecodeGrid: true,
    };
    (useSelector as jest.Mock).mockImplementation(() => updatedMockGraphConfig);

    const { result } = renderHook(() => useGridConfig());

    // Toggle grid visibility to false
    act(() => {
      result.current.handleChangeShowGrid({
        target: { checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // Check that setGraphConfig was called with correct data
    expect(setGraphConfig).toHaveBeenCalledWith({
      ...updatedMockGraphConfig,
      showDecodeGrid: false,
    });

    // Check that dispatch was called with the action
    expect(mockDispatch).toHaveBeenCalled();
  });
});
