import { renderHook, act, waitFor } from "@testing-library/react";
import { useActions } from "../use-actions";
import { useRouter } from "next/router";
import { apiClient } from "~/services/api-client";

// Mock Next.js router
jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

// Mock API client
jest.mock("~/services/api-client", () => ({
  apiClient: {
    updateGMMJobs: jest.fn(),
    deleteGMMJobs: jest.fn(),
    suspendGMMJobs: jest.fn(),
    resumeGMMJobs: jest.fn(),
  },
}));

describe("useActions", () => {
  const mockUuid = "test-uuid";
  const mockRefreshFunc = jest.fn();
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (apiClient.updateGMMJobs as jest.Mock).mockResolvedValue(null);
    (apiClient.deleteGMMJobs as jest.Mock).mockResolvedValue(null);
    (apiClient.suspendGMMJobs as jest.Mock).mockResolvedValue(null);
    (apiClient.resumeGMMJobs as jest.Mock).mockResolvedValue(null);
  });

  it("should call updateGMMJobs with correct parameters when handleRename is called", async () => {
    const { result } = renderHook(() => useActions(mockUuid, mockRefreshFunc));
    const newName = "New Test Name";

    await act(async () => {
      await result.current.handleRename(newName);
    });

    expect(apiClient.updateGMMJobs).toHaveBeenCalledWith(
      {
        target: "name",
        value: newName,
      },
      {
        params: {
          uuid: mockUuid,
        },
      }
    );
    expect(mockRefreshFunc).toHaveBeenCalled();
  });

  it("should handle error when updateGMMJobs fails", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const mockError = new Error("API error");
    (apiClient.updateGMMJobs as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useActions(mockUuid, mockRefreshFunc));
    const newName = "New Test Name";

    await act(async () => {
      await result.current.handleRename(newName);
    });

    expect(consoleSpy).toHaveBeenCalledWith(mockError);
    expect(mockRefreshFunc).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("should call deleteGMMJobs with correct parameters when handleDelete is called", async () => {
    const { result } = renderHook(() => useActions(mockUuid, mockRefreshFunc));

    await act(async () => {
      await result.current.handleDelete();
    });

    expect(apiClient.deleteGMMJobs).toHaveBeenCalledWith(undefined, {
      params: {
        uuid: mockUuid,
      },
    });
    expect(mockRouter.push).toHaveBeenCalledWith("/gmm");
  });

  it("should handle error when deleteGMMJobs fails", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const mockError = new Error("API error");
    (apiClient.deleteGMMJobs as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useActions(mockUuid, mockRefreshFunc));

    await act(async () => {
      await result.current.handleDelete();
    });

    expect(consoleSpy).toHaveBeenCalledWith(mockError);
    expect(mockRouter.push).toHaveBeenCalledWith("/gmm");

    consoleSpy.mockRestore();
  });

  it("should call suspendGMMJobs with correct parameters when handleStop is called", async () => {
    const { result } = renderHook(() => useActions(mockUuid, mockRefreshFunc));

    await act(async () => {
      await result.current.handleStop();
    });

    expect(apiClient.suspendGMMJobs).toHaveBeenCalledWith({ uuid: mockUuid });
    expect(mockRefreshFunc).toHaveBeenCalled();
  });

  it("should handle error when suspendGMMJobs fails", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const mockError = new Error("API error");
    (apiClient.suspendGMMJobs as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useActions(mockUuid, mockRefreshFunc));

    await act(async () => {
      await result.current.handleStop();
    });

    expect(consoleSpy).toHaveBeenCalledWith(mockError);
    expect(mockRefreshFunc).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("should call resumeGMMJobs with correct parameters when handleResume is called", async () => {
    const { result } = renderHook(() => useActions(mockUuid, mockRefreshFunc));

    await act(async () => {
      await result.current.handleResume();
    });

    expect(apiClient.resumeGMMJobs).toHaveBeenCalledWith({
      uuid: mockUuid,
    });
    expect(mockRefreshFunc).toHaveBeenCalled();
  });

  it("should handle error when resumeGMMJobs fails", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const mockError = new Error("API error");
    (apiClient.resumeGMMJobs as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useActions(mockUuid, mockRefreshFunc));

    await act(async () => {
      await result.current.handleResume();
    });

    expect(consoleSpy).toHaveBeenCalledWith(mockError);
    expect(mockRefreshFunc).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
