import { renderHook } from "@testing-library/react";
import { useRegisteredTable } from "../use-registered-table";
import { useSelector, useDispatch } from "react-redux";
import { setRegisteredValues } from "../../../redux/registered-values";
import { setIsDirty } from "../../../redux/is-dirty";
import { act } from "react-dom/test-utils";

// Mock React Redux
jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

// Mock Redux actions
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

describe("useRegisteredTable", () => {
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
    sequenceIndex: [0, 0, 1, 1],
    column: ["col1", "col2", "col1", "col2"],
    value: [10, 20, 30, 40],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch = jest.fn();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Mock the selector function to return appropriate data
      if (selector.toString().includes("registeredValues")) {
        return mockRegisteredData;
      }
      return null;
    });
  });

  it("should create correct dataSource from registeredData", () => {
    const { result } = renderHook(() => useRegisteredTable());

    // Check that dataSource is created correctly
    expect(result.current.dataSource).toHaveLength(2);
    expect(result.current.dataSource[0]).toEqual({
      seq_id: "id1",
      random_region: "AUCG",
      coord_X: 1.0,
      coord_Y: 1.5,
      col1: 10,
      col2: 20,
    });
    expect(result.current.dataSource[1]).toEqual({
      seq_id: "id2",
      random_region: "GCAU",
      coord_X: 2.0,
      coord_Y: 2.5,
      col1: 30,
      col2: 40,
    });
  });

  it("should create correct displayColumns from columnNames", () => {
    const { result } = renderHook(() => useRegisteredTable());

    // Check that displayColumns is created correctly
    expect(result.current.displayColumns).toHaveLength(2);
    expect(result.current.displayColumns[0]).toEqual({
      name: "col1",
      header: "col1",
      defaultVisible: true,
    });
    expect(result.current.displayColumns[1]).toEqual({
      name: "col2",
      header: "col2",
      defaultVisible: true,
    });
  });

  it("should return correct defaultSelected based on staged values", () => {
    const { result } = renderHook(() => useRegisteredTable());

    // Check that defaultSelected contains only the indices of staged items
    expect(result.current.defaultSelected).toEqual([0]);
  });

  it("should handle edit completion for seq_id field", () => {
    const { result } = renderHook(() => useRegisteredTable());

    // Mock edit event for seq_id field
    const editEvent = {
      columnId: "seq_id",
      rowIndex: 0,
      rowId: "id1",
      columnIndex: 0,
      value: "new-id1",
    };

    // Call handleEditComplete
    act(() => {
      result.current.handleEditComplete(editEvent);
    });

    // Check that setRegisteredValues was called with correct data
    expect(setRegisteredValues).toHaveBeenCalled();
    const registeredCall = (setRegisteredValues as unknown as jest.Mock).mock
      .calls[0][0];

    // Verify that id was updated correctly
    expect(registeredCall.id[0]).toBe("new-id1");

    // Check that setIsDirty was called with true
    expect(setIsDirty).toHaveBeenCalledWith(true);

    // Check that dispatch was called for each action
    expect(mockDispatch).toHaveBeenCalledTimes(2);
  });

  it("should handle edit completion for value fields", () => {
    const { result } = renderHook(() => useRegisteredTable());
    // Mock edit event for col1 field
    const editEvent = {
      columnId: "col1",
      rowIndex: 0,
      rowId: "id1",
      columnIndex: 4, // Assuming col1 is the 5th column (after seq_id, random_region, coord_X, coord_Y)
      value: "15",
    };

    // Call handleEditComplete
    act(() => {
      result.current.handleEditComplete(editEvent);
    });

    // Check that setRegisteredValues was called with correct data
    expect(setRegisteredValues).toHaveBeenCalled();
    const registeredCall = (setRegisteredValues as unknown as jest.Mock).mock
      .calls[0][0];

    // Verify that value was updated correctly
    // The value at index 0 in the value array should be updated to 15
    expect(registeredCall.value[0]).toBe(15);

    // Check that setIsDirty was called with true
    expect(setIsDirty).toHaveBeenCalledWith(true);

    // Check that dispatch was called for each action
    expect(mockDispatch).toHaveBeenCalledTimes(2);
  });

  it("should handle selection changes when masterbox is checked", () => {
    const { result } = renderHook(() => useRegisteredTable());

    // Mock selection event with masterbox checked
    const selectionEvent = {
      selected: true,
      unselected: { id2: true }, // id2 is unselected
    };

    // Call handleSelectionChange
    act(() => {
      result.current.handleSelectionChange(selectionEvent);
    });

    // Check that setRegisteredValues was called with correct data
    expect(setRegisteredValues).toHaveBeenCalled();
    const registeredCall = (setRegisteredValues as unknown as jest.Mock).mock
      .calls[0][0];

    // Verify that masterboxChecked is true
    expect(registeredCall.masterboxChecked).toBe(true);

    // Verify that staged values are updated correctly
    // id1 should be true (selected), id2 should be false (unselected)
    expect(registeredCall.staged).toEqual([true, false]);

    // Check that setIsDirty was called with true
    expect(setIsDirty).toHaveBeenCalledWith(true);

    // Check that dispatch was called for each action
    expect(mockDispatch).toHaveBeenCalledTimes(2);
  });

  it("should handle selection changes when masterbox is unchecked", () => {
    const { result } = renderHook(() => useRegisteredTable());

    // Mock selection event with masterbox unchecked
    const selectionEvent = {
      selected: { id1: true }, // id1 is selected
    };

    // Call handleSelectionChange
    act(() => {
      result.current.handleSelectionChange(selectionEvent);
    });

    // Check that setRegisteredValues was called with correct data
    expect(setRegisteredValues).toHaveBeenCalled();
    const registeredCall = (setRegisteredValues as unknown as jest.Mock).mock
      .calls[0][0];

    // Verify that masterboxChecked is false
    expect(registeredCall.masterboxChecked).toBe(false);

    // Verify that staged values are updated correctly
    // id1 should be true (selected), id2 should be false (unselected)
    expect(registeredCall.staged).toEqual([true, false]);

    // Check that setIsDirty was called with true
    expect(setIsDirty).toHaveBeenCalledWith(true);

    // Check that dispatch was called for each action
    expect(mockDispatch).toHaveBeenCalledTimes(2);
  });

  it("should handle selection changes when all items are selected", () => {
    const { result } = renderHook(() => useRegisteredTable());

    // Mock selection event with masterbox checked and all items selected
    const selectionEvent = {
      selected: true,
      unselected: null, // No items are unselected
    };

    // Call handleSelectionChange
    act(() => {
      result.current.handleSelectionChange(selectionEvent);
    });

    // Check that setRegisteredValues was called with correct data
    expect(setRegisteredValues).toHaveBeenCalled();
    const registeredCall = (setRegisteredValues as unknown as jest.Mock).mock
      .calls[0][0];

    // Verify that masterboxChecked is true
    expect(registeredCall.masterboxChecked).toBe(true);

    // Verify that all staged values are true (all selected)
    expect(registeredCall.staged).toEqual([true, true]);

    // Check that setIsDirty was called with true
    expect(setIsDirty).toHaveBeenCalledWith(true);

    // Check that dispatch was called for each action
    expect(mockDispatch).toHaveBeenCalledTimes(2);
  });
});
