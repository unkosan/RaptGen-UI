import React from "react";
import { Tab, Tabs } from "react-bootstrap";
import GraphConfigSelector from "./graph-config-selector";
import LatentSpacePlot from "./latent-space-plot";

/**
 * LatentSpaceGraph component for visualizing latent space data
 * Displays VAE data, GMM models, encoded/decoded points, and grid lines
 * Includes configuration options in a separate tab
 */
const LatentSpaceGraph: React.FC = () => {
  return (
    <Tabs className="" defaultActiveKey="latent-graph" id="latent-graph">
      <Tab eventKey="latent-graph" title="Latent space">
        <LatentSpacePlot />
      </Tab>
      <Tab eventKey="plot-config" title="Plot config">
        <GraphConfigSelector />
      </Tab>
    </Tabs>
  );
};

export default LatentSpaceGraph;
