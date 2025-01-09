import { Form } from "react-bootstrap";
import ShowGMM from "./show-GMM";
// import ShowMeasured from "./show-measured";
import FormMinCount from "./form-min-count";

const ConfigSelector: React.FC = () => {
  return (
    <Form>
      <Form.Group className="mb-3">
        <ShowGMM />
      </Form.Group>
      {/* <Form.Group className="mb-3">
        <ShowMeasured />
      </Form.Group> */}
      <Form.Group className="mb-3">
        <FormMinCount />
      </Form.Group>
    </Form>
  );
};

export default ConfigSelector;
