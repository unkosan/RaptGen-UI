import { renderHook, waitFor } from "@testing-library/react";
import { useDispatch, useSelector } from "react-redux";
import {
  useTextInputWithValidation,
  useCoordXEditor,
  useCoordYEditor,
  useIdEditor,
  useSequenceEditor,
} from "../use-editors";
import { apiClient } from "~/services/api-client";
import { setDecoded, setEncoded } from "../../../redux/interaction-data";
import { act } from "react-dom/test-utils";

// Mock React Redux
jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

// Mock API client
jest.mock("~/services/api-client", () => ({
  apiClient: {
    decode: jest.fn(),
    encode: jest.fn(),
  },
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

describe("useTextInputWithValidation", () => {
  it("should initialize with the provided value", () => {
    const initialValue = "test";
    const { result } = renderHook(() =>
      useTextInputWithValidation(initialValue)
    );

    expect(result.current.value).toBe(initialValue);
    expect(result.current.valid).toBe(true);
  });

  it("should update value and validate on change", () => {
    const initialValue = "";
    const validator = (value: string) => value.length > 3;

    const { result } = renderHook(() =>
      useTextInputWithValidation(initialValue, validator)
    );

    // Initial state
    expect(result.current.value).toBe(initialValue);
    expect(result.current.valid).toBe(false); // Empty string is not valid

    // Simulate input change with invalid value
    act(() => {
      const mockEvent = {
        target: { value: "ab" },
      } as React.ChangeEvent<HTMLInputElement>;

      result.current.onChange(mockEvent);
    });

    expect(result.current.value).toBe("ab");
    expect(result.current.valid).toBe(false);

    // Simulate input change with valid value
    act(() => {
      const mockEvent = {
        target: { value: "abcd" },
      } as React.ChangeEvent<HTMLInputElement>;

      result.current.onChange(mockEvent);
    });

    expect(result.current.value).toBe("abcd");
    expect(result.current.valid).toBe(true);
  });

  it("should allow direct value and validity setting", () => {
    const initialValue = "test";

    const { result } = renderHook(() =>
      useTextInputWithValidation(initialValue)
    );

    act(() => {
      result.current.setValue("new value");
      result.current.setValid(false);
    });

    expect(result.current.value).toBe("new value");
    expect(result.current.valid).toBe(false);
  });
});

describe("useCoordXEditor", () => {
  let mockDispatch: jest.Mock;
  const mockCellProps = {
    data: {
      key: 1,
      coordX: "2.5",
      coordY: "3.5",
    },
  };
  const mockOnComplete = jest.fn();
  const mockOnCancel = jest.fn();

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
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Return different values based on the selector function
      if (selector.toString().includes("sessionConfig")) {
        return "test-session-id";
      }
      return mockDecodeData;
    });

    (apiClient.decode as jest.Mock).mockResolvedValue({
      sequences: ["UPDATED-SEQUENCE"],
    });
  });

  it("should initialize with cell props data", () => {
    const { result } = renderHook(() =>
      useCoordXEditor(mockCellProps, mockOnComplete, mockOnCancel)
    );

    expect(result.current.valueX).toBe("2.5");
    expect(result.current.valid).toBe(true);
    expect(result.current.onCancel).toBe(mockOnCancel);
  });

  it("should validate numerical input", () => {
    const { result } = renderHook(() =>
      useCoordXEditor(mockCellProps, mockOnComplete, mockOnCancel)
    );

    // Simulate change to non-numeric value
    act(() => {
      const mockEvent = {
        target: { value: "not-a-number" },
      } as React.ChangeEvent<HTMLInputElement>;

      result.current.onChange(mockEvent);
    });

    expect(result.current.valueX).toBe("not-a-number");
    expect(result.current.valid).toBe(false);

    // Simulate change to valid value
    act(() => {
      const mockEvent = {
        target: { value: "4.2" },
      } as React.ChangeEvent<HTMLInputElement>;

      result.current.onChange(mockEvent);
    });

    expect(result.current.valueX).toBe("4.2");
    expect(result.current.valid).toBe(true);
  });

  it("should update decoded data on confirm click", async () => {
    const { result } = renderHook(() =>
      useCoordXEditor(mockCellProps, mockOnComplete, mockOnCancel)
    );

    // Simulate change to new value
    act(() => {
      const mockEvent = {
        target: { value: "7.5" },
      } as React.ChangeEvent<HTMLInputElement>;

      result.current.onChange(mockEvent);
    });

    // Confirm the edit
    await act(async () => {
      await result.current.onConfirmClick();
    });

    // Check that API was called correctly
    expect(apiClient.decode).toHaveBeenCalledWith({
      session_uuid: "test-session-id",
      coords_x: [7.5],
      coords_y: [3.5],
    });

    // Check that the Redux action was dispatched
    expect(setDecoded).toHaveBeenCalledWith({
      ...mockDecodeData,
      coordsX: [1.1, 7.5, 3.3], // index 1 updated to 7.5
      coordsY: [4.4, 3.5, 6.6], // index 1 updated to 3.5
      randomRegions: [
        "AUGU",
        "UPDATED-SEQUENCE", // Updated with API response value
        "UACG",
      ],
    });

    // Check that onComplete was called
    expect(mockOnComplete).toHaveBeenCalled();
  });
});

describe("useCoordYEditor", () => {
  let mockDispatch: jest.Mock;
  const mockCellProps = {
    data: {
      key: 1,
      coordX: "2.5",
      coordY: "3.5",
    },
  };
  const mockOnComplete = jest.fn();
  const mockOnCancel = jest.fn();

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
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector.toString().includes("sessionConfig")) {
        return "test-session-id";
      }
      return mockDecodeData;
    });

    (apiClient.decode as jest.Mock).mockResolvedValue({
      sequences: ["UPDATED-SEQUENCE"],
    });
  });

  it("should initialize with cell props data", () => {
    const { result } = renderHook(() =>
      useCoordYEditor(mockCellProps, mockOnComplete, mockOnCancel)
    );

    expect(result.current.valueY).toBe("3.5");
    expect(result.current.valid).toBe(true);
    expect(result.current.onCancel).toBe(mockOnCancel);
  });

  it("should update decoded data on confirm click", async () => {
    const { result } = renderHook(() =>
      useCoordYEditor(mockCellProps, mockOnComplete, mockOnCancel)
    );

    // Simulate change to new value
    act(() => {
      const mockEvent = {
        target: { value: "8.5" },
      } as React.ChangeEvent<HTMLInputElement>;

      result.current.onChange(mockEvent);
    });

    // Confirm the edit
    await act(async () => {
      await result.current.onConfirmClick();
    });

    // Check that API was called correctly
    expect(apiClient.decode).toHaveBeenCalledWith({
      session_uuid: "test-session-id",
      coords_x: [2.5],
      coords_y: [8.5],
    });

    // Check that the Redux action was dispatched
    expect(setDecoded).toHaveBeenCalledWith({
      ...mockDecodeData,
      coordsX: [1.1, 2.5, 3.3], // index 1 updated to 2.5
      coordsY: [4.4, 8.5, 6.6], // index 1 updated to 8.5
      randomRegions: [
        "AUGU",
        "UPDATED-SEQUENCE", // Updated with API response value
        "UACG",
      ],
    });

    // Check that onComplete was called
    expect(mockOnComplete).toHaveBeenCalled();
  });
});

describe("useIdEditor", () => {
  let mockDispatch: jest.Mock;
  const mockCellProps = {
    data: {
      key: 1,
      id: "old-id",
    },
  };
  const mockValue = "old-id";
  const mockOnComplete = jest.fn();
  const mockOnCancel = jest.fn();

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
    (useSelector as jest.Mock).mockReturnValue(mockEncodeData);
  });

  it("should initialize with provided value", () => {
    const { result } = renderHook(() =>
      useIdEditor(mockCellProps, mockValue, mockOnComplete, mockOnCancel)
    );

    expect(result.current.value).toBe(mockValue);
    expect(result.current.valid).toBe(true);
  });

  it("should validate that ID is not empty", () => {
    const { result } = renderHook(() =>
      useIdEditor(mockCellProps, mockValue, mockOnComplete, mockOnCancel)
    );

    // Simulate change to empty value
    act(() => {
      const mockEvent = {
        target: { value: "" },
      } as React.ChangeEvent<HTMLInputElement>;

      result.current.onChange(mockEvent);
    });

    expect(result.current.value).toBe("");
    expect(result.current.valid).toBe(false);
  });

  it("should update encoded data on confirm click", async () => {
    const { result } = renderHook(() =>
      useIdEditor(mockCellProps, mockValue, mockOnComplete, mockOnCancel)
    );

    // Simulate change to new value
    act(() => {
      const mockEvent = {
        target: { value: "new-id" },
      } as React.ChangeEvent<HTMLInputElement>;

      result.current.onChange(mockEvent);
    });

    // Confirm the edit
    await act(async () => {
      await result.current.onConfirmClick();
    });

    // Check that the Redux action was dispatched with updated ID
    expect(setEncoded).toHaveBeenCalledWith({
      ids: ["id1", "new-id", "id3"], // index 1 updated to new-id
      coordsX: mockEncodeData.coordsX,
      coordsY: mockEncodeData.coordsY,
      randomRegions: mockEncodeData.randomRegions,
      shown: mockEncodeData.shown,
    });

    // Check that onComplete was called
    expect(mockOnComplete).toHaveBeenCalled();
  });
});

describe("useSequenceEditor", () => {
  let mockDispatch: jest.Mock;
  const mockCellProps = {
    data: {
      key: 1,
      randomRegion: "AUCG",
    },
  };
  const mockValue = "AUCG";
  const mockOnComplete = jest.fn();
  const mockOnCancel = jest.fn();

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
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector.toString().includes("sessionConfig")) {
        return "test-session-id";
      }
      return mockEncodeData;
    });

    (apiClient.encode as jest.Mock).mockResolvedValue({
      coords_x: [9.9],
      coords_y: [8.8],
    });
  });

  it("should initialize with provided value", () => {
    const { result } = renderHook(() =>
      useSequenceEditor(mockCellProps, mockValue, mockOnComplete, mockOnCancel)
    );

    expect(result.current.value).toBe(mockValue);
    expect(result.current.valid).toBe(true);
  });

  it("should validate sequence format", () => {
    const { result } = renderHook(() =>
      useSequenceEditor(mockCellProps, mockValue, mockOnComplete, mockOnCancel)
    );

    // Simulate change to invalid value
    act(() => {
      const mockEvent = {
        target: { value: "INVALID123" },
      } as React.ChangeEvent<HTMLInputElement>;

      result.current.onChange(mockEvent);
    });

    expect(result.current.value).toBe("INVALID123");
    expect(result.current.valid).toBe(false);

    // Simulate change to valid value
    act(() => {
      const mockEvent = {
        target: { value: "ATGCU" },
      } as React.ChangeEvent<HTMLInputElement>;

      result.current.onChange(mockEvent);
    });

    // Should convert T to U
    expect(result.current.value).toBe("AUGCU");
    expect(result.current.valid).toBe(true);
  });

  it("should update encoded data on confirm click", async () => {
    const { result } = renderHook(() =>
      useSequenceEditor(mockCellProps, mockValue, mockOnComplete, mockOnCancel)
    );

    // Simulate change to new value
    act(() => {
      const mockEvent = {
        target: { value: "AUGCUA" },
      } as React.ChangeEvent<HTMLInputElement>;

      result.current.onChange(mockEvent);
    });

    // Confirm the edit
    await act(async () => {
      await result.current.onConfirmClick();
    });

    // Check that API was called correctly
    expect(apiClient.encode).toHaveBeenCalledWith({
      session_uuid: "test-session-id",
      sequences: ["AUGCUA"],
    });

    // Check that the Redux action was dispatched
    expect(setEncoded).toHaveBeenCalledWith({
      ...mockEncodeData,
      coordsX: [1.1, 9.9, 3.3], // index 1 updated to API response
      coordsY: [4.4, 8.8, 6.6], // index 1 updated to API response
      randomRegions: ["AUCG", "AUGCUA", "UAGC"], // index 1 updated to new sequence
    });

    // Check that onComplete was called
    expect(mockOnComplete).toHaveBeenCalled();
  });
});
