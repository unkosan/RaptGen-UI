import { useState, useCallback } from "react";
import workerpool from "workerpool";

type ParseResult = {
  id: string;
  seq: string;
}[];

type ParseReturn = {
  isValid: boolean;
  result: ParseResult;
};

const parse = (text: string, fileType: "fasta" | "fastq") => {
  let regex;
  let match: RegExpExecArray | null;
  if (fileType === "fasta") {
    regex = /^>\s*(\S+)[\n\r]+([ACGTUacgtu\n\r]+)$/gm;
  } else {
    regex = /^@\s*(\S+)[\n\r]+([ACGTUacgtu\n\r]+)/gm;
  }

  let result: ParseResult = [];
  while ((match = regex.exec(text))) {
    const id = match[1].replace(/[\n\r]/g, "");
    const seq = match[2].replace(/[\n\r]/g, "");
    result.push({ id, seq });
  }

  // maybe something bad happened
  if (result.length === 0) {
    return { isValid: false, result: [] } as ParseReturn;
  } else {
    return { isValid: true, result } as ParseReturn;
  }
};

const useParseFastx = (pool: workerpool.WorkerPool) => {
  const [processPromise, setProcessPromise] =
    useState<workerpool.Promise<void> | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isValid, setIsValid] = useState<boolean>(false);
  const [parseResult, setParseResult] = useState<ParseResult>([]);

  const setFastx = useCallback(async (file: File | null) => {
    // cancel previous parsing
    if (isParsing) {
      processPromise?.cancel();
    }

    // initialization
    setIsParsing(false);
    setIsValid(false);
    setParseResult([]);

    // start parsing
    if (file === null) {
      setProcessPromise(null);
      return;
    }

    const fileType = file.name.split(".").pop();
    if (fileType !== "fasta" && fileType !== "fastq") {
      setProcessPromise(null);
      return;
    }

    setIsParsing(true);
    setProcessPromise(
      pool
        .exec(parse, [await file.text(), fileType])
        .then((r: ParseReturn) => {
          setIsValid(r.isValid);
          setParseResult(r.result);
          setIsParsing(false);
        })
        .then(() => {
          setProcessPromise(null);
        })
    );
  }, []);

  const cancelParsing = useCallback(() => {
    processPromise?.cancel();
    setIsParsing(false);
  }, []);

  return {
    setFastx,
    cancelParsing,
    isParsing,
    isValid,
    parseResult,
  };
};

export default useParseFastx;
