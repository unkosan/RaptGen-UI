import { Card, Form } from "react-bootstrap";
import ManualEncodeForm from "./manual-encode-form";
import FastaUploader from "./fasta-uploader";

const Encode: React.FC = () => {
  return (
    <Card className="mb-3">
      <Card.Header>Encoder Input</Card.Header>
      <Card.Body>
        <ManualEncodeForm />
        <Form.Text>From fasta file</Form.Text>
        <FastaUploader />
      </Card.Body>
    </Card>
  );
};

export default Encode;
