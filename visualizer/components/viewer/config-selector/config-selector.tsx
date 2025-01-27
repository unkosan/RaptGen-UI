import { Card, Form } from "react-bootstrap";
import ShowGMM from "./show-GMM";
// import ShowMeasured from "./show-measured";
import FormMinCount from "./form-min-count";

const ConfigSelector: React.FC = () => {
  return (
    <Card className="mb-3">
      <Card.Body>
        {/* <Form.Group className="mb-3">
        <ShowMeasured />
      </Form.Group> */}
        <Form.Group className="mb-3">
          <FormMinCount />
        </Form.Group>
        <Form.Group className="">
          <ShowGMM />
        </Form.Group>
      </Card.Body>
    </Card>
  );
};

export default ConfigSelector;
