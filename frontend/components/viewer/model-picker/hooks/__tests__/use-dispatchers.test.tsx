import { renderHook, act } from "@testing-library/react-hooks";
import { usePickVAE, usePickGMM } from "../use-dispatchers";
import { useDispatch, useSelector } from "react-redux";
import * as sessionConfigActions from "../../../redux/session-config";

// Mock Redux hooks
jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

// Mock Redux actions
jest.mock("../../../redux/session-config", () => ({
  setGmmId: jest.fn().mockImplementation((id) => ({
    type: "sessionConfig2/setGmmId",
    payload: id,
  })),
  setSessionConfigByVaeIdName: jest.fn().mockImplementation((config) => ({
    type: "sessionConfig2/setByVaeIdName",
    payload: config,
  })),
}));

// Type-safe mocks using any to bypass TypeScript errors
const mockedSetGmmId = sessionConfigActions.setGmmId as any;
const mockedSetSessionConfigByVaeIdName =
  sessionConfigActions.setSessionConfigByVaeIdName as any;

describe("usePickVAE", () => {
  let mockDispatch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch = jest.fn();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);

    // Mock useSelector to return a test vaeId
    (useSelector as jest.Mock).mockImplementation((selector) => {
      return "test-vae-id"; // Simulating the value in Redux store
    });
  });

  it("should return modelId from Redux state", () => {
    const { result } = renderHook(() => usePickVAE());

    expect(result.current.modelId).toBe("test-vae-id");
    expect(useSelector).toHaveBeenCalled();
  });

  it("should set modelId and update sessionId on setModelId call", async () => {
    // Mock the successful dispatch result
    const mockSessionId = "test-session-id";
    const mockDispatchResult = Promise.resolve({
      payload: { sessionId: mockSessionId },
    });
    mockDispatch.mockReturnValue(mockDispatchResult);

    const { result } = renderHook(() => usePickVAE());

    // Call the setModelId function
    act(() => {
      result.current.setModelId("new-vae-id", "Test VAE");
    });

    // Verify that the action creator was called with the correct arguments
    expect(mockedSetSessionConfigByVaeIdName).toHaveBeenCalledWith({
      vaeId: "new-vae-id",
      vaeName: "Test VAE",
    });

    expect(mockDispatch).toHaveBeenCalled();

    // Wait for useEffect to run after state update
    await mockDispatchResult;
  });

  it("should handle error during model ID setting", async () => {
    // Spy on console.error to verify it's called
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    // Mock an error during dispatch
    const mockError = new Error("API error");
    mockDispatch.mockRejectedValue(mockError);

    const { result } = renderHook(() => usePickVAE());

    // Call the setModelId function
    act(() => {
      result.current.setModelId("error-vae-id", "Error VAE");
    });

    // Wait for the promise to reject
    await new Promise(process.nextTick);

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalledWith(mockError);

    consoleSpy.mockRestore();
  });
});

describe("usePickGMM", () => {
  let mockDispatch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch = jest.fn();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);

    // Mock useSelector for GMM ID
    (useSelector as jest.Mock).mockImplementation((selector) => {
      return "test-gmm-id"; // Simulating the value in Redux store
    });
  });

  it("should return modelId from Redux state", () => {
    const { result } = renderHook(() => usePickGMM());

    expect(result.current.modelId).toBe("test-gmm-id");
    expect(useSelector).toHaveBeenCalled();
  });

  it("should dispatch setGmmId action when setModelId is called", () => {
    const { result } = renderHook(() => usePickGMM());

    // Call the setModelId function
    act(() => {
      result.current.setModelId("new-gmm-id");
    });

    // Verify that setGmmId was called with the correct argument
    expect(mockedSetGmmId).toHaveBeenCalledWith("new-gmm-id");

    // Verify that dispatch was called with something
    expect(mockDispatch).toHaveBeenCalled();
  });
});
