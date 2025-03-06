import React from "react";
import dynamic from "next/dynamic";
import { Card } from "react-bootstrap";
import { latentGraphLayout } from "~/components/common/graph-layout";
import LoadingPane from "~/components/common/loading-pane";
import { useLatentSpacePlot } from "./hooks/use-latent-space-plot";
import { useGraphConfig } from "./hooks/use-graph-config";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

// Dynamically import Plot to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

/**
 * LatentSpacePlot component for visualizing latent space data
 * Displays VAE data in a plotly graph
 */
const LatentSpacePlot: React.FC = () => {
  const { minCount } = useSelector((state: RootState) => state.graphConfig);
  const { vaeDataPlot, isLoading } = useLatentSpacePlot(minCount);

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
              data={[vaeDataPlot]}
              useResizeHandler={true}
              layout={latentGraphLayout("")}
              config={{ responsive: true }}
              className="w-100 h-100"
            />
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default LatentSpacePlot;
