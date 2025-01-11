import { Card, Form } from "react-bootstrap";
import SelectVAE from "./select-VAE";
import SelectGMM from "./select-GMM";
// import SelectMeasured from "./select-measured";

const DataSelector: React.FC = () => {
  return (
    <Card className="mb-3">
      <Card.Body>
        <Form.Group className="mb-3">
          <Form.Label>Selected VAE Model</Form.Label>
          <SelectVAE />
        </Form.Group>
        <Form.Group className="">
          <Form.Label>Selected GMM Model</Form.Label>
          <SelectGMM />
        </Form.Group>
        {/* <Form.Group className="mb-3">
        <Form.Label>Selected Measured Data</Form.Label>
        <SelectMeasured />
      </Form.Group> */}
      </Card.Body>
    </Card>
  );
};

export default DataSelector;
