import axios from "axios";
import { countBy, uniq } from "lodash";
import { useEffect, useState } from "react";
import { Form } from "react-bootstrap";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { altApiClient } from "../../../../services/alt-api-client";

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
    regex = /^>\s*\S+[\n\r]+([ACGTUacgtu\n\r]+)$/gm;
  } else {
    regex = /^@\s*\S+[\n\r]+([ACGTUacgtu\n\r]+)/gm;
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

type Props = {
  setVaeFile: React.Dispatch<React.SetStateAction<File | null>>;
  setSelexFile: React.Dispatch<React.SetStateAction<File | null>>;
  setFileIsValid: React.Dispatch<React.SetStateAction<boolean>>;
  setFileIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
};

const UploadFile: React.FC<Props> = (props) => {
  const [isVaeValid, setIsVaeValid] = useState<boolean>(true);
  const [isSelexValid, setIsSelexValid] = useState<boolean>(true);
  const [feedbackSelex, setFeedbackSelex] = useState<string>("");

  const dispatch = useDispatch();
  const sequenceData = useSelector(
    (state: RootState) => state.vaeConfig.sequenceData
  );

  const handleVaeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    props.setFileIsDirty(true);
    if (e.target.files) {
      const file = e.target.files[0];
      let formData = new FormData();
      formData.append("state_dict", file);
      (async () => {
        const res = await altApiClient.validatepHMMModel({
          state_dict: file,
        });
        if (res.status === "success") {
          setIsVaeValid(true);
          props.setVaeFile(file);
        } else {
          setIsVaeValid(false);
        }
      })();
    }
    return;
  };

  const handleSelexFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    props.setFileIsDirty(true);
    const file = e.target.files?.[0];
    if (file) {
      (async () => {
        const result = await parseSelex(file);
        if (result.status === "success") {
          setIsSelexValid(true);
          props.setSelexFile(file);
          setFeedbackSelex("");

          const count = countBy(result.data);
          const seqs = Object.keys(count);
          const freqs = Object.values(count);

          dispatch({
            type: "vaeConfig/setData",
            payload: {
              ...sequenceData,
              totalLength: result.data.length,
              uniqueLength: seqs.length,
              sequences: seqs,
              duplicates: freqs,
            },
          });
        } else {
          setIsSelexValid(false);
          setFeedbackSelex(result.message);
        }
      })();
    }
    return;
  };

  useEffect(() => {
    if (isVaeValid && isSelexValid) {
      props.setFileIsValid(true);
    } else {
      props.setFileIsValid(false);
    }
  }, [isVaeValid, isSelexValid]);

  return (
    <>
      <Form.Group className="mb-3">
        <Form.Label>VAE File</Form.Label>
        <Form.Control
          type="file"
          onChange={handleVaeFileChange}
          isInvalid={!isVaeValid}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Selex File</Form.Label>
        <Form.Control
          type="file"
          onChange={handleSelexFileChange}
          isInvalid={!isSelexValid}
        />
        <Form.Control.Feedback type="invalid">
          {feedbackSelex}
        </Form.Control.Feedback>
      </Form.Group>
    </>
  );
};

export default UploadFile;
