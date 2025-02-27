import { renderHook, waitFor } from "@testing-library/react";
import { useSelector } from "react-redux";
import {
  useDecodeTableData,
  useEncodeTableData,
  useSelectedTableData,
} from "../use-tables";
import { uniq } from "lodash";

// Mock lodash uniq
jest.mock("lodash", () => ({
  uniq: jest.fn((arr) => Array.from(new Set(arr))),
}));

// Mock Redux hooks
jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
}));

describe("useDecodeTableData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should transform decoded data into table format", async () => {
    // Setup Redux store mock data
    const mockDecodedData = {
      ids: ["id1", "id2", "id3"],
      coordsX: [1.1, 2.2, 3.3],
      coordsY: [4.4, 5.5, 6.6],
      randomRegions: ["AUGU", "GCCA", "UACG"],
      shown: [true, false, true],
    };

    // Mock useSelector to return our test data
    (useSelector as jest.Mock).mockImplementation(
      (selector) => mockDecodedData
    );

    // Render the hook
    const { result } = renderHook(() => useDecodeTableData());

    // Check that the data was transformed correctly
    await waitFor(() => {
      expect(result.current.data).toEqual([
        {
          key: 0,
          id: "id1",
          coordX: 1.1,
          coordY: 4.4,
          randomRegion: "AUGU",
          isShown: true,
        },
        {
          key: 1,
          id: "id2",
          coordX: 2.2,
          coordY: 5.5,
          randomRegion: "GCCA",
          isShown: false,
        },
        {
          key: 2,
          id: "id3",
          coordX: 3.3,
          coordY: 6.6,
          randomRegion: "UACG",
          isShown: true,
        },
      ]);
    });

    // Verify that useSelector was called
    expect(useSelector).toHaveBeenCalled();
  });

  it("should handle empty decoded data", async () => {
    // Setup Redux store mock data with empty arrays
    const mockEmptyData = {
      ids: [],
      coordsX: [],
      coordsY: [],
      randomRegions: [],
      shown: [],
    };

    // Mock useSelector to return our empty test data
    (useSelector as jest.Mock).mockImplementation((selector) => mockEmptyData);

    // Render the hook
    const { result } = renderHook(() => useDecodeTableData());

    // Check that we get an empty array
    await waitFor(() => {
      expect(result.current.data).toEqual([]);
    });
  });
});

describe("useEncodeTableData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should transform encoded data into table format", async () => {
    // Setup Redux store mock data
    const mockEncodedData = {
      ids: ["id1", "id2"],
      coordsX: [1.1, 2.2],
      coordsY: [3.3, 4.4],
      randomRegions: ["AUCG", "GCAU"],
      shown: [true, false],
    };

    // Mock useSelector to return our test data
    (useSelector as jest.Mock).mockImplementation(
      (selector) => mockEncodedData
    );

    // Render the hook
    const { result } = renderHook(() => useEncodeTableData());

    // Check that the data was transformed correctly
    await waitFor(() => {
      expect(result.current.data).toEqual([
        {
          key: 0,
          id: "id1",
          randomRegion: "AUCG",
          coordX: 1.1,
          coordY: 3.3,
          isShown: true,
        },
        {
          key: 1,
          id: "id2",
          randomRegion: "GCAU",
          coordX: 2.2,
          coordY: 4.4,
          isShown: false,
        },
      ]);
    });

    // Verify that useSelector was called
    expect(useSelector).toHaveBeenCalled();
  });

  it("should handle empty encoded data", async () => {
    // Setup Redux store mock data with empty arrays
    const mockEmptyData = {
      ids: [],
      coordsX: [],
      coordsY: [],
      randomRegions: [],
      shown: [],
    };

    // Mock useSelector to return our empty test data
    (useSelector as jest.Mock).mockImplementation((selector) => mockEmptyData);

    // Render the hook
    const { result } = renderHook(() => useEncodeTableData());

    // Check that we get an empty array
    await waitFor(() => {
      expect(result.current.data).toEqual([]);
    });
  });
});

describe("useSelectedTableData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should transform selected points into table format and compute unique hues", async () => {
    // Setup Redux store mock data
    const mockSelectedPoints = {
      ids: ["id1", "id2", "id3"],
      series: ["hue1", "hue2", "hue1"], // Intentionally repeating hue1 to test uniq
      coordsX: [1.1, 2.2, 3.3],
      coordsY: [4.4, 5.5, 6.6],
      randomRegions: ["AUGU", "GCCA", "UACG"],
      duplicates: [0, 1, 2],
    };

    // Mock useSelector to return our test data
    (useSelector as jest.Mock).mockImplementation(
      (selector) => mockSelectedPoints
    );

    // Render the hook
    const { result } = renderHook(() => useSelectedTableData());

    // Check that the data was transformed correctly
    await waitFor(() => {
      expect(result.current.data).toEqual([
        {
          index: 0,
          id: "id1",
          hue: "hue1",
          coordX: 1.1,
          coordY: 4.4,
          randomRegion: "AUGU",
          duplicates: 0,
        },
        {
          index: 1,
          id: "id2",
          hue: "hue2",
          coordX: 2.2,
          coordY: 5.5,
          randomRegion: "GCCA",
          duplicates: 1,
        },
        {
          index: 2,
          id: "id3",
          hue: "hue1",
          coordX: 3.3,
          coordY: 6.6,
          randomRegion: "UACG",
          duplicates: 2,
        },
      ]);
    });

    // Verify that uniq was called with the right parameters
    expect(uniq).toHaveBeenCalledWith(["hue1", "hue2", "hue1"]);

    // Check that the hues were uniquified
    await waitFor(() => {
      expect(result.current.hues).toEqual(["hue1", "hue2"]);
    });

    // Verify that useSelector was called
    expect(useSelector).toHaveBeenCalled();
  });

  it("should handle empty selected points data", async () => {
    // Setup Redux store mock data with empty arrays
    const mockEmptyData = {
      ids: [],
      series: [],
      coordsX: [],
      coordsY: [],
      randomRegions: [],
      duplicates: [],
    };

    // Mock useSelector to return our empty test data
    (useSelector as jest.Mock).mockImplementation((selector) => mockEmptyData);

    // Render the hook
    const { result } = renderHook(() => useSelectedTableData());

    // Check that we get an empty array
    await waitFor(() => {
      expect(result.current.data).toEqual([]);
      expect(result.current.hues).toEqual([]);
    });

    // Verify uniq was called with an empty array
    expect(uniq).toHaveBeenCalledWith([]);
  });
});
