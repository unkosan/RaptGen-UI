import usePagenation from "../usePagenation";
import { renderHook, act, waitFor } from "@testing-library/react";

describe("usePagenation", () => {
  it("should set page index", () => {
    const { result } = renderHook(() => usePagenation(100, 10));
    const { setPageIndex } = result.current;

    act(() => {
      setPageIndex(2);
    });

    expect(result.current.pageIndex).toBe(2);
  });

  it("start index should be 0 and end to be 9 if page index is 1 and pageSize is 10", () => {
    const { result } = renderHook(() => usePagenation(100, 10));
    const { setPageIndex } = result.current;

    act(() => {
      setPageIndex(1);
    });

    expect(result.current.startIndex).toBe(0);
    expect(result.current.endIndex).toBe(9);
  });

  it("last page should have correct start and end index", () => {
    const { result } = renderHook(() => usePagenation(100, 10));
    const { setPageIndex } = result.current;

    act(() => {
      setPageIndex(10);
    });

    expect(result.current.startIndex).toBe(90);
    expect(result.current.endIndex).toBe(99);
  });

  it("should set page index to 1 if it is less than 1", () => {
    const { result } = renderHook(() => usePagenation(100, 10));
    const { setPageIndex } = result.current;

    act(() => {
      setPageIndex(0);
    });

    expect(result.current.pageIndex).toBe(1);
  });

  it("should set page index to page count if it is greater than page count", () => {
    const { result } = renderHook(() => usePagenation(100, 10));
    const { setPageIndex } = result.current;

    act(() => {
      setPageIndex(11);
    });

    expect(result.current.pageIndex).toBe(10);
  });
});
