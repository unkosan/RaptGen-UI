import React from "react";
import { Tab, Tabs } from "react-bootstrap";
import GraphConfigSelector from "./graph-config-selector";
import LatentSpacePlot from "./latent-space-plot";

export const LatentGraph: React.FC<{ isLoading: boolean }> = ({
  isLoading,
}) => {
  return (
    <Tabs defaultActiveKey="latent-graph" id="latent-graph">
      <Tab eventKey="latent-graph" title="Latent space">
        <LatentSpacePlot isLoading={isLoading} />
      </Tab>
      <Tab eventKey="plot-config" title="Plot config">
        <GraphConfigSelector />
      </Tab>
    </Tabs>
  );
};

export default LatentGraph;
