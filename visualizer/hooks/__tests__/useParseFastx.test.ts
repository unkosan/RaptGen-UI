import { File } from "web-file-polyfill";
import useParseFastx from "../useParseFastx";
import { renderHook, act } from "@testing-library/react";

import workerpool from "workerpool";
const pool = workerpool.pool();

describe("useParseFastx", () => {
  afterAll(() => {
    pool.terminate();
  });

  it("should parse valid fasta file", async () => {
    const { result } = renderHook(() => useParseFastx(pool));
    const { setFastx } = result.current;

    await act(async () => {
      await setFastx(
        new File([">test\nATCG\n".repeat(10)], "test.fasta", {
          type: "text/plain",
        })
      );

      // wait for parsing to finish
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    const { isValid, isParsing, parseResult } = result.current;
    expect(isParsing).toBe(false);
    expect(isValid).toBe(true);
    expect(parseResult).toEqual(Array(10).fill({ id: "test", seq: "ATCG" }));
  });

  it("should not parse invalid fasta file", async () => {
    const { result } = renderHook(() => useParseFastx(pool));
    const { setFastx } = result.current;

    await act(async () => {
      await setFastx(
        new File(["@test\nATCG\n".repeat(10)], "test.fasta", {
          type: "text/plain",
        })
      );

      // wait for parsing to finish
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    const { isValid, isParsing, parseResult } = result.current;
    expect(isParsing).toBe(false);
    expect(isValid).toBe(false);
    expect(parseResult).toEqual([]);
  });

  it("should not parse null file", async () => {
    const { result } = renderHook(() => useParseFastx(pool));
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

  it("should set invalid on parsing", async () => {
    const { result } = renderHook(() => useParseFastx(pool));
    const { cancelParsing, setFastx } = result.current;

    await act(async () => {
      await setFastx(
        new File([">test\nATCG\n".repeat(1000000)], "test.fasta", {
          type: "text/plain",
        })
      );

      // wait for just initialization
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    const { isValid, isParsing, parseResult } = result.current;
    expect(isParsing).toBe(true);
    expect(isValid).toBe(false);
    expect(parseResult).toEqual([]);

    // kill worker
    await act(async () => {
      cancelParsing();

      // wait for termination
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
  });

  it("should cancel parsing", async () => {
    const { result } = renderHook(() => useParseFastx(pool));
    const { cancelParsing, setFastx } = result.current;

    await act(async () => {
      await setFastx(
        new File([">test\nATCG\n".repeat(1000000)], "test.fasta", {
          type: "text/plain",
        })
      );

      // wait for just initialization
      await new Promise((resolve) => setTimeout(resolve, 10));

      cancelParsing();
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const { isValid, isParsing, parseResult } = result.current;
    expect(isParsing).toBe(false);
    expect(isValid).toBe(false);
    expect(parseResult).toEqual([]);
  });

  it("should reset parsing when setting new file", async () => {
    const { result } = renderHook(() => useParseFastx(pool));
    const { setFastx } = result.current;

    await act(async () => {
      await setFastx(
        new File([">test\nATCG\n".repeat(1000000)], "test.fasta", {
          type: "text/plain",
        })
      );
      await setFastx(
        new File([">test2\nGCTA\n".repeat(10)], "test.fasta", {
          type: "text/plain",
        })
      );
      // wait for parsing to finish
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    const { isValid, isParsing, parseResult } = result.current;
    expect(isParsing).toBe(false);
    expect(isValid).toBe(true);
    expect(parseResult).toEqual(Array(10).fill({ id: "test2", seq: "GCTA" }));
  });

  it("should stop parsing after setting empty file", async () => {
    const { result } = renderHook(() => useParseFastx(pool));
    const { setFastx } = result.current;

    await act(async () => {
      await setFastx(
        new File([">test\nATCG\n".repeat(1000000)], "test.fasta", {
          type: "text/plain",
        })
      );
      await setFastx(null);

      // wait for parsing to finish
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    const { isValid, isParsing, parseResult } = result.current;
    expect(isParsing).toBe(false);
    expect(isValid).toBe(false);
    expect(parseResult).toEqual([]);
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

      // wait for parsing to finish
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    const { isValid, isParsing, parseResult } = result.current;
    expect(isParsing).toBe(false);
    expect(isValid).toBe(true);
    expect(parseResult).toEqual(Array(10).fill({ id: "test", seq: "ATCG" }));
  });
});
