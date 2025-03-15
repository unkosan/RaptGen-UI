import dynamic from "next/dynamic";
import { Card } from "react-bootstrap";
import { latentGraphLayout } from "~/components/common/graph-helper";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

import { Props } from ".";
import { useGmmDataPlot, useVaeDataPlot } from "./hooks/use-latent-space-plots";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export const LatentSpacePlot: React.FC<Props> = ({ vaeData, gmmData }) => {
  const { minCount } = useSelector((state: RootState) => state.graphConfig);
  const { vaeDataPlot } = useVaeDataPlot(vaeData, minCount);
  const { gmmDataPlot } = useGmmDataPlot(gmmData);

  return (
    <Card className="mb-3">
      <Card.Body>
        <div
          className="justify-content-center align-items-center w-100"
          style={{
            aspectRatio: "1 / 1",
          }}
        >
          <Plot
            data={[vaeDataPlot, ...gmmDataPlot]}
            layout={latentGraphLayout("")}
            config={{
              responsive: true,
              displayModeBar: false,
            }}
            className="w-100 h-100"
          />
        </div>
      </Card.Body>
    </Card>
  );
};
