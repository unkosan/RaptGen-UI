import React from "react";
import { Tab, Tabs } from "react-bootstrap";
import { LatentSpacePlot } from "./latent-space-plot";
import GraphConfigSelector from "./graph-config-selector";
import { VaeData } from "./hooks/use-latent-space-plots";

export type Props = {
  title: string;
  vaeData: VaeData;
};

/**
 * Main LatentGraph component that combines the plot and configuration components
 */
export const LatentGraph: React.FC<Props> = ({ vaeData }) => {
  return (
    <Tabs defaultActiveKey="latent-space" id="latent-graph-tabs">
      <Tab eventKey="latent-space" title="Latent space">
        <LatentSpacePlot vaeData={vaeData} />
      </Tab>
      <Tab eventKey="plot-config" title="Plot config">
        <GraphConfigSelector vaeData={vaeData} />
      </Tab>
    </Tabs>
  );
};
