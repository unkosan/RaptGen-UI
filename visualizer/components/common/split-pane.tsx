import { Col, Row } from "react-bootstrap";

type SplitPaneProps = {
  left: React.ReactNode;
  right: React.ReactNode;
};

const SplitPane: React.FC<SplitPaneProps> = ({ left, right }) => {
  return (
    <div id="split-pane">
      <Row>
        <Col md={4}>{left}</Col>
        <Col>{right}</Col>
      </Row>
    </div>
  );
};

export default SplitPane;
