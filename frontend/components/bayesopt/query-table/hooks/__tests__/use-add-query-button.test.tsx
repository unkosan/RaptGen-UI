import { renderHook } from "@testing-library/react";
import { useAddQueryButton } from "../use-add-query-button";
import { useSelector, useDispatch } from "react-redux";
import { setQueriedValues } from "../../../redux/queried-values";
import { setRegisteredValues } from "../../../redux/registered-values";
import { setIsDirty } from "../../../redux/is-dirty";
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

jest.mock("../../../redux/registered-values", () => ({
  setRegisteredValues: jest.fn((data) => ({
    type: "registeredValues/setRegisteredValues",
    payload: data,
  })),
}));

jest.mock("../../../redux/is-dirty", () => ({
  setIsDirty: jest.fn((data) => ({
    type: "isDirty/setIsDirty",
    payload: data,
  })),
}));

describe("useAddQueryButton", () => {
  let mockDispatch: jest.Mock;

  // Mock data for testing
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
    randomRegion: ["AUGC", "CGUA"],
    coordX: [3.0, 4.0],
    coordY: [3.5, 4.5],
    coordOriginalX: [3.1, 4.1],
    coordOriginalY: [3.6, 4.6],
    staged: [true, false],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch = jest.fn();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Mock the selector function to return appropriate data
      if (selector.toString().includes("registeredValues")) {
        return mockRegisteredData;
      } else if (selector.toString().includes("queriedValues")) {
        return mockQueryData;
      }
      return null;
    });
  });

  it("should initialize with isLoading set to false", () => {
    const { result } = renderHook(() => useAddQueryButton());
    expect(result.current.isLoading).toBe(false);
  });

  it("should move staged items from query data to registered data on handleClick", () => {
    const { result } = renderHook(() => useAddQueryButton());

    // Call handleClick
    act(() => {
      result.current.handleClick();
    });

    // Check that setRegisteredValues was called with correct data
    expect(setRegisteredValues).toHaveBeenCalled();
    const registeredCall = (setRegisteredValues as unknown as jest.Mock).mock
      .calls[0][0];

    // Verify that the first item from query data was moved to registered data
    expect(registeredCall.id).toContain("untitled -- 2");
    expect(registeredCall.randomRegion).toContain("AUGC");
    expect(registeredCall.coordX).toContain(3.0);
    expect(registeredCall.coordY).toContain(3.5);

    // Check that setQueriedValues was called with correct data
    expect(setQueriedValues).toHaveBeenCalled();
    const queriedCall = (setQueriedValues as unknown as jest.Mock).mock
      .calls[0][0];

    // Verify that only the second item remains in query data
    expect(queriedCall.randomRegion).toEqual(["CGUA"]);
    expect(queriedCall.coordX).toEqual([4.0]);
    expect(queriedCall.coordY).toEqual([4.5]);
    expect(queriedCall.coordOriginalX).toEqual([4.1]);
    expect(queriedCall.coordOriginalY).toEqual([4.6]);

    // Check that setIsDirty was called with true
    expect(setIsDirty).toHaveBeenCalledWith(true);

    // Check that dispatch was called for each action
    expect(mockDispatch).toHaveBeenCalledTimes(3);
  });

  it("should set isLoading to true during handleClick and false after completion", () => {
    const { result } = renderHook(() => useAddQueryButton());

    // Call handleClick
    act(() => {
      result.current.handleClick();
    });

    // Should not be loading after completion
    expect(result.current.isLoading).toBe(false);
  });

  it("should handle the case when no items are staged", () => {
    // Mock query data with no staged items
    const noStagedQueryData = {
      ...mockQueryData,
      staged: [false, false],
    };

    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector.toString().includes("registeredValues")) {
        return mockRegisteredData;
      } else if (selector.toString().includes("queriedValues")) {
        return noStagedQueryData;
      }
      return null;
    });

    const { result } = renderHook(() => useAddQueryButton());

    // Call handleClick
    act(() => {
      result.current.handleClick();
    });

    // Check that setRegisteredValues was called with the original data
    expect(setRegisteredValues).toHaveBeenCalled();
    const registeredCall = (setRegisteredValues as unknown as jest.Mock).mock
      .calls[0][0];

    // Verify that no items were added to registered data
    expect(registeredCall.id).toEqual(mockRegisteredData.id);
    expect(registeredCall.randomRegion).toEqual(
      mockRegisteredData.randomRegion
    );

    // Check that setQueriedValues was called with all items remaining
    expect(setQueriedValues).toHaveBeenCalled();
    const queriedCall = (setQueriedValues as unknown as jest.Mock).mock
      .calls[0][0];

    // Verify that both items remain in query data
    expect(queriedCall.randomRegion).toEqual(["AUGC", "CGUA"]);
    expect(queriedCall.coordX).toEqual([3.0, 4.0]);
  });
});
