import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import { apiClient } from "~/services/api-client";
import { useDownloader, ALL_CLUSTERS } from "../use-downloader";
import { downloadFileFromText } from "../utils";
import * as mathjs from "mathjs";

// Mock the downloadFileFromText, testing this function interferes DOM manipulation
jest.mock("../utils", () => ({
  ...jest.requireActual("../utils"),
  downloadFileFromText: jest.fn(),
}));

// Mock the API client
jest.mock("~/services/api-client", () => ({
  apiClient: {
    getGMMModel: jest.fn(),
    getSelexData: jest.fn(),
  },
}));

// Mock mathjs functions
jest.mock("mathjs", () => ({
  det: jest.fn().mockReturnValue(1),
  inv: jest.fn().mockReturnValue([
    [1, 0],
    [0, 1],
  ]),
  matrix: jest.fn().mockImplementation((x) => x),
  multiply: jest.fn().mockReturnValue(1),
  subtract: jest.fn().mockReturnValue([0, 0]),
  transpose: jest.fn().mockImplementation((x) => x),
}));

describe("useDownloader", () => {
  const mockGmmId = "gmm-123";
  const mockVaeId = "vae-456";
  const mockVaeName = "test-vae";

  const mockGmmResponse = {
    weights: [0.5, 0.5],
    means: [
      [1, 2],
      [3, 4],
    ],
    covariances: [
      [
        [1, 0],
        [0, 1],
      ],
      [
        [2, 0],
        [0, 2],
      ],
    ],
  };

  const mockSelexResponse = {
    random_regions: ["ACGT", "TGCA"],
    duplicates: [1, 2],
    coord_x: [0.1, 0.2],
    coord_y: [0.3, 0.4],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup API mock responses
    (apiClient.getGMMModel as jest.Mock).mockResolvedValue(mockGmmResponse);
    (apiClient.getSelexData as jest.Mock).mockResolvedValue(mockSelexResponse);
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() =>
      useDownloader(mockGmmId, mockVaeId, mockVaeName)
    );

    expect(result.current.isSavingCSV).toBe(false);
    expect(result.current.isSavingFASTA).toBe(false);
    expect(result.current.numComponents).toBe(0);
  });

  it("should fetch GMM parameters on mount", async () => {
    const { result } = renderHook(() =>
      useDownloader(mockGmmId, mockVaeId, mockVaeName)
    );

    await waitFor(() => {
      expect(apiClient.getGMMModel).toHaveBeenCalledWith({
        queries: { gmm_uuid: mockGmmId },
      });
    });

    expect(result.current.numComponents).toBe(2); // Length of weights array
  });

  it("should handle API errors gracefully when fetching GMM parameters", async () => {
    // Setup API to throw an error
    (apiClient.getGMMModel as jest.Mock).mockRejectedValueOnce(
      new Error("API error")
    );

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    renderHook(() => useDownloader(mockGmmId, mockVaeId, mockVaeName));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it("should fetch SELEX data when downloading CSV", async () => {
    const { result } = renderHook(() =>
      useDownloader(mockGmmId, mockVaeId, mockVaeName)
    );

    // Wait for GMM data to load
    await waitFor(() => {
      expect(result.current.numComponents).toBe(2);
    });

    await act(async () => {
      await result.current.onDownloadCSV(0);
    });

    expect(apiClient.getSelexData).toHaveBeenCalledWith({
      queries: { vae_uuid: mockVaeId },
    });
  });

  it("should set isSavingCSV flag during CSV download", async () => {
    const { result } = renderHook(() =>
      useDownloader(mockGmmId, mockVaeId, mockVaeName)
    );

    // Wait for GMM data to load
    await waitFor(() => {
      expect(result.current.numComponents).toBe(2);
    });

    expect(result.current.isSavingCSV).toBe(false);

    let downloadPromise: Promise<void>;

    act(() => {
      downloadPromise = result.current.onDownloadCSV(0);
    });

    expect(result.current.isSavingCSV).toBe(true);

    await act(async () => {
      await downloadPromise;
    });

    expect(result.current.isSavingCSV).toBe(false);
  });

  it("should handle errors during CSV download", async () => {
    (apiClient.getSelexData as jest.Mock).mockRejectedValueOnce(
      new Error("Download error")
    );

    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    const { result } = renderHook(() =>
      useDownloader(mockGmmId, mockVaeId, mockVaeName)
    );

    // Wait for GMM data to load
    await waitFor(() => {
      expect(result.current.numComponents).toBe(2);
    });

    await act(async () => {
      await result.current.onDownloadCSV(0);
    });

    expect(consoleSpy).toHaveBeenCalled();
    expect(result.current.isSavingCSV).toBe(false);

    consoleSpy.mockRestore();
  });

  it("should call downloadFileFromText with correct CSV content for a specific cluster", async () => {
    const { result } = renderHook(() =>
      useDownloader(mockGmmId, mockVaeId, mockVaeName)
    );

    // Wait for GMM data to load
    await waitFor(() => {
      expect(result.current.numComponents).toBe(2);
    });

    await act(async () => {
      await result.current.onDownloadCSV(0);
    });

    // Check that downloadFileFromText was called
    expect(downloadFileFromText).toHaveBeenCalled();

    // Check that it was called with the correct filename
    const callArgs = (downloadFileFromText as jest.Mock).mock.calls[0];
    expect(callArgs[1]).toBe("test-vae_csv_cluster-0.csv");

    // Check that the content contains expected CSV headers
    expect(callArgs[0]).toContain(
      "seq,coordX,coordY,duplicates,cluster,probs_cluster-0,probs_cluster-1"
    );
  });

  it("should call downloadFileFromText with correct CSV content for all clusters", async () => {
    const { result } = renderHook(() =>
      useDownloader(mockGmmId, mockVaeId, mockVaeName)
    );

    // Wait for GMM data to load
    await waitFor(() => {
      expect(result.current.numComponents).toBe(2);
    });

    await act(async () => {
      await result.current.onDownloadCSV(ALL_CLUSTERS);
    });

    // Check that downloadFileFromText was called
    expect(downloadFileFromText).toHaveBeenCalled();

    // Check that it was called with the correct filename
    const callArgs = (downloadFileFromText as jest.Mock).mock.calls[0];
    expect(callArgs[1]).toBe("test-vae_csv_all.csv");
  });

  it("should fetch SELEX data when downloading FASTA", async () => {
    const { result } = renderHook(() =>
      useDownloader(mockGmmId, mockVaeId, mockVaeName)
    );

    // Wait for GMM data to load
    await waitFor(() => {
      expect(result.current.numComponents).toBe(2);
    });

    await act(async () => {
      await result.current.onDownloadFASTA(0);
    });

    expect(apiClient.getSelexData).toHaveBeenCalledWith({
      queries: { vae_uuid: mockVaeId },
    });
  });

  it("should set isSavingFASTA flag during FASTA download", async () => {
    const { result } = renderHook(() =>
      useDownloader(mockGmmId, mockVaeId, mockVaeName)
    );

    // Wait for GMM data to load
    await waitFor(() => {
      expect(result.current.numComponents).toBe(2);
    });

    expect(result.current.isSavingFASTA).toBe(false);

    let downloadPromise: Promise<void>;

    act(() => {
      downloadPromise = result.current.onDownloadFASTA(0);
    });

    expect(result.current.isSavingFASTA).toBe(true);

    await act(async () => {
      await downloadPromise;
    });

    expect(result.current.isSavingFASTA).toBe(false);
  });

  it("should handle errors during FASTA download", async () => {
    (apiClient.getSelexData as jest.Mock).mockRejectedValueOnce(
      new Error("Download error")
    );

    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    const { result } = renderHook(() =>
      useDownloader(mockGmmId, mockVaeId, mockVaeName)
    );

    // Wait for GMM data to load
    await waitFor(() => {
      expect(result.current.numComponents).toBe(2);
    });

    await act(async () => {
      await result.current.onDownloadFASTA(0);
    });

    expect(consoleSpy).toHaveBeenCalled();
    expect(result.current.isSavingFASTA).toBe(false);

    consoleSpy.mockRestore();
  });

  it("should call downloadFileFromText with correct FASTA content for a specific cluster", async () => {
    const { result } = renderHook(() =>
      useDownloader(mockGmmId, mockVaeId, mockVaeName)
    );

    // Wait for GMM data to load
    await waitFor(() => {
      expect(result.current.numComponents).toBe(2);
    });

    await act(async () => {
      await result.current.onDownloadFASTA(0);
    });

    // Check that downloadFileFromText was called
    expect(downloadFileFromText).toHaveBeenCalled();

    // Check that it was called with the correct filename
    const callArgs = (downloadFileFromText as jest.Mock).mock.calls[0];
    expect(callArgs[1]).toBe("test-vae_fasta_cluster-0.fasta");

    // Check that the content contains expected FASTA format
    expect(callArgs[0]).toContain(">seq-");
  });

  it("should call downloadFileFromText with correct FASTA content for all clusters", async () => {
    const { result } = renderHook(() =>
      useDownloader(mockGmmId, mockVaeId, mockVaeName)
    );

    // Wait for GMM data to load
    await waitFor(() => {
      expect(result.current.numComponents).toBe(2);
    });

    await act(async () => {
      await result.current.onDownloadFASTA(ALL_CLUSTERS);
    });

    // Check that downloadFileFromText was called
    expect(downloadFileFromText).toHaveBeenCalled();

    // Check that it was called with the correct filename
    const callArgs = (downloadFileFromText as jest.Mock).mock.calls[0];
    expect(callArgs[1]).toBe("test-vae_fasta_all.fasta");
  });

  it("should cache SELEX data for repeated downloads", async () => {
    const { result } = renderHook(() =>
      useDownloader(mockGmmId, mockVaeId, mockVaeName)
    );

    // Wait for GMM data to load
    await waitFor(() => {
      expect(result.current.numComponents).toBe(2);
    });

    // First download
    await act(async () => {
      await result.current.onDownloadCSV(0);
    });

    expect(apiClient.getSelexData).toHaveBeenCalledTimes(1);

    // Clear the mock to check if it's called again
    (apiClient.getSelexData as jest.Mock).mockClear();

    // Second download with the same vaeId
    await act(async () => {
      console.log("First download");
      await result.current.onDownloadCSV(1);
    });

    // Should not call the API again
    expect(apiClient.getSelexData).not.toHaveBeenCalled();
  });

  it("should calculate probability correctly", async () => {
    // This test indirectly tests the calcurateProbability function
    const { result } = renderHook(() =>
      useDownloader(mockGmmId, mockVaeId, mockVaeName)
    );

    // Wait for GMM data to load
    await waitFor(() => {
      expect(result.current.numComponents).toBe(2);
    });

    await act(async () => {
      await result.current.onDownloadCSV(0);
    });

    // Verify that mathjs functions were called during probability calculation
    expect(mathjs.matrix).toHaveBeenCalled();
    expect(mathjs.det).toHaveBeenCalled();
    expect(mathjs.inv).toHaveBeenCalled();
    expect(mathjs.subtract).toHaveBeenCalled();
    expect(mathjs.multiply).toHaveBeenCalled();
    expect(mathjs.transpose).toHaveBeenCalled();
  });
});
