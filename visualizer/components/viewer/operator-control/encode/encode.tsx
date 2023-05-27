import { Form } from "react-bootstrap";
import ManualEncodeForm from "./manual-encode-form";
import FastaUploader from "./fasta-uploader";
import EncodeTable from "./encode-table";
import ClientOnly from "../../../common/client-only";

const Encode: React.FC = () => {
  return (
    <Form>
      <Form.Group className="mb-3">
        <Form.Label>Encode Sequence</Form.Label>
        <ManualEncodeForm />
        <Form.Label>Encode FastaFile</Form.Label>
        <FastaUploader />
        <Form.Label>Sequence List</Form.Label>
        <ClientOnly>
          <EncodeTable />
        </ClientOnly>
      </Form.Group>
    </Form>
  );
};

export default Encode;
