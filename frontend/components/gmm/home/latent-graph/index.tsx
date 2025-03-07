import { Tab, Tabs } from "react-bootstrap";
import { LatentSpacePlot } from "./latent-space-plot";
import GraphConfigSelector from "./graph-config-selector";

export type Props = {
  vaeData: {
    coordsX: number[];
    coordsY: number[];
    randomRegions: string[];
    duplicates: number[];
  };
  gmmData: {
    means: number[][];
    covariances: number[][][];
  };
};

const LatentGraph: React.FC<Props> = ({ vaeData, gmmData }) => {
  return (
    <Tabs defaultActiveKey="latent-graph" id="gmm-latent-graph">
      <Tab eventKey="latent-graph" title="Latent Space">
        <LatentSpacePlot vaeData={vaeData} gmmData={gmmData} />
      </Tab>
      <Tab eventKey="plot-config" title="Plot Config">
        <GraphConfigSelector />
      </Tab>
    </Tabs>
  );
};

export default LatentGraph;
