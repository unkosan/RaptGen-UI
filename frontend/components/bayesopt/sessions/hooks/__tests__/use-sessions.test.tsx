import { renderHook, waitFor } from "@testing-library/react";
import { useSessions } from "../use-sessions";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { apiClient } from "~/services/api-client";
import { setIsDirty } from "../../../redux/is-dirty";
import { act } from "react-dom/test-utils";

// Mock React Redux
jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

// Mock Next.js router
jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

// Mock API client
jest.mock("~/services/api-client", () => ({
  apiClient: {
    listExperiments: jest.fn(),
    updateExperiment: jest.fn(),
    submitExperiment: jest.fn(),
    patchExperiment: jest.fn(),
    deleteExperiment: jest.fn(),
  },
}));

// Mock Redux actions
jest.mock("../../../redux/is-dirty", () => ({
  setIsDirty: jest.fn((data) => ({
    type: "isDirty/setIsDirty",
    payload: data,
  })),
}));

// Mock window.confirm
const originalConfirm = window.confirm;
const mockConfirm = jest.fn();

describe("useSessions", () => {
  let mockDispatch: jest.Mock;
  let mockPush: jest.Mock;

  // Mock data for testing
  const mockSessionEntries = [
    { uuid: "uuid1", name: "Session 1" },
    { uuid: "uuid2", name: "Session 2" },
  ];

  const mockGraphConfig = {
    vaeName: "test-vae",
    minCount: 5,
    showSelex: true,
    showAcquisition: true,
  };

  const mockSessionConfig = {
    sessionId: "uuid1",
    vaeId: "vae-uuid",
  };

  const mockBayesoptConfig = {
    targetColumn: "col1",
    queryBudget: 5,
  };

  const mockQueriedValues = {
    randomRegion: ["AUGC", "CGUA"],
    coordOriginalX: [1.0, 2.0],
    coordOriginalY: [1.5, 2.5],
    coordX: [1.1, 2.1],
    coordY: [1.6, 2.6],
    staged: [true, false],
    masterboxChecked: true,
  };

  const mockRegisteredValues = {
    id: ["id1", "id2"],
    randomRegion: ["AUCG", "GCAU"],
    coordX: [3.0, 4.0],
    coordY: [3.5, 4.5],
    staged: [true, false],
    masterboxChecked: true,
    columnNames: ["col1", "col2"],
    sequenceIndex: [0, 0, 1, 1],
    column: ["col1", "col2", "col1", "col2"],
    value: [10, 20, 30, 40],
  };

  const mockAcquisitionValues = {
    acquisitionValues: [0.1, 0.2, 0.3, 0.4],
    coordX: [1.0, 2.0, 3.0, 4.0],
    coordY: [1.5, 2.5, 3.5, 4.5],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock window.confirm
    window.confirm = mockConfirm;

    // Mock dispatch
    mockDispatch = jest.fn();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);

    // Mock router
    mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      query: { uuid: "uuid1" },
      isReady: true,
      push: mockPush,
    });

    // Mock API responses
    (apiClient.listExperiments as jest.Mock).mockResolvedValue(
      mockSessionEntries
    );
    (apiClient.updateExperiment as jest.Mock).mockResolvedValue({});
    (apiClient.submitExperiment as jest.Mock).mockResolvedValue({
      uuid: "new-uuid",
    });
    (apiClient.patchExperiment as jest.Mock).mockResolvedValue({});
    (apiClient.deleteExperiment as jest.Mock).mockResolvedValue({});

    // Mock Redux selectors
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector.toString().includes("graphConfig")) {
        return mockGraphConfig;
      } else if (selector.toString().includes("sessionConfig")) {
        return mockSessionConfig;
      } else if (selector.toString().includes("bayesoptConfig")) {
        return mockBayesoptConfig;
      } else if (selector.toString().includes("queriedValues")) {
        return mockQueriedValues;
      } else if (selector.toString().includes("registeredValues")) {
        return mockRegisteredValues;
      } else if (selector.toString().includes("acquisitionValues")) {
        return mockAcquisitionValues;
      } else if (selector.toString().includes("isDirty")) {
        return true;
      }
      return null;
    });
  });

  afterEach(() => {
    window.confirm = originalConfirm;
  });

  it("should fetch session entries on mount", async () => {
    const { result } = renderHook(() => useSessions());

    // Wait for the useEffect to run
    await waitFor(() => {
      expect(apiClient.listExperiments).toHaveBeenCalled();
    });

    // Check that sessionEntries is set correctly
    expect(result.current.sessionEntries).toEqual(mockSessionEntries);
  });

  it("should set current session name based on UUID", async () => {
    const { result } = renderHook(() => useSessions());

    // Wait for the useEffect to run
    await waitFor(() => {
      expect(result.current.currentSessionName).toBe("Session 1");
    });
  });

  it("should save the current experiment", async () => {
    const { result } = renderHook(() => useSessions());

    // Call handleSave
    await act(async () => {
      await result.current.handleSave();
    });

    // Check that updateExperiment was called with correct parameters
    expect(apiClient.updateExperiment).toHaveBeenCalled();
    const updateCall = (apiClient.updateExperiment as jest.Mock).mock
      .calls[0][0];

    // Verify that the experiment state was created correctly
    expect(updateCall.VAE_name).toBe("test-vae");
    expect(updateCall.VAE_uuid).toBe("vae-uuid");
    expect(updateCall.optimization_config.target_column_name).toBe("col1");
    expect(updateCall.optimization_config.query_budget).toBe(5);

    // Check that setIsDirty was called with false
    expect(setIsDirty).toHaveBeenCalledWith(false);

    // Check that dispatch was called
    expect(mockDispatch).toHaveBeenCalled();
  });

  it("should save the experiment with a new name", async () => {
    const { result } = renderHook(() => useSessions());

    // Call handleSaveAs
    await act(async () => {
      await result.current.handleSaveAs("New Session");
    });

    // Check that submitExperiment was called with correct parameters
    expect(apiClient.submitExperiment).toHaveBeenCalled();
    const submitCall = (apiClient.submitExperiment as jest.Mock).mock
      .calls[0][0];

    // Verify that the experiment state was created correctly
    expect(submitCall.experiment_name).toBe("New Session");
    expect(submitCall.VAE_name).toBe("test-vae");
    expect(submitCall.VAE_uuid).toBe("vae-uuid");

    // Check that setIsDirty was called with false
    expect(setIsDirty).toHaveBeenCalledWith(false);

    // Check that push was called with the new UUID
    expect(mockPush).toHaveBeenCalledWith("?uuid=new-uuid");

    // Check that dispatch was called
    expect(mockDispatch).toHaveBeenCalled();
  });

  it("should create a new experiment after confirmation", async () => {
    // Mock confirm to return true
    mockConfirm.mockReturnValue(true);

    const { result } = renderHook(() => useSessions());

    // Call handleNew
    await act(async () => {
      await result.current.handleNew();
    });

    // Check that confirm was called
    expect(mockConfirm).toHaveBeenCalledWith("Discard changes?");

    // Check that push was called with empty UUID
    expect(mockPush).toHaveBeenCalledWith("?uuid=");
  });

  it("should not create a new experiment if confirmation is cancelled", async () => {
    // Mock confirm to return false
    mockConfirm.mockReturnValue(false);

    const { result } = renderHook(() => useSessions());

    // Call handleNew
    await act(async () => {
      await result.current.handleNew();
    });

    // Check that confirm was called
    expect(mockConfirm).toHaveBeenCalledWith("Discard changes?");

    // Check that push was not called
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("should rename an experiment", async () => {
    const { result } = renderHook(() => useSessions());

    // Set target entry
    act(() => {
      result.current.setTargetEntry("uuid2", "Session 2");
    });

    // Call handleRename
    await act(async () => {
      await result.current.handleRename("Renamed Session");
    });

    // Check that patchExperiment was called with correct parameters
    expect(apiClient.patchExperiment).toHaveBeenCalled();
    const patchCall = (apiClient.patchExperiment as jest.Mock).mock.calls[0][0];

    // Verify that the patch data was created correctly
    expect(patchCall.target).toBe("experiment_name");
    expect(patchCall.value).toBe("Renamed Session");

    // Check that listExperiments was called to update the list
    expect(apiClient.listExperiments).toHaveBeenCalled();
  });

  it("should delete an experiment", async () => {
    const { result } = renderHook(() => useSessions());

    // Set target entry
    act(() => {
      result.current.setTargetEntry("uuid2", "Session 2");
    });

    // Call handleDelete
    await act(async () => {
      await result.current.handleDelete();
    });

    // Check that deleteExperiment was called with correct parameters
    expect(apiClient.deleteExperiment).toHaveBeenCalled();
    const deleteOptions = (apiClient.deleteExperiment as jest.Mock).mock
      .calls[0][1];

    // Verify that the delete options were created correctly
    expect(deleteOptions.params.uuid).toBe("uuid2");

    // Check that listExperiments was called to update the list
    expect(apiClient.listExperiments).toHaveBeenCalled();

    // Check that push was not called since the deleted UUID is not the current UUID
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("should navigate to empty UUID when deleting the current experiment", async () => {
    // Mock router with the same UUID for current and selected
    (useRouter as jest.Mock).mockReturnValue({
      query: { uuid: "uuid2" },
      isReady: true,
      push: mockPush,
    });

    const { result } = renderHook(() => useSessions());

    // Set target entry to the same UUID as current
    act(() => {
      result.current.setTargetEntry("uuid2", "Session 2");
    });

    // Call handleDelete
    await act(async () => {
      await result.current.handleDelete();
    });

    // Check that deleteExperiment was called
    expect(apiClient.deleteExperiment).toHaveBeenCalled();

    // Check that push was called with empty UUID
    expect(mockPush).toHaveBeenCalledWith("?uuid=");
  });

  it("should handle API errors gracefully", async () => {
    // Mock API error
    const mockError = new Error("API error");
    (apiClient.updateExperiment as jest.Mock).mockRejectedValue(mockError);

    // Spy on console.error
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    const { result } = renderHook(() => useSessions());

    // Call handleSave
    await act(async () => {
      await result.current.handleSave();
    });

    // Check that error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error saving experiment:",
      mockError
    );

    // Should not be saving after error
    expect(result.current.isSaving).toBe(false);

    consoleSpy.mockRestore();
  });
});
