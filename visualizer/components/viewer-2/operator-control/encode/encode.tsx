import { Form } from "react-bootstrap";
import ManualEncodeForm from "./manual-encode-form";
import FastaUploader from "./fasta-uploader";
import EncodeTable from "./encode-table";

const Encode: React.FC = () => {
  return (
    <Form>
      <Form.Group className="mb-3">
        <Form.Label>Encode Sequence</Form.Label>
        <ManualEncodeForm />
        <Form.Label>Encode FastaFile</Form.Label>
        <FastaUploader />
        <Form.Label>Sequence List</Form.Label>
        <EncodeTable />
      </Form.Group>
    </Form>
  );
};

export default Encode;
