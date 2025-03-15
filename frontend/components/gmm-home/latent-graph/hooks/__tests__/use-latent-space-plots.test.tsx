import { renderHook } from "@testing-library/react";
import { useVaeDataPlot, useGmmDataPlot } from "../use-latent-space-plots";
import { calculateGMMRings } from "~/components/common/graph-helper";

// Mock the graph-helper
jest.mock("~/components/common/graph-helper", () => ({
  calculateGMMRings: jest.fn(),
}));

describe("useVaeDataPlot", () => {
  const mockVaeData = {
    coordsX: [0.1, 0.2, 0.3, 0.4, 0.5],
    coordsY: [0.1, 0.2, 0.3, 0.4, 0.5],
    randomRegions: ["AUCG", "GCAU", "UAGC", "CGUA", "ACGU"],
    duplicates: [1, 3, 5, 7, 10],
  };

  it("should filter data based on minCount", () => {
    // Set minCount to 5, which should filter out the first two points
    const { result } = renderHook(() => useVaeDataPlot(mockVaeData, 5));

    expect(result.current.vaeDataPlot.x).toEqual([0.3, 0.4, 0.5]);
    expect(result.current.vaeDataPlot.y).toEqual([0.3, 0.4, 0.5]);
    expect(result.current.vaeDataPlot.customdata).toEqual([
      "UAGC",
      "CGUA",
      "ACGU",
    ]);
  });

  it("should include all data when minCount is 1", () => {
    const { result } = renderHook(() => useVaeDataPlot(mockVaeData, 1));

    expect(result.current.vaeDataPlot.x).toEqual(mockVaeData.coordsX);
    expect(result.current.vaeDataPlot.y).toEqual(mockVaeData.coordsY);
    expect(result.current.vaeDataPlot.customdata).toEqual(
      mockVaeData.randomRegions
    );
  });

  it("should set marker size based on duplicates", () => {
    const { result } = renderHook(() => useVaeDataPlot(mockVaeData, 1));

    // Marker size should be Math.max(2, Math.sqrt(d))
    expect(result.current.vaeDataPlot.marker?.size).toEqual([
      2, // Math.max(2, Math.sqrt(1))
      2, // Math.max(2, Math.sqrt(3))
      Math.sqrt(5),
      Math.sqrt(7),
      Math.sqrt(10),
    ]);
  });

  it("should set correct plot properties", () => {
    const { result } = renderHook(() => useVaeDataPlot(mockVaeData, 1));

    expect(result.current.vaeDataPlot.type).toBe("scatter");
    expect(result.current.vaeDataPlot.mode).toBe("markers");
    expect(result.current.vaeDataPlot.name).toBe("SELEX");
    expect(result.current.vaeDataPlot.marker?.color).toBe("silver");
    expect(result.current.vaeDataPlot.marker?.opacity).toBe(0.5);
  });
});

describe("useGmmDataPlot", () => {
  const mockGmmData = {
    means: [
      [0.1, 0.2],
      [0.3, 0.4],
    ],
    covariances: [
      [
        [0.01, 0],
        [0, 0.01],
      ],
      [
        [0.02, 0],
        [0, 0.02],
      ],
    ],
    weights: [0.5, 0.5],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the calculateGMMRings function to return a simple ring
    (calculateGMMRings as jest.Mock).mockImplementation((mean, cov) => {
      // Return a simple circle around the mean
      const radius = Math.sqrt(cov[0][0] + cov[1][1]);
      const points = [];
      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * 2 * Math.PI;
        points.push([
          mean[0] + radius * Math.cos(angle),
          mean[1] + radius * Math.sin(angle),
        ]);
      }
      return points;
    });
  });

  it("should return empty array when means is empty", () => {
    const { result } = renderHook(() =>
      useGmmDataPlot({ means: [], covariances: [] })
    );

    expect(result.current.gmmDataPlot).toEqual([]);
  });

  it("should create plot data for each GMM component", () => {
    const { result } = renderHook(() => useGmmDataPlot(mockGmmData));

    // Should have 2 components * 2 plots (line and label) = 4 plots
    expect(result.current.gmmDataPlot.length).toBe(4);
  });

  it("should set correct properties for GMM ring plots", () => {
    const { result } = renderHook(() => useGmmDataPlot(mockGmmData));

    // Check the first ring plot (index 0)
    expect(result.current.gmmDataPlot[0].name).toBe("MoG No.0");
    expect(result.current.gmmDataPlot[0].showlegend).toBe(false);
    expect(result.current.gmmDataPlot[0].type).toBe("scatter");
    expect(result.current.gmmDataPlot[0].mode).toBe("lines");
    expect(result.current.gmmDataPlot[0].line?.color).toBe("black");

    // Check the second ring plot (index 2)
    expect(result.current.gmmDataPlot[2].name).toBe("MoG No.1");
    expect(result.current.gmmDataPlot[2].showlegend).toBe(false);
    expect(result.current.gmmDataPlot[2].type).toBe("scatter");
    expect(result.current.gmmDataPlot[2].mode).toBe("lines");
    expect(result.current.gmmDataPlot[2].line?.color).toBe("black");
  });

  it("should set correct properties for GMM label plots", () => {
    const { result } = renderHook(() => useGmmDataPlot(mockGmmData));

    // Check the first label plot (index 1)
    expect(result.current.gmmDataPlot[1].name).toBe("MoG No.0");
    expect(result.current.gmmDataPlot[1].showlegend).toBe(false);
    expect(result.current.gmmDataPlot[1].type).toBe("scatter");
    expect(result.current.gmmDataPlot[1].mode).toBe("text");
    expect(result.current.gmmDataPlot[1].text).toEqual(["<b>0</b>"]);
    expect(result.current.gmmDataPlot[1].x).toEqual([0.1]);
    expect(result.current.gmmDataPlot[1].y).toEqual([0.2]);

    // Check the second label plot (index 3)
    expect(result.current.gmmDataPlot[3].name).toBe("MoG No.1");
    expect(result.current.gmmDataPlot[3].showlegend).toBe(false);
    expect(result.current.gmmDataPlot[3].type).toBe("scatter");
    expect(result.current.gmmDataPlot[3].mode).toBe("text");
    expect(result.current.gmmDataPlot[3].text).toEqual(["<b>1</b>"]);
    expect(result.current.gmmDataPlot[3].x).toEqual([0.3]);
    expect(result.current.gmmDataPlot[3].y).toEqual([0.4]);
  });

  it("should call calculateGMMRings with correct parameters", () => {
    renderHook(() => useGmmDataPlot(mockGmmData));

    expect(calculateGMMRings).toHaveBeenCalledTimes(2);
    expect(calculateGMMRings).toHaveBeenCalledWith(
      mockGmmData.means[0],
      mockGmmData.covariances[0]
    );
    expect(calculateGMMRings).toHaveBeenCalledWith(
      mockGmmData.means[1],
      mockGmmData.covariances[1]
    );
  });
});
