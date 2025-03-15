import { renderHook, waitFor } from "@testing-library/react";
import { useSequenceDecoder } from "../use-sequence-decoder";
import { apiClient } from "~/services/api-client";
import { act } from "react-dom/test-utils";

// Mock API client
jest.mock("~/services/api-client", () => ({
  apiClient: {
    decode: jest.fn(),
  },
}));

describe("useSequenceDecoder", () => {
  const mockGridPoint = {
    coordX: 1.5,
    coordY: 2.5,
  };
  const mockSessionId = "test-session-id";
  const mockDecodedSequence = "AUGCUGCA";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with empty sequence and isLoading false", () => {
    const initSessionId = "";
    const { result } = renderHook(() =>
      useSequenceDecoder(mockGridPoint, initSessionId, false)
    );

    expect(result.current.sequence).toBe("");
    expect(result.current.isLoading).toBe(false);
  });

  it("should not fetch when lock is true", () => {
    renderHook(() => useSequenceDecoder(mockGridPoint, mockSessionId, true));

    expect(apiClient.decode).not.toHaveBeenCalled();
  });

  it("should not fetch when sessionId is empty", () => {
    renderHook(() => useSequenceDecoder(mockGridPoint, "", false));

    expect(apiClient.decode).not.toHaveBeenCalled();
  });

  it("should fetch and update sequence when conditions are met", async () => {
    (apiClient.decode as jest.Mock).mockResolvedValue({
      sequences: [mockDecodedSequence],
    });

    const { result } = renderHook(() =>
      useSequenceDecoder(mockGridPoint, mockSessionId, false)
    );

    // Initial state
    expect(result.current.sequence).toBe("");
    expect(result.current.isLoading).toBe(true); // Should be loading immediately

    // Wait for the effect to run
    await waitFor(() => {
      expect(result.current.sequence).toBe(mockDecodedSequence);
    });

    // Check that API was called with correct parameters
    expect(apiClient.decode).toHaveBeenCalledWith({
      session_uuid: mockSessionId,
      coords_x: [mockGridPoint.coordX],
      coords_y: [mockGridPoint.coordY],
    });

    // Check that state was updated with the decoded sequence
    expect(result.current.isLoading).toBe(false);
  });

  it("should handle API errors gracefully", async () => {
    // Spy on console.error
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    // Mock API error
    const mockError = new Error("API error");
    (apiClient.decode as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() =>
      useSequenceDecoder(mockGridPoint, mockSessionId, false)
    );

    // Wait for the effect to run and catch the error
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error decoding sequence:",
        mockError
      );
    });

    // Sequence should remain empty
    expect(result.current.sequence).toBe("");
    // isLoading should be false after error
    expect(result.current.isLoading).toBe(false);

    consoleSpy.mockRestore();
  });

  it("should refetch when gridPoint changes", async () => {
    (apiClient.decode as jest.Mock).mockResolvedValue({
      sequences: [mockDecodedSequence],
    });

    const { result, rerender } = renderHook(
      (props) =>
        useSequenceDecoder(props.gridPoint, props.sessionId, props.lock),
      {
        initialProps: {
          gridPoint: mockGridPoint,
          sessionId: mockSessionId,
          lock: false,
        },
      }
    );

    // Wait for the initial fetch
    await waitFor(() => {
      expect(result.current.sequence).toBe(mockDecodedSequence);
    });

    // Change grid point
    const newGridPoint = { coordX: 3.5, coordY: 4.5 };
    rerender({
      gridPoint: newGridPoint,
      sessionId: mockSessionId,
      lock: false,
    });

    // Wait for the refetch
    await waitFor(() => {
      expect(apiClient.decode).toHaveBeenCalledTimes(2);
    });

    // Check that API was called again with new coordinates
    expect(apiClient.decode).toHaveBeenLastCalledWith({
      session_uuid: mockSessionId,
      coords_x: [newGridPoint.coordX],
      coords_y: [newGridPoint.coordY],
    });
  });
});
