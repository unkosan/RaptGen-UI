import React, { useState } from "react";
import { Form } from "react-bootstrap";
import parseSelex from "../../../../common/parse-selex";
import { countBy } from "lodash";
import ReactDataGrid from "@inovua/reactdatagrid-community";
import ClientOnly from "../../../../common/client-only";

type Props = {};

const columns = [
  { name: "id", type: "number", header: "ID", defaultVisible: false },
  { name: "sequence", header: "Seqeunce", defaultFlex: 1 },
  { name: "duplicate", header: "Duplicate", type: "number" },
];

const gridStyle = { minHeight: 400, width: "100%", zIndex: 1000 };

const UploadFile: React.FC<Props> = (props) => {
  const [isValid, setIsValid] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [seqData, setSeqData] = useState<string[]>([]);
  const [dupData, setDupData] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<string>("");

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsDirty(true);
    const file = e.target.files?.[0];
    if (file) {
      (async () => {
        const result = await parseSelex(file);
        if (result.status === "success") {
          setIsValid(true);
          setFile(file);
          const count = countBy(result.data);
          const seqs = Object.keys(count);
          const freqs = Object.values(count);
          setSeqData(seqs);
          setDupData(freqs);
        } else {
          setIsValid(false);
          setFeedback(result.message);
        }
      })();
    }
  };

  let dataSource = [];
  for (let i = 0; i < seqData.length; i++) {
    dataSource.push({
      id: i,
      sequence: seqData[i],
      duplicate: dupData[i],
    });
  }

  console.log(dataSource);

  return (
    <>
      <Form.Group className="mb-3">
        <Form.Control type="file" onChange={handleFile} />
      </Form.Group>
      <ClientOnly>
        <ReactDataGrid
          idProperty="id"
          columns={columns}
          dataSource={dataSource}
          style={gridStyle}
          rowStyle={{
            fontFamily: "monospace",
          }}
        />
      </ClientOnly>
    </>
  );
};

export default UploadFile;
