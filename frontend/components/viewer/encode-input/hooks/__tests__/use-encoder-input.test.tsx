import { renderHook, waitFor, act } from "@testing-library/react";
import { useFastaEncoder, useFormEncoder } from "../use-encoder-input";
import { useDispatch, useSelector } from "react-redux";
import { setEncoded } from "../../../redux/interaction-data";
import { apiClient } from "~/services/api-client";

// Mock React Redux
jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

// Mock Redux actions
jest.mock("../../../redux/interaction-data", () => ({
  setEncoded: jest.fn((data) => ({
    type: "interactionData/setEncoded",
    payload: data,
  })),
}));

// Mock API client
jest.mock("~/services/api-client", () => ({
  apiClient: {
    encode: jest.fn(),
  },
}));

describe("useFastaEncoder", () => {
  let mockDispatch: jest.Mock;
  const mockEncodedData = {
    ids: [],
    randomRegions: [],
    coordsX: [],
    coordsY: [],
    shown: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch = jest.fn();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useSelector as jest.Mock).mockImplementation(() => mockEncodedData);
    (apiClient.encode as jest.Mock).mockResolvedValue({
      coords_x: [0.1, 0.2],
      coords_y: [0.3, 0.4],
    });
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useFastaEncoder("test-session-id"));

    expect(result.current.isValid).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(typeof result.current.handleFileChange).toBe("function");
  });

  it("should do nothing if sessionId is not provided", async () => {
    const { result } = renderHook(() => useFastaEncoder(""));

    const file = new File(["dummy content"], "test.fasta", {
      type: "text/plain",
    });
    const fileChangeEvent = {
      target: {
        files: [file],
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileChange(fileChangeEvent);
    });

    expect(apiClient.encode).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("should do nothing if no file is selected", async () => {
    const { result } = renderHook(() => useFastaEncoder("test-session-id"));

    const fileChangeEvent = {
      target: {
        files: null,
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileChange(fileChangeEvent);
    });

    expect(apiClient.encode).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("should process valid FASTA file and dispatch encoded data", async () => {
    const { result } = renderHook(() => useFastaEncoder("test-session-id"));

    // Mock FileReader
    const mockFileReader = {
      onload: null as any,
      readAsText: jest.fn(function (this: any, file: Blob) {
        // Simulate a valid FASTA file content
        const validFastaContent = ">Sequence1\nACGTACGT\n>Sequence2\nGTACGTAC";
        setTimeout(() => {
          this.onload({ target: { result: validFastaContent } });
        }, 0);
      }),
    };

    // Replace the global FileReader with our mock
    const originalFileReader = global.FileReader;
    global.FileReader = jest.fn(() => mockFileReader) as any;

    const file = new File(["dummy content"], "test.fasta", {
      type: "text/plain",
    });
    const fileChangeEvent = {
      target: {
        files: [file],
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      result.current.handleFileChange(fileChangeEvent);
    });

    // Simulate FileReader completing
    await waitFor(() => {
      expect(mockFileReader.readAsText).toHaveBeenCalledWith(file);
    });

    // Verify API call
    await waitFor(() => {
      expect(apiClient.encode).toHaveBeenCalledWith({
        session_uuid: "test-session-id",
        sequences: ["ACGUACGU", "GUACGUAC"], // Note T is replaced with U
      });
    });

    // Verify dispatch
    await waitFor(() => {
      expect(setEncoded).toHaveBeenCalledWith({
        ids: ["Sequence1", "Sequence2"],
        randomRegions: ["ACGUACGU", "GUACGUAC"],
        coordsX: [0.1, 0.2],
        coordsY: [0.3, 0.4],
        shown: [true, true],
      });
    });

    // Verify loading state changes
    expect(result.current.isValid).toBe(true);

    // Restore original FileReader
    global.FileReader = originalFileReader;
  });

  it("should set isValid to false for invalid FASTA format", async () => {
    const { result } = renderHook(() => useFastaEncoder("test-session-id"));

    // Mock FileReader
    const mockFileReader = {
      onload: null as any,
      readAsText: jest.fn(function (this: any, file: Blob) {
        // Simulate an invalid FASTA file content
        const invalidFastaContent = "This is not a valid FASTA format";
        setTimeout(() => {
          this.onload({ target: { result: invalidFastaContent } });
        }, 0);
      }),
    };

    // Replace the global FileReader with our mock
    const originalFileReader = global.FileReader;
    global.FileReader = jest.fn(() => mockFileReader) as any;

    const file = new File(["dummy content"], "test.fasta", {
      type: "text/plain",
    });
    const fileChangeEvent = {
      target: {
        files: [file],
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      result.current.handleFileChange(fileChangeEvent);
    });

    // Simulate FileReader completing
    await waitFor(() => {
      expect(mockFileReader.readAsText).toHaveBeenCalledWith(file);
    });

    // Verify isValid is set to false
    await waitFor(() => {
      expect(result.current.isValid).toBe(false);
    });

    // Verify API call was not made
    expect(apiClient.encode).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();

    // Restore original FileReader
    global.FileReader = originalFileReader;
  });

  it("should handle API errors gracefully", async () => {
    // Mock API to throw an error
    (apiClient.encode as jest.Mock).mockRejectedValue(new Error("API error"));

    const { result } = renderHook(() => useFastaEncoder("test-session-id"));

    // Spy on console.error
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    // Mock FileReader
    const mockFileReader = {
      onload: null as any,
      readAsText: jest.fn(function (this: any, file: Blob) {
        // Simulate a valid FASTA file content
        const validFastaContent = ">Sequence1\nACGTACGT";
        setTimeout(() => {
          this.onload({ target: { result: validFastaContent } });
        }, 0);
      }),
    };

    // Replace the global FileReader with our mock
    const originalFileReader = global.FileReader;
    global.FileReader = jest.fn(() => mockFileReader) as any;

    const file = new File(["dummy content"], "test.fasta", {
      type: "text/plain",
    });
    const fileChangeEvent = {
      target: {
        files: [file],
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      result.current.handleFileChange(fileChangeEvent);
    });

    // Verify error is logged
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
    });

    // Verify loading state is reset
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Restore console.error
    consoleErrorSpy.mockRestore();

    // Restore original FileReader
    global.FileReader = originalFileReader;
  });
});

describe("useFormEncoder", () => {
  let mockDispatch: jest.Mock;
  const mockEncodedData = {
    ids: [],
    randomRegions: [],
    coordsX: [],
    coordsY: [],
    shown: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch = jest.fn();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useSelector as jest.Mock).mockImplementation(() => mockEncodedData);
    (apiClient.encode as jest.Mock).mockResolvedValue({
      coords_x: [0.5],
      coords_y: [0.6],
    });
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useFormEncoder("test-session-id"));

    expect(result.current.value).toBe("");
    expect(result.current.isValid).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(typeof result.current.handleChange).toBe("function");
    expect(typeof result.current.handleAdd).toBe("function");
  });

  it("should update value and validate on onChange", () => {
    const { result } = renderHook(() => useFormEncoder("test-session-id"));

    // Valid input
    act(() => {
      result.current.handleChange({
        target: { value: "ACGT" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.value).toBe("ACGU"); // T is replaced with U
    expect(result.current.isValid).toBe(true);

    // Invalid input
    act(() => {
      result.current.handleChange({
        target: { value: "ACGTXYZ" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.value).toBe("ACGUXYZ"); // T is replaced with U
    expect(result.current.isValid).toBe(false);
  });

  it("should do nothing if sessionId is not provided", async () => {
    const { result } = renderHook(() => useFormEncoder(""));

    // Set a valid value
    act(() => {
      result.current.handleChange({
        target: { value: "ACGT" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // Try to add
    await act(async () => {
      await result.current.handleAdd();
    });

    expect(apiClient.encode).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("should do nothing if input is invalid", async () => {
    const { result } = renderHook(() => useFormEncoder("test-session-id"));

    // Set an invalid value
    act(() => {
      result.current.handleChange({
        target: { value: "ACGTXYZ" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // Try to add
    await act(async () => {
      await result.current.handleAdd();
    });

    expect(apiClient.encode).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("should encode valid input and dispatch data", async () => {
    const { result } = renderHook(() => useFormEncoder("test-session-id"));

    // Set a valid value
    act(() => {
      result.current.handleChange({
        target: { value: "ACGT" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // Add the sequence
    await act(async () => {
      await result.current.handleAdd();
    });

    // Verify API call
    expect(apiClient.encode).toHaveBeenCalledWith({
      session_uuid: "test-session-id",
      sequences: ["ACGU"], // T is replaced with U
    });

    // Verify dispatch
    expect(setEncoded).toHaveBeenCalledWith({
      ids: ["manual-0"],
      randomRegions: ["ACGU"],
      coordsX: [0.5],
      coordsY: [0.6],
      shown: [true],
    });

    // Verify loading state changes
    expect(result.current.isLoading).toBe(false);
  });

  it("should handle API errors gracefully", async () => {
    // Mock API to throw an error
    (apiClient.encode as jest.Mock).mockRejectedValue(new Error("API error"));

    const { result } = renderHook(() => useFormEncoder("test-session-id"));

    // Spy on console.error
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    // Set a valid value
    act(() => {
      result.current.handleChange({
        target: { value: "ACGT" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // Add the sequence
    await act(async () => {
      await result.current.handleAdd();
    });

    // Verify error is logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));

    // Verify loading state is reset
    expect(result.current.isLoading).toBe(false);

    // Restore console.error
    consoleErrorSpy.mockRestore();
  });
});
