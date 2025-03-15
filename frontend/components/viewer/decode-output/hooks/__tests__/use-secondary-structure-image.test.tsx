import { renderHook, waitFor } from "@testing-library/react";
import { useSecondaryStructureImage } from "../use-secondary-structure-image";
import { apiClient } from "~/services/api-client";
import { act } from "react-dom/test-utils";

// Mock API client
jest.mock("~/services/api-client", () => ({
  apiClient: {
    getSecondaryStructureImage: jest.fn(),
  },
}));

// Mock Buffer
const mockBuffer = {
  from: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue("mock-base64-string"),
  }),
};
global.Buffer = mockBuffer as any;

describe("useSecondaryStructureImage", () => {
  const mockGridPoint = {
    coordX: 1.5,
    coordY: 2.5,
  };
  const mockForward = "FORWARD";
  const mockReverse = "REVERSE";
  const mockSequence = "AUGC_";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with showSecondaryStructure set to false", () => {
    const { result } = renderHook(() =>
      useSecondaryStructureImage(
        mockGridPoint,
        mockForward,
        mockReverse,
        mockSequence,
        false
      )
    );

    expect(result.current.showSecondaryStructure).toBe(false);
    expect(result.current.secondaryStructureBase64).toBe("");
  });

  it("should toggle showSecondaryStructure when toggleSecondaryStructure is called", () => {
    const { result } = renderHook(() =>
      useSecondaryStructureImage(
        mockGridPoint,
        mockForward,
        mockReverse,
        mockSequence,
        false
      )
    );

    // Initial state
    expect(result.current.showSecondaryStructure).toBe(false);

    // Toggle on
    act(() => {
      result.current.toggleSecondaryStructure();
    });
    expect(result.current.showSecondaryStructure).toBe(true);

    // Toggle off
    act(() => {
      result.current.toggleSecondaryStructure();
    });
    expect(result.current.showSecondaryStructure).toBe(false);
  });

  it("should not fetch when lock is true", () => {
    const { result } = renderHook(() =>
      useSecondaryStructureImage(
        mockGridPoint,
        mockForward,
        mockReverse,
        mockSequence,
        true
      )
    );

    // Toggle on to trigger fetch
    act(() => {
      result.current.toggleSecondaryStructure();
    });

    expect(apiClient.getSecondaryStructureImage).not.toHaveBeenCalled();
  });

  it("should fetch secondary structure image when conditions are met", async () => {
    const mockResponse = "mock-binary-data";
    (apiClient.getSecondaryStructureImage as jest.Mock).mockResolvedValue(
      mockResponse
    );

    const { result } = renderHook(() =>
      useSecondaryStructureImage(
        mockGridPoint,
        mockForward,
        mockReverse,
        mockSequence,
        false
      )
    );

    // Toggle on to trigger fetch and wait for the async operation to complete
    await act(async () => {
      result.current.toggleSecondaryStructure();
      // Wait for the promise to resolve
      await Promise.resolve();
    });

    // Check that API was called with correct parameters
    expect(apiClient.getSecondaryStructureImage).toHaveBeenCalledWith({
      queries: {
        sequence: "FORWARDAUGCREVERSE", // Note: underscores are removed
      },
      responseType: "arraybuffer",
    });

    // Check that Buffer.from was called with the response
    expect(mockBuffer.from).toHaveBeenCalledWith(mockResponse, "binary");

    // Check that state was updated with base64 string
    expect(result.current.secondaryStructureBase64).toBe("mock-base64-string");
  });

  it("should handle API errors gracefully", async () => {
    // Spy on console.error
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    // Mock API error
    const mockError = new Error("API error");
    (apiClient.getSecondaryStructureImage as jest.Mock).mockRejectedValue(
      mockError
    );

    const { result } = renderHook(() =>
      useSecondaryStructureImage(
        mockGridPoint,
        mockForward,
        mockReverse,
        mockSequence,
        false
      )
    );

    // Toggle on to trigger fetch and wait for the async operation to complete
    await act(async () => {
      result.current.toggleSecondaryStructure();
      // Wait for the promise to reject
      try {
        await Promise.resolve();
      } catch (e) {
        // Ignore error, we're expecting it to be caught in the hook
      }
    });

    // Check that error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching secondary structure image:",
      mockError
    );

    // State should remain as initial value
    expect(result.current.secondaryStructureBase64).toBe("");

    consoleSpy.mockRestore();
  });
});
