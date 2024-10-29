type ParseResult =
  | {
      status: "success";
      data: string[];
    }
  | {
      status: "error";
      message: string;
    };

const parseSelex = async (file: File) => {
  const fileType = file.name.split(".").pop() as string;
  const fileData = await file.text();

  if (fileType !== "fasta" && fileType !== "fastq") {
    return {
      status: "error",
      message: "File type not supported",
    } as ParseResult;
  }

  let regex;
  let match: RegExpExecArray | null;
  if (fileType === "fasta") {
    regex = /^>[^\n\r]+[\n\r]+([ACGTUacgtu\n\r]+)$/gm;
  } else {
    regex = /^@[^\n\r]+[\n\r]+([ACGTUacgtu\n\r]+)$/gm;
  }

  let seqs: string[] = [];
  while ((match = regex.exec(fileData))) {
    const seq = match[1].replace(/\n/g, "");
    seqs.push(seq);
  }

  if (seqs.length === 0) {
    return {
      status: "error",
      message: "No sequences found",
    } as ParseResult;
  }

  return {
    status: "success",
    data: seqs,
  } as ParseResult;
};

export default parseSelex;
