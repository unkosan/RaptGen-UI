import React from "react";
import dynamic from "next/dynamic";
import { Card } from "react-bootstrap";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { latentGraphLayout } from "../../common/graph-helper";
import LoadingPane from "../../common/loading-pane";
import {
  useVaePlotData,
  useGmmDataPlot,
  useEncodeDataPlot,
  useDecodeDataPlot,
  useGridDataPlot,
  useSelectionHandler,
} from "./hooks/use-latent-space-plots";

// Dynamically import Plot to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const LatentSpacePlot: React.FC = () => {
  // Get session config for layout
  const sessionConfig = useSelector((state: RootState) => state.sessionConfig);

  // Get graph config
  const graphConfig = useSelector((state: RootState) => state.graphConfig);

  // Use custom hooks
  const {
    vaeDataPlot,
    selexData,
    isLoading: vaeLoading,
  } = useVaePlotData(sessionConfig.vaeId, graphConfig.minCount);
  const { gmmDataPlot, isLoading: gmmLoading } = useGmmDataPlot(
    graphConfig.showGMM,
    sessionConfig.gmmId,
    sessionConfig.sessionId
  );
  const { encodeDataPlot } = useEncodeDataPlot();
  const { decodeDataPlot } = useDecodeDataPlot();
  const { gridPlot } = useGridDataPlot();
  const { handleSelected } = useSelectionHandler(selexData);

  // Determine if any data is loading
  const isLoading = vaeLoading || gmmLoading;

  // Get layout for the graph
  const layout = latentGraphLayout("");

  return (
    <Card className="mb-3">
      <Card.Body>
        <div
          className="justify-content-center align-items-center w-100"
          style={{
            aspectRatio: "1 / 1",
          }}
        >
          {isLoading ? (
            <LoadingPane label="Loading..." />
          ) : (
            <Plot
              data={[
                vaeDataPlot,
                ...gmmDataPlot,
                encodeDataPlot,
                decodeDataPlot,
                ...gridPlot,
              ]}
              layout={layout}
              useResizeHandler={true}
              onSelected={handleSelected}
              className="w-100 h-100"
            />
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default LatentSpacePlot;
