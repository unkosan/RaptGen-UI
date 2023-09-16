import { useState, useCallback } from "react";
import workerpool from "workerpool";
// cannot bundle libraries
// import { countBy } from "lodash";

// export for testing
export type ProcessResult = {
  config: {
    minCount: number;
    tolerance: number;
    targetLength: number;
    fwdPrimer: string;
    revPrimer: string;
  };
  summary: {
    numTotal: number;
    numFiltered: number;
    numUnique: number;
    uniqueRatio: number;
  };
  data: {
    seqs: string[];
    dups: number[];
    randomRegions: string[];
  };
};

// export for testing
export const process = (
  seqs: string[],
  minCount: number,
  tolerance: number,
  targetLength: number,
  fwdPrimer: string,
  revPrimer: string
) => {
  // change T to U
  seqs = seqs.map((seq) => seq.replaceAll("T", "U"));
  fwdPrimer = fwdPrimer.replaceAll("T", "U");
  revPrimer = revPrimer.replaceAll("T", "U");

  let filterdSeqs: string[] = [];
  for (let seq of seqs) {
    if (
      targetLength - tolerance <= seq.length &&
      seq.length <= targetLength + tolerance &&
      seq.startsWith(fwdPrimer) &&
      seq.endsWith(revPrimer)
    ) {
      filterdSeqs.push(seq);
    }
  }

  let uniqueSeqs: string[] = [];
  let dups: number[] = [];
  let randomRegions: string[] = [];

  let counts = {} as { [seq: string]: number };
  for (let seq of filterdSeqs) {
    if (seq in counts) {
      counts[seq] += 1;
    } else {
      counts[seq] = 1;
    }
  }

  for (let seq in counts) {
    if (counts[seq] >= minCount) {
      uniqueSeqs.push(seq);
      dups.push(counts[seq]);
      randomRegions.push(
        seq.slice(
          fwdPrimer.length,
          revPrimer.length === 0 ? seq.length : -revPrimer.length
        )
      );
    }
  }

  const numTotal = seqs.length;
  const numFiltered = filterdSeqs.length;
  const numUnique = uniqueSeqs.length;
  const uniqueRatio = numUnique / numFiltered;

  return {
    config: {
      minCount,
      tolerance,
      targetLength,
      fwdPrimer,
      revPrimer,
    },
    summary: {
      numTotal,
      numFiltered,
      numUnique,
      uniqueRatio,
    },
    data: {
      seqs: uniqueSeqs,
      dups,
      randomRegions,
    },
  } as ProcessResult;
};

// export for testing
export const processResultInit = {
  config: {
    minCount: 0,
    tolerance: 0,
    targetLength: 0,
    fwdPrimer: "",
    revPrimer: "",
  },
  summary: {
    numTotal: 0,
    numFiltered: 0,
    numUnique: 0,
    uniqueRatio: 0,
  },
  data: {
    seqs: [],
    dups: [],
    randomRegions: [],
  },
} as ProcessResult;

const useProcessRawReads = (pool: workerpool.WorkerPool) => {
  const [processPromise, setProcessPromise] =
    useState<workerpool.Promise<void> | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processResult, setProcessResult] =
    useState<ProcessResult>(processResultInit);

  const setRawReads = useCallback(
    (
      seqs: string[],
      minCount: number,
      tolerance: number,
      targetLength: number,
      fwdPrimer: string,
      revPrimer: string
    ) => {
      // cancel previous processing
      if (isProcessing) {
        processPromise?.cancel();
      }

      // initialization
      setProcessResult(processResultInit);

      // start processing
      setIsProcessing(true);
      setProcessPromise(
        pool
          .exec(process, [
            seqs,
            minCount,
            tolerance,
            targetLength,
            fwdPrimer,
            revPrimer,
          ])
          .then((r: ProcessResult) => {
            setProcessResult(r);
            setIsProcessing(false);
          })
          .then(() => {
            setProcessPromise(null);
          })
      );
    },
    []
  );

  const cancelProcessing = useCallback(() => {
    processPromise?.cancel();
    setIsProcessing(false);
  }, []);

  return {
    setRawReads,
    cancelProcessing,
    isProcessing,
    processResult,
  };
};

export default useProcessRawReads;
