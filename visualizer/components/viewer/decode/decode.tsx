import { Form } from "react-bootstrap";
import PointDecoder from "./point-decoder";
import ResultViewer from "./result-viewer";

const Decode: React.FC = () => {
  return (
    <Form>
      <Form.Group className="mb-3">
        <PointDecoder />
        <ResultViewer />
      </Form.Group>
    </Form>
  );
};

export default Decode;
