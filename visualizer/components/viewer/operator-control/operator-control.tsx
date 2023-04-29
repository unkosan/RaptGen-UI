import { Tab, Tabs } from "react-bootstrap";
import Encode from "./encode/encode";
import Decode from "./decode/decode";
import Download from "./download/download";

const OperatorControl: React.FC = () => {
  return (
    <Tabs defaultActiveKey="encode" id="operatorControl" className="mb-3">
      <Tab eventKey="encode" title="Encode">
        <Encode />
      </Tab>
      <Tab eventKey="decode" title="Decode">
        <Decode />
      </Tab>
      <Tab eventKey="download" title="Download">
        <Download />
      </Tab>
    </Tabs>
  );
};

export default OperatorControl;
