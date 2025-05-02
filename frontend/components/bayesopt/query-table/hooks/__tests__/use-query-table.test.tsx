import { renderHook } from "@testing-library/react";
import { useQueryTable } from "../use-query-table";
import { useSelector, useDispatch } from "react-redux";
import { setQueriedValues } from "../../../redux/queried-values";
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

jest.mock("../../../redux/is-dirty", () => ({
  setIsDirty: jest.fn((data) => ({
    type: "isDirty/setIsDirty",
    payload: data,
  })),
}));

describe("useQueryTable", () => {
  let mockDispatch: jest.Mock;

  // Mock data for testing
  const mockQueryData = {
    masterboxChecked: false,
    randomRegion: ["AUGC", "CGUA", "GCAU"],
    coordX: [1.0, 2.0, 3.0],
    coordY: [1.5, 2.5, 3.5],
    coordOriginalX: [1.1, 2.1, 3.1],
    coordOriginalY: [1.6, 2.6, 3.6],
    staged: [false, true, false],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch = jest.fn();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Mock the selector function to return appropriate data
      if (selector.toString().includes("queriedValues")) {
        return mockQueryData;
      }
      return null;
    });
  });

  it("should create correct dataSource from queryData", () => {
    const { result } = renderHook(() => useQueryTable());

    // Check that dataSource is created correctly
    expect(result.current.dataSource).toHaveLength(3);
    expect(result.current.dataSource[0]).toEqual({
      id: 0,
      randomRegion: "AUGC",
      coordX: 1.0,
      coordY: 1.5,
      originalCoordX: 1.1,
      originalCoordY: 1.6,
    });
    expect(result.current.dataSource[1]).toEqual({
      id: 1,
      randomRegion: "CGUA",
      coordX: 2.0,
      coordY: 2.5,
      originalCoordX: 2.1,
      originalCoordY: 2.6,
    });
  });

  it("should return correct selectedIndices based on staged values", () => {
    const { result } = renderHook(() => useQueryTable());

    // Check that selectedIndices contains only the indices of staged items
    expect(result.current.selectedIndices).toEqual([1]);
  });

  it("should handle selection changes when masterbox is checked", () => {
    const { result } = renderHook(() => useQueryTable());

    // Mock selection event with masterbox checked
    const selectionEvent = {
      selected: true,
      unselected: { 0: true, 2: true }, // Items 0 and 2 are unselected
    };

    // Call handleSelectionChange
    act(() => {
      result.current.handleSelectionChange(selectionEvent);
    });

    // Check that setQueriedValues was called with correct data
    expect(setQueriedValues).toHaveBeenCalled();
    const queriedCall = (setQueriedValues as unknown as jest.Mock).mock
      .calls[0][0];

    // Verify that masterboxChecked is true
    expect(queriedCall.masterboxChecked).toBe(true);

    // Verify that staged values are updated correctly
    // Items 0 and 2 should be false (unselected), item 1 should be true (selected)
    expect(queriedCall.staged).toEqual([false, true, false]);

    // Check that setIsDirty was called with true
    expect(setIsDirty).toHaveBeenCalledWith(true);

    // Check that dispatch was called for each action
    expect(mockDispatch).toHaveBeenCalledTimes(2);
  });

  it("should handle selection changes when masterbox is unchecked", () => {
    const { result } = renderHook(() => useQueryTable());

    // Mock selection event with masterbox unchecked
    const selectionEvent = {
      selected: { 0: true, 1: true }, // Items 0 and 1 are selected
    };

    // Call handleSelectionChange
    act(() => {
      result.current.handleSelectionChange(selectionEvent);
    });

    // Check that setQueriedValues was called with correct data
    expect(setQueriedValues).toHaveBeenCalled();
    const queriedCall = (setQueriedValues as unknown as jest.Mock).mock
      .calls[0][0];

    // Verify that masterboxChecked is false
    expect(queriedCall.masterboxChecked).toBe(false);

    // Verify that staged values are updated correctly
    // Items 0 and 1 should be true (selected), item 2 should be false (unselected)
    expect(queriedCall.staged).toEqual([true, true, false]);

    // Check that setIsDirty was called with true
    expect(setIsDirty).toHaveBeenCalledWith(true);

    // Check that dispatch was called for each action
    expect(mockDispatch).toHaveBeenCalledTimes(2);
  });

  it("should handle selection changes when all items are selected", () => {
    const { result } = renderHook(() => useQueryTable());

    // Mock selection event with masterbox checked and all items selected
    const selectionEvent = {
      selected: true,
      unselected: null, // No items are unselected
    };

    // Call handleSelectionChange
    act(() => {
      result.current.handleSelectionChange(selectionEvent);
    });

    // Check that setQueriedValues was called with correct data
    expect(setQueriedValues).toHaveBeenCalled();
    const queriedCall = (setQueriedValues as unknown as jest.Mock).mock
      .calls[0][0];

    // Verify that masterboxChecked is true
    expect(queriedCall.masterboxChecked).toBe(true);

    // Verify that all staged values are true (all selected)
    expect(queriedCall.staged).toEqual([true, true, true]);

    // Check that setIsDirty was called with true
    expect(setIsDirty).toHaveBeenCalledWith(true);

    // Check that dispatch was called for each action
    expect(mockDispatch).toHaveBeenCalledTimes(2);
  });
});
