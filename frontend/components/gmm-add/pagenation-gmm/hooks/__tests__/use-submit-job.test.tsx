import { renderHook, act } from "@testing-library/react";
import { useSubmitJob } from "../use-submit-job";
import { useSelector } from "react-redux";
import { apiClient } from "~/services/api-client";
import { useRouter } from "next/router";

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
    submitGMMJobs: jest.fn(),
  },
}));

describe("useSubmitJob", () => {
  const mockParams = {
    vaeId: "test-vae-id",
    gmmName: "Test GMM",
    minNumComponents: 5,
    maxNumComponents: 15,
    stepSize: 1,
    numTrials: 10,
  };

  const mockParamsValid = {
    gmmName: true,
    vaeId: true,
    minNumComponents: true,
    maxNumComponents: true,
    stepSize: true,
    numTrials: true,
  };

  const mockRouter = {
    push: jest.fn(),
  };

  const mockGmmJobResponse = {
    uuid: "test-gmm-job-uuid",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Mock the selector function to return our mock state
      if (selector.name === "selector") {
        return selector({
          params: mockParams,
          paramsValid: mockParamsValid,
        });
      }
      // For the first call, return params, for the second call, return paramsValid
      return selector.toString().includes("paramsValid")
        ? mockParamsValid
        : mockParams;
    });
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (apiClient.submitGMMJobs as jest.Mock).mockResolvedValue(
      mockGmmJobResponse
    );
  });

  it("should initialize with the correct state", () => {
    const { result } = renderHook(() => useSubmitJob());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.canTrain).toBe(true);
  });

  it("should handle train button click", async () => {
    const { result } = renderHook(() => useSubmitJob());

    // Call handleClickTrain
    await act(async () => {
      await result.current.handleClickTrain();
    });

    // Should have called the API with the correct parameters
    expect(apiClient.submitGMMJobs).toHaveBeenCalledWith({
      params: {
        minimum_n_components: mockParams.minNumComponents,
        maximum_n_components: mockParams.maxNumComponents,
        step_size: mockParams.stepSize,
        n_trials_per_component: mockParams.numTrials,
      },
      target: mockParams.vaeId,
      name: mockParams.gmmName,
    });

    // Should have navigated to the correct page
    expect(mockRouter.push).toHaveBeenCalledWith(
      `/gmm?experiment=${mockGmmJobResponse.uuid}`
    );
  });

  it("should handle back button click", () => {
    const { result } = renderHook(() => useSubmitJob());

    // Call handleClickBack
    act(() => {
      result.current.handleClickBack();
    });

    // Should have navigated to the correct page
    expect(mockRouter.push).toHaveBeenCalledWith("/gmm");
  });

  it("should set isLoading to true during API call and false after completion", async () => {
    const { result } = renderHook(() => useSubmitJob());

    // Call handleClickTrain
    let trainPromise: Promise<void>;
    act(() => {
      trainPromise = result.current.handleClickTrain();
    });

    // Should be loading during the API call
    expect(result.current.isLoading).toBe(true);

    // Wait for the API call to resolve
    await act(async () => {
      await trainPromise;
    });

    // Should no longer be loading after the API call
    expect(result.current.isLoading).toBe(false);
  });

  it("should handle API error when submitting GMM job", async () => {
    // Spy on console.error
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    // Make API call throw an error
    const mockError = new Error("API error");
    (apiClient.submitGMMJobs as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useSubmitJob());

    // Call handleClickTrain
    await act(async () => {
      await result.current.handleClickTrain();
    });

    // Should have logged the error
    expect(consoleSpy).toHaveBeenCalledWith(mockError);

    // Should not have navigated
    expect(mockRouter.push).not.toHaveBeenCalled();

    // Should no longer be loading after the error
    expect(result.current.isLoading).toBe(false);

    consoleSpy.mockRestore();
  });

  it("should disable training when params are invalid", () => {
    // Mock invalid params
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector.name === "selector") {
        return selector({
          params: mockParams,
          paramsValid: {
            ...mockParamsValid,
            gmmName: false,
          },
        });
      }
      return selector.toString().includes("paramsValid")
        ? { ...mockParamsValid, gmmName: false }
        : mockParams;
    });

    const { result } = renderHook(() => useSubmitJob());

    // canTrain should be false when any param is invalid
    expect(result.current.canTrain).toBe(false);
  });

  it("should check all params for validity", () => {
    // Test each param individually
    const paramsToTest = [
      "gmmName",
      "vaeId",
      "minNumComponents",
      "maxNumComponents",
      "stepSize",
      "numTrials",
    ];

    for (const param of paramsToTest) {
      // Mock this specific param as invalid
      (useSelector as jest.Mock).mockImplementation((selector) => {
        if (selector.name === "selector") {
          return selector({
            params: mockParams,
            paramsValid: {
              ...mockParamsValid,
              [param]: false,
            },
          });
        }
        return selector.toString().includes("paramsValid")
          ? { ...mockParamsValid, [param]: false }
          : mockParams;
      });

      const { result } = renderHook(() => useSubmitJob());

      // canTrain should be false when any param is invalid
      expect(result.current.canTrain).toBe(false);
    }
  });
});
