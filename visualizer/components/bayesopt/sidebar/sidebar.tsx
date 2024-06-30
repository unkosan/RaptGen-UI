import { Button, Form, ListGroup, Stack, Tab, Tabs } from "react-bootstrap";
import { PlusLg } from "react-bootstrap-icons";

const SideBar: React.FC = () => {
  return (
    <div>
      <Versions />
    </div>
  );
};

const Versions: React.FC = () => {
  return (
    <div>
      <legend>Bayes-Opt experiments</legend>
      <div
        style={{
          height: "230px",
          overflowY: "scroll",
          border: "2px solid #e5e5e5",
        }}
      >
        <ListGroup variant="flush">
          {[...Array(10)].map((_, i) => (
            <ListGroup.Item action href={`#version${i}`} key={i}>
              <Stack direction="horizontal" gap={3}>
                <span className="fs-5 me-2">Test-model-{i}</span>
                <span className="fs-6 fw-light ms-auto">
                  last modified: 2024/6/4
                </span>
              </Stack>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </div>
      <Stack direction="horizontal" className="mt-2" gap={3}>
        <Button variant="outline-primary">
          <PlusLg /> New
        </Button>
        <Button variant="outline-primary" className="ms-auto">
          save
        </Button>
        <Button variant="outline-primary">save as...</Button>
      </Stack>
      <hr />

      <legend>VAE model</legend>
      <Tabs defaultActiveKey="modelSelector" className="mb-3">
        <Tab eventKey="modelSelector" title="Select">
          <Form.Group className="mb-3">
            <Form.Label>Selected VAE model</Form.Label>
            <Form.Control as="select">
              <option>Test-model-1</option>
              <option>Test-model-2</option>
            </Form.Control>
          </Form.Group>
        </Tab>
        <Tab eventKey="modelConfig" title="Config">
          config
        </Tab>
      </Tabs>

      <legend>Initial dataset</legend>
      <Form.Group className="mb-3">
        <Form.Label>upload csv dataset</Form.Label>
        <Form.Control type="file" />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Or get from registered GMM centers</Form.Label>
        <Form.Control as="select">
          <option>centers-1</option>
          <option>centers-2</option>
        </Form.Control>
      </Form.Group>

      <legend>Bayes-Opt Configuration</legend>
      <Form.Group className="mb-3">
        <Form.Label>Optimization method</Form.Label>
        <Form.Control as="select">
          <option>qEI (multiple query)</option>
        </Form.Control>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>The name of the value to optimize</Form.Label>
        <Form.Control as="select">
          <option>value-1</option>
        </Form.Control>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Query budget</Form.Label>
        <Form.Control type="number" />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Switch label="show contour plot" />
      </Form.Group>
    </div>
  );
};

export default SideBar;
