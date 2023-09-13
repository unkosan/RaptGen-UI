import useParseFastx from "../useParseFasta";
import { renderHook, act } from "@testing-library/react-hooks";

describe("useParseFastx", () => {
  xit("should return correct initial state", () => {
    const { result } = renderHook(() => useParseFastx());
    const { setFastx, isParsing, isValid, parseResult } = result.current;

    expect(setFastx).toBeInstanceOf(Function);
    expect(isParsing).toBe(false);
    expect(isValid).toBe(false);
    expect(parseResult).toEqual([]);
  });

  it("should parse valid fasta file", async () => {
    const { result } = renderHook(() => useParseFastx());
    const { setFastx } = result.current;

    await act(async () => {
      setFastx(
        new File([">test\nATCG\n".repeat(10)], "test.fasta", {
          type: "text/plain",
        })
      );
    });

    // wait for parsing to finish
    await new Promise((resolve) => setTimeout(resolve, 4000));

    const { isValid, isParsing, parseResult } = result.current;
    expect(isParsing).toBe(false);
    expect(isValid).toBe(true);
    expect(parseResult).toEqual(Array(10).fill({ id: "test", seq: "ATCG" }));
  });

  xit("should not parse invalid fasta file", async () => {
    const { result } = renderHook(() => useParseFastx());
    const { setFastx } = result.current;

    await act(async () => {
      setFastx(
        new File(["@test\nATCG\n".repeat(10)], "test.fasta", {
          type: "text/plain",
        })
      );
    });

    // wait for parsing to finish
    await new Promise((resolve) => setTimeout(resolve, 100));

    const { isValid, isParsing, parseResult } = result.current;
    expect(isParsing).toBe(false);
    expect(isValid).toBe(false);
    expect(parseResult).toEqual([]);
  });

  xit("should not parse null file", async () => {
    const { result } = renderHook(() => useParseFastx());
    const { setFastx } = result.current;

    await act(async () => {
      setFastx(null);
    });

    // wait for parsing to finish
    await new Promise((resolve) => setTimeout(resolve, 100));

    const { isValid, isParsing, parseResult } = result.current;
    expect(isParsing).toBe(false);
    expect(isValid).toBe(false);
    expect(parseResult).toEqual([]);
  });

  xit("should set invalid on parsing", async () => {
    const { result } = renderHook(() => useParseFastx());
    const { setFastx } = result.current;

    await act(async () => {
      setFastx(
        new File([">test\nATCG\n".repeat(1000000)], "test.fasta", {
          type: "text/plain",
        })
      );
    });

    // wait for just initialization
    await new Promise((resolve) => setTimeout(resolve, 10));

    const { isValid, isParsing, parseResult } = result.current;
    expect(isParsing).toBe(true);
    expect(isValid).toBe(false);
    expect(parseResult).toEqual([]);
  });

  xit("should resume parsing when setting new file", async () => {
    const { result } = renderHook(() => useParseFastx());
    const { setFastx } = result.current;

    await act(async () => {
      setFastx(
        new File([">test\nATCG\n".repeat(200)], "test.fasta", {
          type: "text/plain",
        })
      );
    });

    await act(async () => {
      setFastx(
        new File([">test2\nGCTA\n".repeat(100)], "test.fasta", {
          type: "text/plain",
        })
      );
    });

    // wait for parsing to finish
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const { isValid, isParsing, parseResult } = result.current;
    expect(isParsing).toBe(false);
    expect(isValid).toBe(true);
    expect(parseResult).toEqual(Array(200).fill({ id: "test", seq: "ATCG" }));
  });

  xit("should resume parsing after setting empty file", async () => {
    const { result } = renderHook(() => useParseFastx());
    const { setFastx } = result.current;

    await act(async () => {
      setFastx(
        new File([">test\nATCG\n".repeat(200)], "test.fasta", {
          type: "text/plain",
        })
      );
    });

    await act(async () => {
      setFastx(null);
    });

    // wait for parsing to finish
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const { isValid, isParsing, parseResult } = result.current;
    expect(isParsing).toBe(false);
    expect(isValid).toBe(true);
    expect(parseResult).toEqual(Array(200).fill({ id: "test", seq: "ATCG" }));
  });

  xit("should parse valid fastq file", async () => {
    const { result } = renderHook(() => useParseFastx());
    const { setFastx } = result.current;

    await act(async () => {
      setFastx(
        new File(["@test\nATCG\n+\nAAAA\n".repeat(10)], "test.fastq", {
          type: "text/plain",
        })
      );
    });

    // wait for parsing to finish
    await new Promise((resolve) => setTimeout(resolve, 100));

    const { isValid, isParsing, parseResult } = result.current;
    expect(isParsing).toBe(false);
    expect(isValid).toBe(true);
    expect(parseResult).toEqual(Array(10).fill({ id: "test", seq: "ATCG" }));
  });
});
