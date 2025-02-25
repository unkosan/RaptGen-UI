import { Form } from "react-bootstrap";
import DecoderInput from "./input";
import DecoderOutput from "./output";

const Decode: React.FC = () => {
  return (
    <Form>
      <Form.Group className="mb-3">
        <DecoderInput />
        <DecoderOutput />
      </Form.Group>
    </Form>
  );
};

export default Decode;
