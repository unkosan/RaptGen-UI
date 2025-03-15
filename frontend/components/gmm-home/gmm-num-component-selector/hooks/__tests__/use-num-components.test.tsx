import { renderHook, act } from "@testing-library/react";
import { useNumComponents } from "../use-num-components";
import { useRouter } from "next/router";
import { apiClient } from "~/services/api-client";

// Mock Next.js router
jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

// Mock API client
jest.mock("~/services/api-client", () => ({
  apiClient: {
    publishGMMJobs: jest.fn(),
  },
}));

describe("useNumComponents", () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (apiClient.publishGMMJobs as jest.Mock).mockResolvedValue(null);
  });

  it("should return default values for failed jobs", () => {
    const mockFailedJob = {
      uuid: "test-uuid",
      status: "failure" as const,
      params: {
        minimum_n_components: 1,
        maximum_n_components: 10,
        step_size: 1,
        n_trials_per_component: 5,
      },
    };

    const { result } = renderHook(() => useNumComponents(mockFailedJob as any));

    expect(result.current.value).toBeNaN();
    expect(result.current.optimalValue).toBeNaN();
    expect(result.current.range).toEqual([]);
  });

  it("should return default values for pending jobs", () => {
    const mockPendingJob = {
      uuid: "test-uuid",
      status: "pending" as const,
      params: {
        minimum_n_components: 1,
        maximum_n_components: 10,
        step_size: 1,
        n_trials_per_component: 5,
      },
    };

    const { result } = renderHook(() =>
      useNumComponents(mockPendingJob as any)
    );

    expect(result.current.value).toBeNaN();
    expect(result.current.optimalValue).toBeNaN();
    expect(result.current.range).toEqual([]);
  });

  it("should throw error when submitting invalid job", async () => {
    const mockFailedJob = {
      uuid: "test-uuid",
      status: "failure" as const,
      params: {
        minimum_n_components: 1,
        maximum_n_components: 10,
        step_size: 1,
        n_trials_per_component: 5,
      },
    };

    const { result } = renderHook(() => useNumComponents(mockFailedJob as any));

    await expect(result.current.handleSubmit("Test GMM Model")).rejects.toThrow(
      "Invalid job submitted"
    );
  });

  it("should calculate correct range for successful jobs", () => {
    const mockSuccessJob = {
      uuid: "test-uuid",
      status: "success" as const,
      params: {
        minimum_n_components: 1,
        maximum_n_components: 5,
        step_size: 1,
        n_trials_per_component: 5,
      },
      gmm: {
        current_n_components: 3,
        optimal_n_components: 3,
      },
    };

    const { result } = renderHook(() =>
      useNumComponents(mockSuccessJob as any)
    );

    expect(result.current.range).toEqual([1, 2, 3, 4, 5]);
    expect(result.current.value).toBe(3);
    expect(result.current.optimalValue).toBe(3);
  });

  it("should calculate correct range with step size", () => {
    const mockSuccessJob = {
      uuid: "test-uuid",
      status: "success" as const,
      params: {
        minimum_n_components: 1,
        maximum_n_components: 10,
        step_size: 2,
        n_trials_per_component: 5,
      },
      gmm: {
        current_n_components: 5,
        optimal_n_components: 5,
      },
    };

    const { result } = renderHook(() =>
      useNumComponents(mockSuccessJob as any)
    );

    expect(result.current.range).toEqual([1, 3, 5, 7, 9]);
  });

  it("should handle select and update router", () => {
    const mockSuccessJob = {
      uuid: "test-uuid",
      status: "success" as const,
      params: {
        minimum_n_components: 1,
        maximum_n_components: 5,
        step_size: 1,
        n_trials_per_component: 5,
      },
      gmm: {
        current_n_components: 3,
        optimal_n_components: 3,
      },
    };

    const { result } = renderHook(() =>
      useNumComponents(mockSuccessJob as any)
    );

    const mockEvent = {
      currentTarget: {
        value: "2",
      },
    } as React.ChangeEvent<HTMLSelectElement>;

    act(() => {
      result.current.handleSelect(mockEvent);
    });

    expect(mockRouter.push).toHaveBeenCalledWith(
      "?experiment=test-uuid&n_components=2",
      undefined,
      {
        scroll: false,
      }
    );
  });

  it("should handle invalid select value", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    const mockSuccessJob = {
      uuid: "test-uuid",
      status: "success" as const,
      params: {
        minimum_n_components: 1,
        maximum_n_components: 5,
        step_size: 1,
        n_trials_per_component: 5,
      },
      gmm: {
        current_n_components: 3,
        optimal_n_components: 3,
      },
    };

    const { result } = renderHook(() =>
      useNumComponents(mockSuccessJob as any)
    );

    const mockEvent = {
      currentTarget: {
        value: "10", // Out of range
      },
    } as React.ChangeEvent<HTMLSelectElement>;

    act(() => {
      result.current.handleSelect(mockEvent);
    });

    expect(consoleSpy).toHaveBeenCalled();
    expect(mockRouter.push).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("should call publishGMMJobs with correct parameters when handleSubmit is called", async () => {
    const mockSuccessJob = {
      uuid: "test-uuid",
      status: "success" as const,
      params: {
        minimum_n_components: 1,
        maximum_n_components: 5,
        step_size: 1,
        n_trials_per_component: 5,
      },
      gmm: {
        current_n_components: 3,
        optimal_n_components: 3,
      },
    };

    const { result } = renderHook(() =>
      useNumComponents(mockSuccessJob as any)
    );

    await act(async () => {
      await result.current.handleSubmit("Test GMM Model");
    });

    expect(apiClient.publishGMMJobs).toHaveBeenCalledWith({
      name: "Test GMM Model",
      uuid: "test-uuid",
      n_components: 3,
    });
  });

  it("should not call publishGMMJobs when job status is not success", async () => {
    const mockProgressJob = {
      uuid: "test-uuid",
      status: "progress" as const,
      params: {
        minimum_n_components: 1,
        maximum_n_components: 5,
        step_size: 1,
        n_trials_per_component: 5,
      },
      gmm: {
        current_n_components: 3,
        optimal_n_components: 3,
      },
    };

    const { result } = renderHook(() =>
      useNumComponents(mockProgressJob as any)
    );

    await act(async () => {
      await result.current.handleSubmit("Test GMM Model");
    });

    expect(apiClient.publishGMMJobs).not.toHaveBeenCalled();
  });

  it("should handle error when publishGMMJobs fails", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const mockError = new Error("API error");
    (apiClient.publishGMMJobs as jest.Mock).mockRejectedValue(mockError);

    const mockSuccessJob = {
      uuid: "test-uuid",
      status: "success" as const,
      params: {
        minimum_n_components: 1,
        maximum_n_components: 5,
        step_size: 1,
        n_trials_per_component: 5,
      },
      gmm: {
        current_n_components: 3,
        optimal_n_components: 3,
      },
    };

    const { result } = renderHook(() =>
      useNumComponents(mockSuccessJob as any)
    );

    await act(async () => {
      await result.current.handleSubmit("Test GMM Model");
    });

    expect(consoleSpy).toHaveBeenCalledWith(mockError);

    consoleSpy.mockRestore();
  });
});
