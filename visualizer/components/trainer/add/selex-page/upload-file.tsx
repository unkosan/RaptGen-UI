import { useState } from "react";
import { Form } from "react-bootstrap";
import parseSelex from "~/components/common/parse-selex";
import { countBy } from "lodash";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import CustomDataGrid from "~/components/common/custom-datagrid";
import { setSelexDataState } from "../redux/selex-data";

type Props = {};

const columns = [
  { name: "id", type: "number", header: "ID", defaultVisible: false },
  { name: "sequence", header: "Sequence", defaultFlex: 1 },
  { name: "duplicate", header: "Duplicate", type: "number" },
];

const gridStyle = { minHeight: 600, width: "100%", zIndex: 1000 };

const UploadFile: React.FC<Props> = (props) => {
  const sequences = useSelector(
    (state: RootState) => state.selexData.sequences
  );
  const duplicates = useSelector(
    (state: RootState) => state.selexData.duplicates
  );
  const [isValidFile, setIsValidFile] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<string>("");

  const dispatch = useDispatch();

  const dataSource = sequences.map((seq, i) => {
    return { id: i, sequence: seq, duplicate: duplicates[i] };
  });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    const result = await parseSelex(file);
    if (result.status === "success") {
      const count = countBy(result.data);
      dispatch(
        setSelexDataState({
          sequences: Object.keys(count),
          duplicates: Object.values(count),
        })
      );
      setIsValidFile(true);
    } else {
      setIsValidFile(false);
      setFeedback(result.message);
    }
  };

  return (
    <>
      <Form.Group className="mb-3">
        <Form.Control
          type="file"
          onChange={handleFile}
          isInvalid={!isValidFile}
        />
        <Form.Control.Feedback type="invalid">{feedback}</Form.Control.Feedback>
      </Form.Group>
      <CustomDataGrid
        idProperty="id"
        className="mb-3"
        columns={columns}
        dataSource={dataSource}
        style={gridStyle}
        rowStyle={{
          fontFamily: "monospace",
        }}
      />
    </>
  );
};

export default UploadFile;
