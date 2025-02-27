import { renderHook, waitFor } from "@testing-library/react";
import { useDecodedPointActions } from "../use-decoded-point-actions";
import { useDispatch } from "react-redux";
import { setDecoded } from "../../../redux/interaction-data";
import { act } from "react-dom/test-utils";

// Mock React Redux
jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
}));

// Mock Redux actions
jest.mock("../../../redux/interaction-data", () => ({
  setDecoded: jest.fn((data) => ({
    type: "interactionData/setDecoded",
    payload: data,
  })),
}));

describe("useDecodedPointActions", () => {
  let mockDispatch: jest.Mock;
  const mockGridPoint = {
    coordX: 1.5,
    coordY: 2.5,
  };
  const mockSequence = "AUGC";
  const mockDecodeData = {
    ids: ["id1", "id2"],
    coordsX: [3.5, 4.5],
    coordsY: [5.5, 6.5],
    randomRegions: ["AUCG", "GCAU"],
    shown: [true, false],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch = jest.fn();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
  });

  it("should initialize with isLoading set to false", () => {
    const { result } = renderHook(() =>
      useDecodedPointActions(mockGridPoint, mockSequence, mockDecodeData)
    );

    expect(result.current.isLoading).toBe(false);
  });

  it("should dispatch setDecoded action with updated data on onAdd", async () => {
    const { result } = renderHook(() =>
      useDecodedPointActions(mockGridPoint, mockSequence, mockDecodeData)
    );

    // Initial state
    expect(result.current.isLoading).toBe(false);

    // Call onAdd
    await act(async () => {
      await result.current.onAdd();
    });

    // Check that setDecoded was called with correct data
    expect(setDecoded).toHaveBeenCalledWith({
      ids: ["id1", "id2", "manual-2"],
      coordsX: [3.5, 4.5, 1.5],
      coordsY: [5.5, 6.5, 2.5],
      randomRegions: ["AUCG", "GCAU", "AUGC"],
      shown: [true, false, true],
    });

    // Check that dispatch was called with the action
    expect(mockDispatch).toHaveBeenCalled();
  });

  it("should set isLoading to true during onAdd and false after completion", async () => {
    const { result } = renderHook(() =>
      useDecodedPointActions(mockGridPoint, mockSequence, mockDecodeData)
    );

    // Start the onAdd operation
    let addPromise: Promise<void>;
    act(() => {
      addPromise = result.current.onAdd();
    });

    // Now check that isLoading is true during the operation
    expect(result.current.isLoading).toBe(true);

    // Wait for the operation to complete
    await act(async () => {
      await addPromise;
    });

    // Should not be loading after completion
    expect(result.current.isLoading).toBe(false);
  });

  it("should handle errors during onAdd", async () => {
    // Spy on console.error
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    // Make dispatch throw an error
    const mockError = new Error("Dispatch error");
    mockDispatch.mockImplementation(() => {
      throw mockError;
    });

    const { result } = renderHook(() =>
      useDecodedPointActions(mockGridPoint, mockSequence, mockDecodeData)
    );

    // Call onAdd
    await act(async () => {
      await result.current.onAdd();
    });

    // Check that error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error adding decoded point:",
      mockError
    );

    // Should not be loading after error
    expect(result.current.isLoading).toBe(false);

    consoleSpy.mockRestore();
  });
});
