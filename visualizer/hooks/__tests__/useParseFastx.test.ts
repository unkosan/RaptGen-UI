import { File } from "web-file-polyfill";
import useParseFastx from "../useParseFastx";
import { renderHook, act, waitFor } from "@testing-library/react";

import workerpool from "workerpool";
const pool = workerpool.pool({
  maxWorkers: 1,
});

describe("useParseFastx", () => {
  afterEach(async () => {
    await pool.terminate(true, 1000);
    // wait for worker finish initialization
    await new Promise((resolve) => setTimeout(resolve, 200));
  });

  it("should parse valid fasta file", async () => {
    const { result } = renderHook(() => useParseFastx(pool));
    const { setFastx } = result.current;

    await act(async () => {
      await setFastx(
        new File([">test\nATCG\n".repeat(100000)], "test.fasta", {
          type: "text/plain",
        })
      );
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    const { isValid, isParsing, parseResult } = result.current;
    expect(isParsing).toBe(true);
    expect(isValid).toBe(false);
    expect(parseResult).toEqual([]);

    // wait for parsing to finish
    await waitFor(
      () => {
        expect(result.current.isParsing).toBe(false);
        expect(result.current.isValid).toBe(true);
      },
      { timeout: 5000 }
    );

    const {
      isValid: isValid2,
      isParsing: isParsing2,
      parseResult: parseResult2,
    } = result.current;
    expect(isParsing2).toBe(false);
    expect(isValid2).toBe(true);
    expect(parseResult2).toEqual(
      Array(100000).fill({ id: "test", seq: "ATCG" })
    );
  });

  it("should not parse invalid fasta file", async () => {
    const { result } = renderHook(() => useParseFastx(pool));
    const { setFastx } = result.current;

    await act(async () => {
      await setFastx(
        new File(["@test\nATCG\n".repeat(100000)], "test.fasta", {
          type: "text/plain",
        })
      );
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    const { isValid, isParsing, parseResult } = result.current;
    expect(isParsing).toBe(true);
    expect(isValid).toBe(false);
    expect(parseResult).toEqual([]);

    // wait for parsing to finish
    await waitFor(
      () => {
        expect(result.current.isParsing).toBe(false);
        expect(result.current.isValid).toBe(false);
      },
      { timeout: 5000 }
    );

    const {
      isValid: isValid2,
      isParsing: isParsing2,
      parseResult: parseResult2,
    } = result.current;
    expect(isParsing2).toBe(false);
    expect(isValid2).toBe(false);
    expect(parseResult2).toEqual([]);
  });

  it("should not parse null file", async () => {
    const { result } = renderHook(() => useParseFastx(pool));
    const { setFastx } = result.current;

    await act(async () => {
      setFastx(null);
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    await waitFor(
      () => {
        expect(result.current.isParsing).toBe(false);
        expect(result.current.isValid).toBe(false);
      },
      { timeout: 6000 }
    );

    const { isValid, isParsing, parseResult } = result.current;
    expect(isParsing).toBe(false);
    expect(isValid).toBe(false);
    expect(parseResult).toEqual([]);
  });

  it("should cancel parsing", async () => {
    const { result } = renderHook(() => useParseFastx(pool));
    const { cancelParsing, setFastx } = result.current;

    await act(async () => {
      await setFastx(
        new File([">test\nATCG\n".repeat(100000)], "test.fasta", {
          type: "text/plain",
        })
      );
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    const { isParsing, isValid } = result.current;
    expect(isParsing).toBe(true);
    expect(isValid).toBe(false);

    await act(async () => {
      cancelParsing();
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    await waitFor(
      () => {
        expect(result.current.isParsing).toBe(false);
        expect(result.current.isValid).toBe(false);
      },
      { timeout: 6000 }
    );

    const {
      isValid: isValid2,
      isParsing: isParsing2,
      parseResult: parseResult2,
    } = result.current;
    expect(isParsing2).toBe(false);
    expect(isValid2).toBe(false);
    expect(parseResult2).toEqual([]);
  });

  it("should reset parsing when setting new file", async () => {
    const { result } = renderHook(() => useParseFastx(pool));
    const { setFastx } = result.current;

    await act(async () => {
      await setFastx(
        new File([">test\nATCG\n".repeat(100000)], "test.fasta", {
          type: "text/plain",
        })
      );
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    const { isValid, isParsing, parseResult } = result.current;
    expect(isParsing).toBe(true);
    expect(isValid).toBe(false);
    expect(parseResult).toEqual([]);

    await act(async () => {
      await setFastx(
        new File([">test2\nGCTA\n".repeat(10)], "test.fasta", {
          type: "text/plain",
        })
      );
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    await waitFor(
      () => {
        expect(result.current.isParsing).toBe(false);
        expect(result.current.isValid).toBe(true);
      },
      { timeout: 6000 }
    );

    const {
      isValid: isValid2,
      isParsing: isParsing2,
      parseResult: parseResult2,
    } = result.current;
    expect(isParsing2).toBe(false);
    expect(isValid2).toBe(true);
    expect(parseResult2).toEqual(Array(10).fill({ id: "test2", seq: "GCTA" }));
  });

  it("should stop parsing after setting empty file", async () => {
    const { result } = renderHook(() => useParseFastx(pool));
    const { setFastx } = result.current;

    await act(async () => {
      await setFastx(
        new File([">test\nATCG\n".repeat(100000)], "test.fasta", {
          type: "text/plain",
        })
      );
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    const { isValid, isParsing, parseResult } = result.current;
    expect(isParsing).toBe(true);
    expect(isValid).toBe(false);
    expect(parseResult).toEqual([]);

    await act(async () => {
      await setFastx(null);
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    await waitFor(
      () => {
        expect(result.current.isParsing).toBe(false);
        expect(result.current.isValid).toBe(false);
      },
      { timeout: 6000 }
    );

    const {
      isValid: isValid2,
      isParsing: isParsing2,
      parseResult: parseResult2,
    } = result.current;
    expect(isParsing2).toBe(false);
    expect(isValid2).toBe(false);
    expect(parseResult2).toEqual([]);
  });

  it("should parse valid fastq file", async () => {
    const { result } = renderHook(() => useParseFastx(pool));
    const { setFastx } = result.current;

    await act(async () => {
      await setFastx(
        new File(["@test\nATCG\n+\nAAAA\n".repeat(10)], "test.fastq", {
          type: "text/plain",
        })
      );
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    const { isValid, isParsing, parseResult } = result.current;
    expect(isParsing).toBe(true);
    expect(isValid).toBe(false);
    expect(parseResult).toEqual([]);

    await waitFor(
      () => {
        expect(result.current.isParsing).toBe(false);
        expect(result.current.isValid).toBe(true);
      },
      { timeout: 6000 }
    );

    const {
      isValid: isValid2,
      isParsing: isParsing2,
      parseResult: parseResult2,
    } = result.current;
    expect(isParsing2).toBe(false);
    expect(isValid2).toBe(true);
    expect(parseResult2).toEqual(Array(10).fill({ id: "test", seq: "ATCG" }));
  });
});
