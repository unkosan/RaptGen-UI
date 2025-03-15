import { renderHook, waitFor } from "@testing-library/react";
import {
  useVaePlotData,
  useRegisteredDataPlots,
  useQueryDataPlot,
  useAcquisitionDataPlot,
} from "../use-latent-space-plots";
import { useSelector } from "react-redux";
import { apiClient } from "~/services/api-client";

// Mock React Redux
jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
}));

// Mock API client
jest.mock("~/services/api-client", () => ({
  apiClient: {
    getSelexData: jest.fn(),
  },
}));

describe("Latent Space Plot Hooks", () => {
  // Mock data for testing
  const mockSelexData = {
    duplicates: [5, 10, 3, 2],
    coord_x: [1.0, 2.0, 3.0, 4.0],
    coord_y: [1.5, 2.5, 3.5, 4.5],
    random_regions: ["AUCG", "GCAU", "AUGC", "CGUA"],
  };

  const mockRegisteredValues = {
    id: ["id1", "id2", "id3", "id4"],
    randomRegion: ["AUCG", "GCAU", "AUGC", "CGUA"],
    coordX: [1.0, 2.0, 3.0, 4.0],
    coordY: [1.5, 2.5, 3.5, 4.5],
    staged: [true, false, true, false],
    masterboxChecked: true,
    columnNames: ["col1", "col2"],
    sequenceIndex: [0, 0, 1, 1],
    column: ["col1", "col2", "col1", "col2"],
    value: [10, 20, 30, 40],
  };

  const mockQueriedValues = {
    masterboxChecked: true,
    randomRegion: ["AUGC", "CGUA"],
    coordX: [3.0, 4.0],
    coordY: [3.5, 4.5],
    coordOriginalX: [3.1, 4.1],
    coordOriginalY: [3.6, 4.6],
    staged: [true, false],
  };

  const mockAcquisitionValues = {
    acquisitionValues: [0.1, 0.2, 0.3, 0.4],
    coordX: [1.0, 2.0, 3.0, 4.0],
    coordY: [1.5, 2.5, 3.5, 4.5],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock API responses
    (apiClient.getSelexData as jest.Mock).mockResolvedValue(mockSelexData);
  });

  describe("useVaePlotData", () => {
    it("should fetch SELEX data on mount", async () => {
      renderHook(() => useVaePlotData(true, "vae-id", 5));

      // Wait for the useEffect to run
      await waitFor(() => {
        expect(apiClient.getSelexData).toHaveBeenCalledWith({
          queries: {
            vae_uuid: "vae-id",
          },
        });
      });
    });

    it("should not fetch SELEX data when vaeId is empty", async () => {
      renderHook(() => useVaePlotData(true, "", 5));

      // Check that getSelexData was not called
      expect(apiClient.getSelexData).not.toHaveBeenCalled();
    });

    it("should filter data based on minCount", async () => {
      const { result } = renderHook(() => useVaePlotData(true, "vae-id", 5));

      // Wait for the useEffect to run
      await waitFor(() => {
        expect(apiClient.getSelexData).toHaveBeenCalled();
      });

      // Check that data is filtered correctly
      expect(result.current.vaeDataPlot.x).toEqual([1.0, 2.0]);
      expect(result.current.vaeDataPlot.y).toEqual([1.5, 2.5]);
    });

    it("should return empty plot when showVAE is false", async () => {
      const { result } = renderHook(() => useVaePlotData(false, "vae-id", 5));

      // Wait for the useEffect to run
      await waitFor(() => {
        expect(apiClient.getSelexData).toHaveBeenCalled();
      });

      // Check that plot is empty
      expect(result.current.vaeDataPlot).toEqual({});
    });

    it("should handle API errors gracefully", async () => {
      // Mock API error
      const mockError = new Error("API error");
      (apiClient.getSelexData as jest.Mock).mockRejectedValue(mockError);

      // Spy on console.error
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      renderHook(() => useVaePlotData(true, "vae-id", 5));

      // Wait for the useEffect to run
      await waitFor(() => {
        expect(apiClient.getSelexData).toHaveBeenCalled();
      });

      // Check that error was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error fetching SELEX data:",
        mockError
      );

      consoleSpy.mockRestore();
    });
  });

  describe("useRegisteredDataPlots", () => {
    beforeEach(() => {
      // Mock Redux selectors
      (useSelector as jest.Mock).mockImplementation((selector) => {
        if (selector.toString().includes("registeredValues")) {
          return mockRegisteredValues;
        }
        return null;
      });
    });

    it("should create registered data plot", () => {
      const { result } = renderHook(() => useRegisteredDataPlots());

      // Check that registered data plot is created correctly
      expect(result.current.registeredDataPlot.name).toBe("Registered");
      expect(result.current.registeredDataPlot.x).toEqual([1.0, 3.0]);
      expect(result.current.registeredDataPlot.y).toEqual([1.5, 3.5]);
      expect(result.current.registeredDataPlot.customdata).toEqual([
        ["id1", "AUCG"],
        ["id3", "AUGC"],
      ]);
    });

    it("should create unregistered data plot", () => {
      const { result } = renderHook(() => useRegisteredDataPlots());

      // Check that unregistered data plot is created correctly
      expect(result.current.unregisteredDataPlot.name).toBe("Unregistered");
      expect(result.current.unregisteredDataPlot.x).toEqual([2.0, 4.0]);
      expect(result.current.unregisteredDataPlot.y).toEqual([2.5, 4.5]);
      expect(result.current.unregisteredDataPlot.customdata).toEqual([
        ["id2", "GCAU"],
        ["id4", "CGUA"],
      ]);
    });
  });

  describe("useQueryDataPlot", () => {
    beforeEach(() => {
      // Mock Redux selectors
      (useSelector as jest.Mock).mockImplementation((selector) => {
        if (selector.toString().includes("queriedValues")) {
          return mockQueriedValues;
        }
        return null;
      });
    });

    it("should create query data plot", () => {
      const { result } = renderHook(() => useQueryDataPlot());

      // Check that query data plot is created correctly
      expect(result.current.queryDataPlot.name).toBe("Query");
      expect(result.current.queryDataPlot.x).toEqual([3.0, 4.0]);
      expect(result.current.queryDataPlot.y).toEqual([3.5, 4.5]);
      expect(result.current.queryDataPlot.customdata).toEqual([
        ["AUGC"],
        ["CGUA"],
      ]);
    });
  });

  describe("useAcquisitionDataPlot", () => {
    beforeEach(() => {
      // Mock Redux selectors
      (useSelector as jest.Mock).mockImplementation((selector) => {
        if (selector.toString().includes("acquisitionValues")) {
          return mockAcquisitionValues;
        }
        return null;
      });
    });

    it("should create acquisition data plot when showAcquisition is true", () => {
      const { result } = renderHook(() => useAcquisitionDataPlot(true));

      // Check that acquisition data plot is created correctly
      expect(result.current.acquisitionDataPlot.name).toBe("Acquisition");
      expect(result.current.acquisitionDataPlot.type).toBe("contour");
      expect(result.current.acquisitionDataPlot.x).toEqual([
        1.0, 2.0, 3.0, 4.0,
      ]);
      expect(result.current.acquisitionDataPlot.y).toEqual([
        1.5, 2.5, 3.5, 4.5,
      ]);
      expect(result.current.acquisitionDataPlot.z).toEqual([
        0.1, 0.2, 0.3, 0.4,
      ]);
    });

    it("should return empty plot when showAcquisition is false", () => {
      const { result } = renderHook(() => useAcquisitionDataPlot(false));

      // Check that plot is empty
      expect(result.current.acquisitionDataPlot).toEqual({});
    });
  });
});
