import { renderHook, waitFor } from "@testing-library/react";
import { useBlockTime } from "../use-block-time";
import { act } from "react-dom/test-utils";

describe("useBlockTime", () => {
  // Setup and cleanup for each test
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it("should initialize with lock set to false", () => {
    const { result } = renderHook(() => useBlockTime(500));

    expect(result.current.lock).toBe(false);
  });

  it("should set lock to true when setLock is called", () => {
    const { result } = renderHook(() => useBlockTime(500));

    act(() => {
      result.current.setLock(); // Call setLock
    });

    expect(result.current.lock).toBe(true);
  });

  it("should set lock to false after specified milliseconds", () => {
    const { result } = renderHook(() => useBlockTime(500));

    act(() => {
      result.current.setLock(); // Call setLock
    });

    expect(result.current.lock).toBe(true);

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current.lock).toBe(false);
  });

  it("should not set a timer if lock is false", () => {
    // Explicitly spy on setTimeout
    jest.spyOn(global, "setTimeout");

    renderHook(() => useBlockTime(500));

    // Check that setTimeout was not called
    expect(setTimeout).not.toHaveBeenCalled();
  });

  it("should set a new timer each time lock becomes true", () => {
    const { result } = renderHook(() => useBlockTime(500));
    jest.spyOn(global, "setTimeout");

    // First lock
    act(() => {
      result.current.setLock();
    });

    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 500);

    // Fast-forward time to clear the lock
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current.lock).toBe(false);

    // Second lock
    act(() => {
      result.current.setLock();
    });

    expect(setTimeout).toHaveBeenCalledTimes(2);
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 500);
  });
});
