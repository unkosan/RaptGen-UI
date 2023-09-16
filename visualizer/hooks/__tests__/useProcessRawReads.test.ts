import useProcessRawReads from "../useProcessRawReads";
import { process, processResultInit } from "../useProcessRawReads";
import { renderHook, act, waitFor } from "@testing-library/react";

import workerpool from "workerpool";
const pool = workerpool.pool({
  maxWorkers: 1,
});

describe("useProcessRawReads", () => {
  const fwd = "AUCG";
  const rev = "UAGC";
  const residues = "AUCG";
  const targetLength = 50;

  const testStrings = Array.from(
    {
      length: 100,
    },
    () => {
      const randomRegion = Array.from(
        {
          length: targetLength,
        },
        () => residues[Math.floor(Math.random() * residues.length)]
      ).join("");
      let wholeString = fwd + randomRegion + rev;

      // mutate random region at random position
      const mutationPosition = Math.floor(Math.random() * targetLength);
      const mutation = residues[Math.floor(Math.random() * residues.length)];
      wholeString =
        wholeString.slice(0, mutationPosition) +
        mutation +
        wholeString.slice(mutationPosition + 1);

      return wholeString;
    }
  );

  const testStrings2 = [
    fwd + "A" + rev,
    fwd + "A" + rev,
    fwd + "A" + rev,
    fwd + "G" + rev,
    fwd + "G" + rev,
    fwd + "C" + rev,
    fwd + "U" + rev,
    fwd + "AU" + rev,
    "A" + fwd + "A" + rev + "A",
  ];

  afterEach(async () => {
    await pool.terminate(true, 1000);
    // wait for worker finish initialization
    await new Promise((resolve) => setTimeout(resolve, 200));
  });

  it("should process strings", () => {
    const processResultTestStrings2 = process(
      testStrings2,
      2,
      0,
      1 + fwd.length + rev.length,
      fwd,
      rev
    );

    expect(processResultTestStrings2).toEqual({
      config: {
        minCount: 2,
        tolerance: 0,
        targetLength: 1 + fwd.length + rev.length,
        fwdPrimer: fwd,
        revPrimer: rev,
      },
      summary: {
        numTotal: 9,
        numFiltered: 7,
        numUnique: 2,
        uniqueRatio: 2 / 7,
      },
      data: {
        seqs: [fwd + "A" + rev, fwd + "G" + rev],
        dups: [3, 2],
        randomRegions: ["A", "G"],
      },
    });

    const processResultTestStrings3 = process(
      testStrings2,
      1,
      1,
      1 + fwd.length + rev.length,
      fwd,
      rev
    );

    expect(processResultTestStrings3).toEqual({
      config: {
        minCount: 1,
        tolerance: 1,
        targetLength: 1 + fwd.length + rev.length,
        fwdPrimer: fwd,
        revPrimer: rev,
      },
      summary: {
        numTotal: 9,
        numFiltered: 8,
        numUnique: 5,
        uniqueRatio: 5 / 8,
      },
      data: {
        seqs: [
          fwd + "A" + rev,
          fwd + "G" + rev,
          fwd + "C" + rev,
          fwd + "U" + rev,
          fwd + "AU" + rev,
        ],
        dups: [3, 2, 1, 1, 1],
        randomRegions: ["A", "G", "C", "U", "AU"],
      },
    });
  });

  it("should process strings on workerpool", async () => {
    const processResultTestStrings = process(
      testStrings,
      1,
      0,
      targetLength,
      fwd,
      rev
    );

    const { result } = renderHook(() => useProcessRawReads(pool));
    const { setRawReads } = result.current;

    await act(async () => {
      await setRawReads(testStrings, 1, 0, targetLength, fwd, rev);
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    const { isProcessing, processResult } = result.current;
    expect(isProcessing).toBe(true);
    expect(processResult).toEqual(processResultInit);

    // wait for processing to finish
    await waitFor(
      () => {
        expect(result.current.isProcessing).toBe(false);
      },
      { timeout: 5000 }
    );

    const { isProcessing: isProcessing2, processResult: processResult2 } =
      result.current;
    expect(isProcessing2).toBe(false);
    expect(processResult2).toEqual(processResultTestStrings);
  });
});
