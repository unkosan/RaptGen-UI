import { renderHook, waitFor } from "@testing-library/react";
import { useSessionInitializer } from "../use-session-initializer";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { apiClient } from "~/services/api-client";
import { setIsDirty } from "../../redux/is-dirty";
import { setBayesoptConfig } from "../../redux/bayesopt-config";
import { setAcquisitionValues } from "../../redux/acquisition-values";
import { setGraphConfig } from "../../redux/graph-config";
import { setRegisteredValues } from "../../redux/registered-values";
import { setQueriedValues } from "../../redux/queried-values";
import { setSessionConfigByVaeIdName } from "../../redux/session-config";

// Mock Next.js router
jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

// Mock React Redux
jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
}));

// Mock API client
jest.mock("~/services/api-client", () => ({
  apiClient: {
    getVAEModelNames: jest.fn(),
    getExperiment: jest.fn(),
    startSession: jest.fn(),
    encode: jest.fn(),
  },
}));

// Mock Redux actions
jest.mock("../../redux/is-dirty", () => ({
  setIsDirty: jest.fn((data) => ({
    type: "isDirty/setIsDirty",
    payload: data,
  })),
}));

jest.mock("../../redux/bayesopt-config", () => ({
  setBayesoptConfig: jest.fn((data) => ({
    type: "bayesoptConfig/setBayesoptConfig",
    payload: data,
  })),
}));

jest.mock("../../redux/acquisition-values", () => ({
  setAcquisitionValues: jest.fn((data) => ({
    type: "acquisitionValues/setAcquisitionValues",
    payload: data,
  })),
}));

jest.mock("../../redux/graph-config", () => ({
  setGraphConfig: jest.fn((data) => ({
    type: "graphConfig/setGraphConfig",
    payload: data,
  })),
}));

jest.mock("../../redux/registered-values", () => ({
  setRegisteredValues: jest.fn((data) => ({
    type: "registeredValues/setRegisteredValues",
    payload: data,
  })),
}));

jest.mock("../../redux/queried-values", () => ({
  setQueriedValues: jest.fn((data) => ({
    type: "queriedValues/setQueriedValues",
    payload: data,
  })),
}));

jest.mock("../../redux/session-config", () => ({
  setSessionConfigByVaeIdName: jest.fn((data) => ({
    type: "sessionConfig/setSessionConfigByVaeIdName",
    payload: data,
  })),
}));

describe("useSessionInitializer", () => {
  let mockDispatch: jest.Mock;

  // Mock data for testing
  const mockVAEModels = {
    entries: [
      { name: "Model 1", uuid: "vae-uuid-1" },
      { name: "Model 2", uuid: "vae-uuid-2" },
    ],
  };

  const mockExperiment = {
    VAE_uuid: "vae-uuid-1",
    VAE_name: "Model 1",
    plot_config: {
      minimum_count: 5,
      show_training_data: true,
      show_bo_contour: true,
    },
    optimization_config: {
      method_name: "qEI",
      target_column_name: "target",
      query_budget: 3,
    },
    distribution_config: {
      xlim_min: -3.5,
      xlim_max: 3.5,
      ylim_min: -3.5,
      ylim_max: 3.5,
    },
    registered_values_table: {
      ids: ["id1", "id2"],
      sequences: ["AUCG", "GCAU"],
      target_column_names: ["col1", "col2"],
      target_values: [
        [10, 20],
        [30, 40],
      ],
    },
    query_table: {
      sequences: ["AUGC", "CGUA"],
      coords_x_original: [1.0, 2.0],
      coords_y_original: [1.5, 2.5],
    },
    acquisition_mesh: {
      coords_x: [1.0, 2.0, 3.0, 4.0],
      coords_y: [1.5, 2.5, 3.5, 4.5],
      values: [0.1, 0.2, 0.3, 0.4],
    },
  };

  const mockSessionId = {
    uuid: "session-uuid-1",
  };

  const mockEncodeResponse = {
    coords_x: [3.0, 4.0],
    coords_y: [3.5, 4.5],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock dispatch
    mockDispatch = jest.fn((action) => action);
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);

    // Mock API responses
    (apiClient.getVAEModelNames as jest.Mock).mockResolvedValue(mockVAEModels);
    (apiClient.getExperiment as jest.Mock).mockResolvedValue(mockExperiment);
    (apiClient.startSession as jest.Mock).mockResolvedValue(mockSessionId);
    (apiClient.encode as jest.Mock).mockResolvedValue(mockEncodeResponse);
  });

  it("should initialize a new experiment when no UUID is provided", async () => {
    // Mock router with no UUID
    (useRouter as jest.Mock).mockReturnValue({
      query: {},
      isReady: true,
    });

    renderHook(() => useSessionInitializer());

    // Wait for the useEffect to run
    await waitFor(() => {
      expect(apiClient.getVAEModelNames).toHaveBeenCalled();
    });

    // Check that setSessionConfigByVaeIdName was called with correct parameters
    expect(setSessionConfigByVaeIdName).toHaveBeenCalledWith({
      vaeId: "vae-uuid-1",
      vaeName: "Model 1",
    });

    // Check that setBayesoptConfig was called with correct parameters
    expect(setBayesoptConfig).toHaveBeenCalledWith({
      targetColumn: "target",
      queryBudget: 3,
      optimizationType: "qEI",
    });

    // Check that setAcquisitionValues was called with correct parameters
    expect(setAcquisitionValues).toHaveBeenCalled();

    // Check that setGraphConfig was called with correct parameters
    expect(setGraphConfig).toHaveBeenCalledWith({
      vaeName: "Model 1",
      minCount: 5,
      showSelex: true,
      showAcquisition: true,
    });

    // Check that setRegisteredValues was called with correct parameters
    expect(setRegisteredValues).toHaveBeenCalled();

    // Check that setQueriedValues was called with correct parameters
    expect(setQueriedValues).toHaveBeenCalled();

    // Check that setIsDirty was called with false
    expect(setIsDirty).toHaveBeenCalledWith(false);
  });

  it("should restore an experiment when a valid UUID is provided", async () => {
    // Mock router with a valid UUID
    (useRouter as jest.Mock).mockReturnValue({
      query: { uuid: "experiment-uuid-1" },
      isReady: true,
    });

    renderHook(() => useSessionInitializer());

    // Wait for the useEffect to run
    await waitFor(() => {
      expect(apiClient.getExperiment).toHaveBeenCalled();
    });

    // Check that getExperiment was called with correct parameters
    expect(apiClient.getExperiment).toHaveBeenCalledWith({
      params: { uuid: "experiment-uuid-1" },
    });

    // Check that startSession was called with correct parameters
    expect(apiClient.startSession).toHaveBeenCalledWith({
      queries: { vae_uuid: "vae-uuid-1" },
    });

    // Check that encode was called for registered values
    expect(apiClient.encode).toHaveBeenCalledWith({
      session_uuid: "session-uuid-1",
      sequences: ["AUCG", "GCAU"],
    });

    // Check that encode was called for query values
    expect(apiClient.encode).toHaveBeenCalledWith({
      session_uuid: "session-uuid-1",
      sequences: ["AUGC", "CGUA"],
    });

    // Check that setSessionConfigByVaeIdName was called with correct parameters
    expect(setSessionConfigByVaeIdName).toHaveBeenCalledWith({
      vaeId: "vae-uuid-1",
      vaeName: "Model 1",
    });

    // Check that setBayesoptConfig was called with correct parameters
    expect(setBayesoptConfig).toHaveBeenCalledWith({
      targetColumn: "target",
      queryBudget: 3,
      optimizationType: "qEI",
    });

    // Check that setAcquisitionValues was called with correct parameters
    expect(setAcquisitionValues).toHaveBeenCalledWith({
      acquisitionValues: [0.1, 0.2, 0.3, 0.4],
      coordX: [1.0, 2.0, 3.0, 4.0],
      coordY: [1.5, 2.5, 3.5, 4.5],
    });

    // Check that setGraphConfig was called with correct parameters
    expect(setGraphConfig).toHaveBeenCalledWith({
      vaeName: "Model 1",
      minCount: 5,
      showSelex: true,
      showAcquisition: true,
    });

    // Check that setRegisteredValues was called with correct parameters
    expect(setRegisteredValues).toHaveBeenCalled();
    const registeredCall = (setRegisteredValues as unknown as jest.Mock).mock
      .calls[0][0];
    expect(registeredCall.id).toEqual(["id1", "id2"]);
    expect(registeredCall.randomRegion).toEqual(["AUCG", "GCAU"]);
    expect(registeredCall.coordX).toEqual([3.0, 4.0]);
    expect(registeredCall.coordY).toEqual([3.5, 4.5]);

    // Check that setQueriedValues was called with correct parameters
    expect(setQueriedValues).toHaveBeenCalled();
    const queriedCall = (setQueriedValues as unknown as jest.Mock).mock
      .calls[0][0];
    expect(queriedCall.randomRegion).toEqual(["AUGC", "CGUA"]);
    expect(queriedCall.coordX).toEqual([3.0, 4.0]);
    expect(queriedCall.coordY).toEqual([3.5, 4.5]);
    expect(queriedCall.coordOriginalX).toEqual([1.0, 2.0]);
    expect(queriedCall.coordOriginalY).toEqual([1.5, 2.5]);

    // Check that setIsDirty was called with false
    expect(setIsDirty).toHaveBeenCalledWith(false);
  });

  it("should initialize a new experiment when restoring fails", async () => {
    // Mock router with a valid UUID
    (useRouter as jest.Mock).mockReturnValue({
      query: { uuid: "experiment-uuid-1" },
      isReady: true,
    });

    // Mock API error
    (apiClient.getExperiment as jest.Mock).mockRejectedValue(
      new Error("API error")
    );

    // Spy on console.error
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    renderHook(() => useSessionInitializer());

    // Wait for the useEffect to run
    await waitFor(() => {
      expect(apiClient.getExperiment).toHaveBeenCalled();
    });

    // Check that error was logged
    expect(consoleSpy).toHaveBeenCalled();

    // Check that getVAEModelNames was called as fallback
    expect(apiClient.getVAEModelNames).toHaveBeenCalled();

    // Check that setIsDirty was called with false
    expect(setIsDirty).toHaveBeenCalledWith(false);

    consoleSpy.mockRestore();
  });

  it("should handle the case when no VAE models are found", async () => {
    // Mock router with no UUID
    (useRouter as jest.Mock).mockReturnValue({
      query: {},
      isReady: true,
    });

    // Mock empty VAE models
    (apiClient.getVAEModelNames as jest.Mock).mockResolvedValue({
      entries: [],
    });

    // Spy on console.log
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    renderHook(() => useSessionInitializer());

    // Wait for the useEffect to run
    await waitFor(() => {
      expect(apiClient.getVAEModelNames).toHaveBeenCalled();
    });

    // Check that warning was logged
    expect(consoleSpy).toHaveBeenCalledWith("No VAE model found");

    // Check that setSessionConfigByVaeIdName was not called
    expect(setSessionConfigByVaeIdName).not.toHaveBeenCalled();

    // Check that setIsDirty was called with false
    expect(setIsDirty).toHaveBeenCalledWith(false);

    consoleSpy.mockRestore();
  });

  it("should handle session start failure", async () => {
    // Mock router with a valid UUID
    (useRouter as jest.Mock).mockReturnValue({
      query: { uuid: "experiment-uuid-1" },
      isReady: true,
    });

    // Mock session start failure
    (apiClient.startSession as jest.Mock).mockResolvedValue({ uuid: "" });

    renderHook(() => useSessionInitializer());

    // Wait for the useEffect to run
    await waitFor(() => {
      expect(apiClient.startSession).toHaveBeenCalled();
    });

    // Check that getVAEModelNames was called as fallback
    expect(apiClient.getVAEModelNames).toHaveBeenCalled();

    // Check that setIsDirty was called with false
    expect(setIsDirty).toHaveBeenCalledWith(false);
  });

  it("should not initialize if router is not ready", async () => {
    // Mock router not ready
    (useRouter as jest.Mock).mockReturnValue({
      query: {},
      isReady: false,
    });

    renderHook(() => useSessionInitializer());

    // Check that getVAEModelNames was not called
    expect(apiClient.getVAEModelNames).not.toHaveBeenCalled();

    // Check that setIsDirty was not called
    expect(setIsDirty).not.toHaveBeenCalled();
  });
});
