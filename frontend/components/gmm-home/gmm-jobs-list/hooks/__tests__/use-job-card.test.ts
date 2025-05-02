import { renderHook, act } from "@testing-library/react";
import { useJobCard } from "../use-job-card";
import { useRouter } from "next/router";

// Mock Next.js router
jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

describe("useJobCard", () => {
  const mockUuid = "test-uuid";
  const mockDuration = 3_600_000; // 1 hour in milliseconds
  const mockRouter = {
    query: {
      experiment: "current-uuid",
    },
    push: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it("should return the current UUID from router query", () => {
    const { result } = renderHook(() => useJobCard({ uuid: mockUuid }));

    expect(result.current.currentUUID).toBe("current-uuid");
  });

  it("should navigate to the job details when handleClick is called", () => {
    const { result } = renderHook(() => useJobCard({ uuid: mockUuid }));

    act(() => {
      result.current.handleClick();
    });

    expect(mockRouter.push).toHaveBeenCalledWith(
      `?experiment=${mockUuid}`,
      undefined,
      {
        scroll: false,
      }
    );
  });

  it("should return different styles based on selection state", () => {
    const { result } = renderHook(() => useJobCard({ uuid: mockUuid }));

    const selectedStyle = result.current.getCardStyle(true);
    const unselectedStyle = result.current.getCardStyle(false);

    expect(selectedStyle.backgroundColor).toBe("lightgray");
    expect(unselectedStyle.backgroundColor).toBe("#E5E5E5");
  });

  it("should format job duration correctly", () => {
    const { result } = renderHook(() => useJobCard({ uuid: mockUuid }));

    const formattedDuration = result.current.formatDurationText(
      "progress",
      mockDuration
    );

    // The exact format might vary based on date-fns version and locale,
    // so we'll just check that it contains the expected parts
    expect(formattedDuration).toContain("Running for");
    expect(formattedDuration).toContain("1h");
  });

  it("should correctly identify progress and suspend statuses", () => {
    const { result } = renderHook(() => useJobCard({ uuid: mockUuid }));

    expect(result.current.isProgressOrSuspend("progress")).toBe(true);
    expect(result.current.isProgressOrSuspend("suspend")).toBe(true);
    expect(result.current.isProgressOrSuspend("success")).toBe(false);
    expect(result.current.isProgressOrSuspend("failure")).toBe(false);
    expect(result.current.isProgressOrSuspend("pending")).toBe(false);
  });

  it("should handle different durations correctly", () => {
    // Test with 30 minutes
    const { result: result1 } = renderHook(() =>
      useJobCard({ uuid: mockUuid })
    );
    const formattedDuration1 = result1.current.formatDurationText(
      "progress",
      1800
    );
    expect(formattedDuration1).toContain("Running for");

    // Test with 2 days
    const { result: result2 } = renderHook(() =>
      useJobCard({ uuid: mockUuid })
    );
    const formattedDuration2 = result2.current.formatDurationText(
      "progress",
      172800
    );
    expect(formattedDuration2).toContain("Running for");

    // Test with 0 seconds
    const { result: result3 } = renderHook(() =>
      useJobCard({ uuid: mockUuid })
    );
    const formattedDuration3 = result3.current.formatDurationText(
      "progress",
      0
    );
    expect(formattedDuration3).toBe("");
  });
});
