import { renderHook } from "@testing-library/react";
import { useConfirmNavigation } from "../use-confirm-navigation";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import { apiClient } from "~/services/api-client";

// Mock React Redux
jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
}));

// Mock Next.js router
jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

// Mock API client
jest.mock("~/services/api-client", () => ({
  apiClient: {
    endSession: jest.fn(),
  },
}));

// Mock window methods
const originalConfirm = window.confirm;
const mockConfirm = jest.fn();
const mockAddEventListener = jest.spyOn(window, "addEventListener");
const mockRemoveEventListener = jest.spyOn(window, "removeEventListener");

describe("useConfirmNavigation", () => {
  // Mock router events
  const mockRouterEvents = {
    on: jest.fn(),
    off: jest.fn(),
  };

  // Mock data for testing
  const mockIsDirty = true;
  const mockSessionId = "test-session-id";

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock window.confirm
    window.confirm = mockConfirm;

    // Mock router
    (useRouter as jest.Mock).mockReturnValue({
      events: mockRouterEvents,
    });

    // Mock Redux selectors
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector.toString().includes("isDirty")) {
        return mockIsDirty;
      } else if (selector.toString().includes("sessionConfig.sessionId")) {
        return mockSessionId;
      }
      return null;
    });
  });

  afterEach(() => {
    window.confirm = originalConfirm;
  });

  it("should set up event listeners on mount", () => {
    renderHook(() => useConfirmNavigation());

    // Check that router events listeners are set up
    expect(mockRouterEvents.on).toHaveBeenCalledWith(
      "routeChangeStart",
      expect.any(Function)
    );

    // Check that window event listeners are set up
    expect(mockAddEventListener).toHaveBeenCalledWith(
      "beforeunload",
      expect.any(Function)
    );
    expect(mockAddEventListener).toHaveBeenCalledWith(
      "unload",
      expect.any(Function)
    );
  });

  it("should clean up event listeners on unmount", () => {
    const { unmount } = renderHook(() => useConfirmNavigation());

    // Unmount the hook
    unmount();

    // Check that router events listeners are cleaned up
    expect(mockRouterEvents.off).toHaveBeenCalledWith(
      "routeChangeStart",
      expect.any(Function)
    );

    // Check that window event listeners are cleaned up
    expect(mockRemoveEventListener).toHaveBeenCalledWith(
      "beforeunload",
      expect.any(Function)
    );
    expect(mockRemoveEventListener).toHaveBeenCalledWith(
      "unload",
      expect.any(Function)
    );
  });

  it("should prompt for confirmation when navigating with unsaved changes", () => {
    renderHook(() => useConfirmNavigation());

    // Get the pageChangeHandler function
    const pageChangeHandler = mockRouterEvents.on.mock.calls[0][1];

    // Mock confirm to return true
    mockConfirm.mockReturnValue(true);

    // Call the pageChangeHandler
    pageChangeHandler();

    // Check that confirm was called with the correct message
    expect(mockConfirm).toHaveBeenCalledWith("Discard changes?");
  });

  it("should throw 'cancelled' when navigation is cancelled", () => {
    renderHook(() => useConfirmNavigation());

    // Get the pageChangeHandler function
    const pageChangeHandler = mockRouterEvents.on.mock.calls[0][1];

    // Mock confirm to return false
    mockConfirm.mockReturnValue(false);

    // Call the pageChangeHandler and expect it to throw
    expect(() => pageChangeHandler()).toThrow("cancelled");

    // Check that confirm was called
    expect(mockConfirm).toHaveBeenCalled();
  });

  it("should not prompt for confirmation when there are no unsaved changes", () => {
    // Mock isDirty to be false
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector.toString().includes("isDirty")) {
        return false;
      } else if (selector.toString().includes("sessionConfig")) {
        return { sessionId: mockSessionId };
      }
      return null;
    });

    renderHook(() => useConfirmNavigation());

    // Get the pageChangeHandler function
    const pageChangeHandler = mockRouterEvents.on.mock.calls[0][1];

    // Call the pageChangeHandler
    pageChangeHandler();

    // Check that confirm was not called
    expect(mockConfirm).not.toHaveBeenCalled();
  });

  it("should set returnValue on beforeunload event when there are unsaved changes", () => {
    renderHook(() => useConfirmNavigation());

    // Get the beforeunload function
    const beforeUnloadHandler = mockAddEventListener.mock.calls.find(
      (call) => call[0] === "beforeunload"
    )?.[1] as EventListener;

    // Create a mock event
    const mockEvent = {
      preventDefault: jest.fn(),
      returnValue: "",
    } as unknown as BeforeUnloadEvent;

    // Call the beforeunload handler
    beforeUnloadHandler(mockEvent);

    // Check that preventDefault was called
    expect(mockEvent.preventDefault).toHaveBeenCalled();

    // Check that returnValue was set
    expect(mockEvent.returnValue).toBe("Discard changes?");
  });

  it("should not set returnValue on beforeunload event when there are no unsaved changes", () => {
    // Mock isDirty to be false
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector.toString().includes("isDirty")) {
        return false;
      } else if (selector.toString().includes("sessionConfig")) {
        return { sessionId: mockSessionId };
      }
      return null;
    });

    renderHook(() => useConfirmNavigation());

    // Get the beforeunload function
    const beforeUnloadHandler = mockAddEventListener.mock.calls.find(
      (call) => call[0] === "beforeunload"
    )?.[1] as EventListener;

    // Create a mock event
    const mockEvent = {
      preventDefault: jest.fn(),
      returnValue: "",
    } as unknown as BeforeUnloadEvent;

    // Call the beforeunload handler
    beforeUnloadHandler(mockEvent);

    // Check that preventDefault was not called
    expect(mockEvent.preventDefault).not.toHaveBeenCalled();

    // Check that returnValue was not set
    expect(mockEvent.returnValue).toBe("");
  });

  it("should end session on unload event", () => {
    renderHook(() => useConfirmNavigation());

    // Get the unload function
    const unloadHandler = mockAddEventListener.mock.calls.find(
      (call) => call[0] === "unload"
    )?.[1] as EventListener;

    // Call the unload handler
    unloadHandler(new Event("unload"));

    // Check that endSession was called with the correct parameters
    expect(apiClient.endSession).toHaveBeenCalledWith({
      queries: {
        session_uuid: mockSessionId,
      },
    });
  });

  it("should not end session on unload event when sessionId is empty", () => {
    // Mock sessionId to be empty
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector.toString().includes("isDirty")) {
        return mockIsDirty;
      } else if (selector.toString().includes("sessionConfig.sessionId")) {
        return "";
      }
      return null;
    });

    renderHook(() => useConfirmNavigation());

    // Get the unload function
    const unloadHandler = mockAddEventListener.mock.calls.find(
      (call) => call[0] === "unload"
    )?.[1] as EventListener;

    // Call the unload handler
    unloadHandler(new Event("unload"));

    // Check that endSession was not called
    expect(apiClient.endSession).not.toHaveBeenCalled();
  });
});
