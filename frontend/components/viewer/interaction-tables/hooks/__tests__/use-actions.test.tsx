import { renderHook } from "@testing-library/react";
import { useDispatch, useSelector } from "react-redux";
import { useDecoderActions, useEncoderActions } from "../use-actions";
import { setDecoded, setEncoded } from "../../../redux/interaction-data";
import { act } from "react-dom/test-utils";

// Mock Redux hooks
jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

// Mock Redux actions
jest.mock("../../../redux/interaction-data", () => ({
  setDecoded: jest.fn((data) => ({
    type: "interactionData/setDecoded",
    payload: data,
  })),
  setEncoded: jest.fn((data) => ({
    type: "interactionData/setEncoded",
    payload: data,
  })),
}));

describe("useDecoderActions", () => {
  let mockDispatch: jest.Mock;
  const testIndex = 1;

  const mockDecodeData = {
    ids: ["id1", "id2", "id3"],
    coordsX: [1.1, 2.2, 3.3],
    coordsY: [4.4, 5.5, 6.6],
    randomRegions: ["AUGU", "GCCA", "UACG"],
    shown: [true, false, true],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch = jest.fn();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useSelector as jest.Mock).mockImplementation((selector) => mockDecodeData);
  });

  it("should provide onClickShow and onClickDelete functions", () => {
    const { result } = renderHook(() => useDecoderActions(testIndex));

    expect(typeof result.current.handleClickShow).toBe("function");
    expect(typeof result.current.handleClickDelete).toBe("function");
  });

  it("should toggle visibility on onClickShow", async () => {
    const { result } = renderHook(() => useDecoderActions(testIndex));

    await act(async () => {
      await result.current.handleClickShow();
    });

    // The visibility should be toggled for the specific index (in this case, index 1 was false, should become true)
    const expectedNewShown = [true, true, true];

    expect(setDecoded).toHaveBeenCalledWith({
      ...mockDecodeData,
      shown: expectedNewShown,
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: "interactionData/setDecoded",
      payload: {
        ...mockDecodeData,
        shown: expectedNewShown,
      },
    });
  });

  it("should filter out item at index on onClickDelete", async () => {
    const { result } = renderHook(() => useDecoderActions(testIndex));

    await act(async () => {
      await result.current.handleClickDelete();
    });

    // All arrays should have the item at testIndex removed
    const expectedData = {
      ids: ["id1", "id3"],
      coordsX: [1.1, 3.3],
      coordsY: [4.4, 6.6],
      randomRegions: ["AUGU", "UACG"],
      shown: [true, true],
    };

    expect(setDecoded).toHaveBeenCalledWith(expectedData);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: "interactionData/setDecoded",
      payload: expectedData,
    });
  });
});

describe("useEncoderActions", () => {
  let mockDispatch: jest.Mock;
  const testIndex = 1;

  const mockEncodeData = {
    ids: ["id1", "id2", "id3"],
    coordsX: [1.1, 2.2, 3.3],
    coordsY: [4.4, 5.5, 6.6],
    randomRegions: ["AUCG", "GCAU", "UAGC"],
    shown: [true, false, true],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch = jest.fn();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useSelector as jest.Mock).mockImplementation((selector) => mockEncodeData);
  });

  it("should provide onClickShow and onClickDelete functions", () => {
    const { result } = renderHook(() => useEncoderActions(testIndex));

    expect(typeof result.current.handleClickShow).toBe("function");
    expect(typeof result.current.handleClickDelete).toBe("function");
  });

  it("should toggle visibility on onClickShow", async () => {
    const { result } = renderHook(() => useEncoderActions(testIndex));

    await act(async () => {
      await result.current.handleClickShow();
    });

    // The visibility should be toggled for the specific index (in this case, index 1 was false, should become true)
    const expectedNewShown = [true, true, true];

    expect(setEncoded).toHaveBeenCalledWith({
      ...mockEncodeData,
      shown: expectedNewShown,
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: "interactionData/setEncoded",
      payload: {
        ...mockEncodeData,
        shown: expectedNewShown,
      },
    });
  });

  it("should filter out item at index on onClickDelete", async () => {
    const { result } = renderHook(() => useEncoderActions(testIndex));

    await act(async () => {
      await result.current.handleClickDelete();
    });

    // All arrays should have the item at testIndex removed
    const expectedData = {
      ids: ["id1", "id3"],
      coordsX: [1.1, 3.3],
      coordsY: [4.4, 6.6],
      randomRegions: ["AUCG", "UAGC"],
      shown: [true, true],
    };

    expect(setEncoded).toHaveBeenCalledWith(expectedData);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: "interactionData/setEncoded",
      payload: expectedData,
    });
  });
});

describe("actionButtonStyles", () => {
  // Testing that the exports are available
  it("should export actionButtonStyles object", () => {
    // Import directly to test the export
    const { actionButtonStyles } = require("../use-actions");

    expect(actionButtonStyles).toBeDefined();
    expect(actionButtonStyles.shown).toBeDefined();
    expect(actionButtonStyles.notShown).toBeDefined();
    expect(actionButtonStyles.delete).toBeDefined();
  });
});
