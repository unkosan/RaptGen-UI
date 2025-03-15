import { renderHook } from "@testing-library/react";
import { useCsvDataset } from "../use-csv-dataset";
import { useSelector, useDispatch } from "react-redux";
import { apiClient } from "~/services/api-client";
import { setRegisteredValues } from "../../../redux/registered-values";
import { setBayesoptConfig } from "../../../redux/bayesopt-config";
import { setIsDirty } from "../../../redux/is-dirty";

// Mock React Redux
jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

// Mock API client
jest.mock("~/services/api-client", () => ({
  apiClient: {
    encode: jest.fn(),
  },
}));

// Mock Redux actions
jest.mock("../../../redux/registered-values", () => ({
  setRegisteredValues: jest.fn((data) => ({
    type: "registeredValues/setRegisteredValues",
    payload: data,
  })),
}));

jest.mock("../../../redux/bayesopt-config", () => ({
  setBayesoptConfig: jest.fn((data) => ({
    type: "bayesoptConfig/setBayesoptConfig",
    payload: data,
  })),
}));

jest.mock("../../../redux/is-dirty", () => ({
  setIsDirty: jest.fn((data) => ({
    type: "isDirty/setIsDirty",
    payload: data,
  })),
}));

// Mock window.alert
const mockAlert = jest.fn();
global.alert = mockAlert;

describe("useCsvDataset", () => {
  let mockDispatch: jest.Mock;

  // Mock data for testing
  const mockSessionConfig = {
    sessionId: "session-id",
    vaeId: "vae-id",
    vaeName: "Model 1",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock dispatch
    mockDispatch = jest.fn();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);

    // Mock Redux selectors
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector.toString().includes("sessionConfig")) {
        return mockSessionConfig;
      }
      return null;
    });
  });

  it("should initialize with isLoading=false and isValid=true", () => {
    const { result } = renderHook(() => useCsvDataset());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isValid).toBe(true);
  });

  it("should do nothing when no file is selected", () => {
    // Mock FileReader
    const mockReadAsText = jest.fn();
    const originalFileReader = global.FileReader;
    global.FileReader = jest.fn(() => ({
      readAsText: mockReadAsText,
    })) as any;

    try {
      const { result } = renderHook(() => useCsvDataset());

      // Mock file input event with no files
      const event = {
        target: {
          files: null,
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      // Call handleFileChange
      result.current.handleFileChange(event);

      // Check that readAsText was not called
      expect(mockReadAsText).not.toHaveBeenCalled();
    } finally {
      // Restore FileReader
      global.FileReader = originalFileReader;
    }
  });
});
