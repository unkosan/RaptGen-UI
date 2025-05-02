import dynamic from "next/dynamic";
import React from "react";
import { Card } from "react-bootstrap";
import { latentGraphLayout } from "../../common/graph-helper";
import LoadingPane from "../../common/loading-pane";
import {
  useVaePlotData,
  useAcquisitionDataPlot,
  useRegisteredDataPlots,
  useQueryDataPlot,
} from "./hooks/use-latent-space-plots";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

// Dynamic import of Plot to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export const LatentSpacePlot: React.FC<{ isLoading: boolean }> = ({
  isLoading: forceIsLoading,
}) => {
  const graphConfig = useSelector((state: RootState) => state.graphConfig);
  const sessionConfig = useSelector((state: RootState) => state.sessionConfig);

  const { isLoading, vaeDataPlot } = useVaePlotData(
    graphConfig.showSelex,
    sessionConfig.vaeId,
    graphConfig.minCount
  );
  const { acquisitionDataPlot } = useAcquisitionDataPlot(
    graphConfig.showAcquisition
  );
  const { registeredDataPlot, unregisteredDataPlot } = useRegisteredDataPlots();
  const { queryDataPlot } = useQueryDataPlot();

  // Get layout for the graph
  const showTitle = graphConfig.showTitle;
  const layout = latentGraphLayout(showTitle ? sessionConfig.vaeName : "");

  return (
    <Card className="mb-3">
      <Card.Body>
        <div
          className="justify-content-center align-items-center w-100"
          style={{
            aspectRatio: "10 / 9",
          }}
        >
          {isLoading || forceIsLoading ? (
            <LoadingPane label="Loading..." />
          ) : (
            <Plot
              data={[
                vaeDataPlot,
                registeredDataPlot,
                unregisteredDataPlot,
                queryDataPlot,
                acquisitionDataPlot,
              ]}
              layout={layout}
              useResizeHandler={true}
              className="w-100 h-100"
            />
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default LatentSpacePlot;
