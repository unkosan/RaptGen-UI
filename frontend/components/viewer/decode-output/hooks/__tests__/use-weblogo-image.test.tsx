import { renderHook, waitFor } from "@testing-library/react";
import { useWeblogoImage } from "../use-weblogo-image";
import { apiClient } from "~/services/api-client";
import { act } from "react-dom/test-utils";

// Mock API client
jest.mock("~/services/api-client", () => ({
  apiClient: {
    getWeblogo: jest.fn(),
  },
}));

// Mock Buffer
const mockBuffer = {
  from: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue("mock-base64-string"),
  }),
};
global.Buffer = mockBuffer as any;

describe("useWeblogoImage", () => {
  const mockGridPoint = {
    coordX: 1.5,
    coordY: 2.5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with showWeblogo set to false", () => {
    const { result } = renderHook(() =>
      useWeblogoImage("test-session-id", mockGridPoint, false)
    );

    expect(result.current.showWeblogo).toBe(false);
    expect(result.current.weblogoBase64).toBe("");
  });

  it("should toggle showWeblogo when toggleWeblogo is called", () => {
    const { result } = renderHook(() =>
      useWeblogoImage("test-session-id", mockGridPoint, false)
    );

    // Initial state
    expect(result.current.showWeblogo).toBe(false);

    // Toggle on
    act(() => {
      result.current.toggleWeblogo();
    });
    expect(result.current.showWeblogo).toBe(true);

    // Toggle off
    act(() => {
      result.current.toggleWeblogo();
    });
    expect(result.current.showWeblogo).toBe(false);
  });

  it("should not fetch when lock is true", () => {
    const { result } = renderHook(() =>
      useWeblogoImage("test-session-id", mockGridPoint, true)
    );

    // Toggle on to trigger fetch
    act(() => {
      result.current.toggleWeblogo();
    });

    expect(apiClient.getWeblogo).not.toHaveBeenCalled();
  });

  it("should not fetch when sessionId is null", () => {
    const { result } = renderHook(() =>
      useWeblogoImage(null, mockGridPoint, false)
    );

    // Toggle on to trigger fetch
    act(() => {
      result.current.toggleWeblogo();
    });

    expect(apiClient.getWeblogo).not.toHaveBeenCalled();
  });

  it("should fetch weblogo image when conditions are met", async () => {
    const mockResponse = "mock-binary-data";
    (apiClient.getWeblogo as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() =>
      useWeblogoImage("test-session-id", mockGridPoint, false)
    );

    // Toggle on to trigger fetch and wait for the async operation to complete
    await act(async () => {
      result.current.toggleWeblogo();
      // Wait for the promise to resolve
      await Promise.resolve();
    });

    // Check that API was called with correct parameters
    expect(apiClient.getWeblogo).toHaveBeenCalledWith(
      {
        session_uuid: "test-session-id",
        coords_x: [1.5],
        coords_y: [2.5],
      },
      {
        responseType: "arraybuffer",
      }
    );

    // Check that Buffer.from was called with the response
    expect(mockBuffer.from).toHaveBeenCalledWith(mockResponse, "binary");

    // Check that state was updated with base64 string
    expect(result.current.weblogoBase64).toBe("mock-base64-string");
  });

  it("should handle API errors gracefully", async () => {
    // Spy on console.error
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    // Mock API error
    const mockError = new Error("API error");
    (apiClient.getWeblogo as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() =>
      useWeblogoImage("test-session-id", mockGridPoint, false)
    );

    // Toggle on to trigger fetch and wait for the async operation to complete
    await act(async () => {
      result.current.toggleWeblogo();
      // Wait for the promise to reject
      try {
        await Promise.resolve();
      } catch (e) {
        // Ignore error, we're expecting it to be caught in the hook
      }
    });

    // Check that error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching weblogo image:",
      mockError
    );

    // State should remain as initial value
    expect(result.current.weblogoBase64).toBe("");

    consoleSpy.mockRestore();
  });
});
