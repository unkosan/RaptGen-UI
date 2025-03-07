import { useState } from "react";
import { countBy } from "lodash";
import { setSelexDataState } from "../../redux/selex-data";
import { useDispatch } from "react-redux";

export const useUploadFile = () => {
  const [dataSource, setDataSource] = useState<
    {
      id: number;
      sequence: string;
      duplicate: number;
    }[]
  >([]);
  const [isValidFile, setIsValidFile] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const dispatch = useDispatch();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    setIsLoading(true);
    try {
      const filetype = file.name.split(".").pop() as string;
      const fileData = await file.text();

      if (!["fasta", "fastq", "fa"].includes(filetype)) {
        setIsValidFile(false);
        setFeedback(`File type '${filetype}' is not supported`);
        return;
      }

      const regex = ["fasta", "fa"].includes(filetype)
        ? /^>[^\n\r]+[\n\r]+([ACGTUacgtu\n\r]+)$/gm
        : /^@[^\n\r]+[\n\r]+([ACGTUacgtu\n\r]+)$/gm;
      let match: RegExpExecArray | null;
      let seqs: string[] = [];

      while ((match = regex.exec(fileData))) {
        const seq = match[1].replace(/\n/g, "");
        seqs.push(seq);
      }

      if (seqs.length === 0) {
        setIsValidFile(false);
        setFeedback("No sequences found");
        return;
      }

      const count = countBy(seqs);
      const sequences = Object.keys(count);
      const duplicates = Object.values(count);
      dispatch(
        setSelexDataState({
          sequences,
          duplicates,
        })
      );
      setDataSource(
        sequences.map((seq, i) => {
          return { id: i, sequence: seq, duplicate: duplicates[i] };
        })
      );
      setIsValidFile(true);
      setFeedback("");
    } catch (error) {
      setIsValidFile(false);
      setFeedback("Some error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    dataSource,
    isValidFile,
    feedback,
    isLoading,
    handleFile,
  };
};
