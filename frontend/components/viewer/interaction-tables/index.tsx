import { Tab, Tabs } from "react-bootstrap";
import SelectionTable from "./tables/selection-table";
import EncodeTable from "./tables/encode-table";
import DecodeTable from "./tables/decode-table";

const InteractionTables: React.FC = () => {
  return (
    <Tabs defaultActiveKey="selected-points" id="interaction-table">
      <Tab eventKey="selected-points" title="Selected points">
        <SelectionTable />
      </Tab>
      <Tab eventKey="encoded-sequences" title="Encoded sequences">
        <EncodeTable />
      </Tab>
      <Tab eventKey="decoded-points" title="Decoded points">
        <DecodeTable />
      </Tab>
    </Tabs>
  );
};

export default InteractionTables;
