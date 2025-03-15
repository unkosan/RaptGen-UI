import { renderHook, act } from "@testing-library/react";
import { useGmmParams } from "../use-gmm-params";
import { useDispatch, useSelector } from "react-redux";
import { setParams } from "../../../redux/params";
import { setParamsValid } from "../../../redux/paramsValid";
import { apiClient } from "~/services/api-client";

// Mock React Redux
jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

// Mock Redux actions
jest.mock("../../../redux/params", () => ({
  setParams: jest.fn((data) => ({
    type: "params/setParams",
    payload: data,
  })),
}));

jest.mock("../../../redux/paramsValid", () => ({
  setParamsValid: jest.fn((data) => ({
    type: "paramsValid/setParamsValid",
    payload: data,
  })),
}));

// Mock API client
jest.mock("~/services/api-client", () => ({
  apiClient: {
    getVAEModelNames: jest.fn(),
  },
}));

describe("useGmmParams", () => {
  let mockDispatch: jest.Mock;

  const mockParams = {
    gmmName: "Test GMM",
    vaeId: "test-vae-id",
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

  const mockVaeModels = {
    entries: [
      { uuid: "vae-1", name: "VAE Model 1" },
      { uuid: "vae-2", name: "VAE Model 2" },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch = jest.fn();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Mock the selector function to return our mock state
      if (selector.name === "selector") {
        return selector({ params: mockParams, paramsValid: mockParamsValid });
      }
      return mockParams;
    });
    (apiClient.getVAEModelNames as jest.Mock).mockResolvedValue(mockVaeModels);
  });

  it("should fetch VAE models on mount", async () => {
    const { result, rerender } = renderHook(() => useGmmParams());

    // Wait for the useEffect to run
    await act(async () => {
      await Promise.resolve();
    });

    expect(apiClient.getVAEModelNames).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "params/setParams",
        payload: expect.objectContaining({
          vaeId: "vae-1",
        }),
      })
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "paramsValid/setParamsValid",
        payload: expect.objectContaining({
          vaeId: true,
        }),
      })
    );
  });

  it("should handle VAE model selection change", async () => {
    const { result } = renderHook(() => useGmmParams());

    // Wait for the useEffect to run
    await act(async () => {
      await Promise.resolve();
    });

    // Simulate changing the VAE model
    act(() => {
      result.current.vaeModel.handleChange({
        target: { value: "vae-2" },
      } as React.ChangeEvent<HTMLSelectElement>);
    });

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "params/setParams",
        payload: expect.objectContaining({
          vaeId: "vae-2",
        }),
      })
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "paramsValid/setParamsValid",
        payload: expect.objectContaining({
          vaeId: true,
        }),
      })
    );
  });

  it("should handle GMM name change", () => {
    const { result } = renderHook(() => useGmmParams());

    // Simulate changing the GMM name
    act(() => {
      result.current.gmmName.handleChange({
        target: { value: "New GMM Name" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "paramsValid/setParamsValid",
        payload: expect.objectContaining({
          gmmName: true,
        }),
      })
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "params/setParams",
        payload: expect.objectContaining({
          gmmName: "New GMM Name",
        }),
      })
    );
  });

  it("should handle minNumComponents change", () => {
    const { result } = renderHook(() => useGmmParams());

    // Simulate changing the minNumComponents
    act(() => {
      result.current.minNumComponents.handleChange({
        target: { value: "10" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "paramsValid/setParamsValid",
        payload: expect.objectContaining({
          minNumComponents: true,
        }),
      })
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "params/setParams",
        payload: expect.objectContaining({
          minNumComponents: 10,
        }),
      })
    );
  });

  it("should handle maxNumComponents change", () => {
    const { result } = renderHook(() => useGmmParams());

    // Simulate changing the maxNumComponents
    act(() => {
      result.current.maxNumComponents.handleChange({
        target: { value: "20" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "paramsValid/setParamsValid",
        payload: expect.objectContaining({
          maxNumComponents: true,
        }),
      })
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "params/setParams",
        payload: expect.objectContaining({
          maxNumComponents: 20,
        }),
      })
    );
  });

  it("should handle stepSize change", () => {
    const { result } = renderHook(() => useGmmParams());

    // Simulate changing the stepSize
    act(() => {
      result.current.stepSize.handleChange({
        target: { value: "2" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "paramsValid/setParamsValid",
        payload: expect.objectContaining({
          stepSize: true,
        }),
      })
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "params/setParams",
        payload: expect.objectContaining({
          stepSize: 2,
        }),
      })
    );
  });

  it("should handle numTrials change", () => {
    const { result } = renderHook(() => useGmmParams());

    // Simulate changing the numTrials
    act(() => {
      result.current.numTrials.handleChange({
        target: { value: "5" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "paramsValid/setParamsValid",
        payload: expect.objectContaining({
          numTrials: true,
        }),
      })
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "params/setParams",
        payload: expect.objectContaining({
          numTrials: 5,
        }),
      })
    );
  });

  it("should handle API error when fetching VAE models", async () => {
    // Spy on console.error
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    // Make API call throw an error
    (apiClient.getVAEModelNames as jest.Mock).mockRejectedValue(
      new Error("API error")
    );

    renderHook(() => useGmmParams());

    // Wait for the useEffect to run
    await act(async () => {
      await Promise.resolve();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to fetch VAE models:",
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it("should handle API error when setting VAE model", async () => {
    // Spy on console.error
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    // Make dispatch throw an error
    mockDispatch.mockImplementation(() => {
      throw new Error("Dispatch error");
    });

    const { result } = renderHook(() => useGmmParams());

    // Wait for the useEffect to run
    await act(async () => {
      await Promise.resolve();
    });

    // Simulate changing the VAE model
    act(() => {
      result.current.vaeModel.handleChange({
        target: { value: "vae-2" },
      } as React.ChangeEvent<HTMLSelectElement>);
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to set VAE model:",
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it("should validate minNumComponents and maxNumComponents together", async () => {
    // Mock invalid state first
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector.name === "selector") {
        return selector({
          params: {
            ...mockParams,
            minNumComponents: 20,
            maxNumComponents: 10,
          },
          paramsValid: {
            ...mockParamsValid,
            minNumComponents: false,
            maxNumComponents: false,
          },
        });
      }
      return {
        ...mockParams,
        minNumComponents: 20,
        maxNumComponents: 10,
      };
    });

    const { result, rerender } = renderHook(() => useGmmParams());

    // Now mock valid state to trigger the useEffect
    (useSelector as jest.Mock).mockImplementation((selector) => {
      return selector({
        params: {
          ...mockParams,
          minNumComponents: 5,
          maxNumComponents: 10,
        },
        paramsValid: {
          ...mockParamsValid,
          minNumComponents: false,
          maxNumComponents: false,
        },
      });
    });

    // Force re-render to trigger the useEffect
    rerender();

    // Wait for the useEffect to run
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "paramsValid/setParamsValid",
        payload: expect.objectContaining({
          minNumComponents: true,
          maxNumComponents: true,
        }),
      })
    );
  });
});
