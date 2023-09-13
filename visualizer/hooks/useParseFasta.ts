import { useState, useEffect, useCallback } from "react";

type ParseResult = {
  id: string;
  seq: string;
}[];

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
    return { isValid: false, result: [] };
  } else {
    return { isValid: true, result };
  }
};

const useParseFastx = () => {
  const [fastxFile, setFastxFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isValid, setIsValid] = useState<boolean>(false);
  const [parseResult, setParseResult] = useState<ParseResult>([]);

  const setFastx = useCallback((file: File | null) => {
    // initialization
    setFastxFile(file);
    setIsValid(false);
    setParseResult([]);
  }, []);

  useEffect(() => {
    // change on fastxFile triggers parsing
    (async () => {
      if (!isParsing) {
        await new Promise((resolve) => setTimeout(resolve, 10));
        setIsParsing(true);
      }
    })();
  }, [fastxFile]);

  useEffect(() => {
    // parse fastx file and set isParsing to false
    console.log("isParsing: ", isParsing, "fastxFile: ", fastxFile);
    if (isParsing) {
      return;
    }

    console.log("parsing file: ", fastxFile);

    if (fastxFile === null) {
      setIsValid(false);
      setParseResult([]);
      setIsParsing(false);
      return;
    }

    // check file type
    const fileType = fastxFile.name.split(".").pop();
    if (fileType !== "fasta" && fileType !== "fastq") {
      setIsValid(false);
      setParseResult([]);
      setIsParsing(false);
      return;
    }

    (async () => {
      const text = await fastxFile.text();
      const { isValid, result } = parse(text, fileType);
      setIsValid(isValid);
      setParseResult(result);
      setIsParsing(false);
      return;
    })();
  }, [isParsing]);

  return {
    setFastx,
    isParsing,
    isValid,
    parseResult,
  };
};

export default useParseFastx;
