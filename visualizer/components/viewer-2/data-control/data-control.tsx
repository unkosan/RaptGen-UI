import { Tab, Tabs } from "react-bootstrap";
import DataSelector from "./data-selector/data-selector";
import ConfigSelector from "./config-selector/config-selector";
import VAEParamsTable from "./vae-params-table";
import GMMParamsTable from "./gmm-params-table";

const DataControl: React.FC = () => {
  return (
    <Tabs defaultActiveKey="dataSelector" id="dataControl" className="mb-3">
      <Tab eventKey="dataSelector" title="Select">
        <DataSelector />
      </Tab>
      <Tab eventKey="configSelector" title="Config">
        <ConfigSelector />
      </Tab>
      <Tab eventKey="vaeParamsTable" title="VAE Params">
        <VAEParamsTable />
      </Tab>
      <Tab eventKey="gmmParamsTable" title="GMM Params">
        <GMMParamsTable />
      </Tab>
    </Tabs>
  );
};

export default DataControl;
