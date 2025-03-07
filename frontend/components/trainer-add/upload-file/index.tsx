import { Form } from "react-bootstrap";
import CustomDataGrid from "~/components/common/custom-datagrid";
import { useUploadFile } from "./hooks/use-upload-file";

const UploadFile: React.FC = () => {
  const { dataSource, isValidFile, feedback, isLoading, handleFile } =
    useUploadFile();

  const columns = [
    { name: "id", type: "number", header: "ID", defaultVisible: false },
    { name: "sequence", header: "Sequence", defaultFlex: 1 },
    { name: "duplicate", header: "Duplicate", type: "number" },
  ];

  const gridStyle = { minHeight: 600, width: "100%", zIndex: 1000 };

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
