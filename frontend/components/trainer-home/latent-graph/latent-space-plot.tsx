import dynamic from "next/dynamic";
import { Card } from "react-bootstrap";
import { VaeData, useVaeDataPlot } from "./hooks/use-latent-space-plots";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

type Props = {
  vaeData: VaeData;
};

/**
 * Component for rendering the latent space plot
 */
export const LatentSpacePlot: React.FC<Props> = ({ vaeData }) => {
  const { vaeDataPlot, layout } = useVaeDataPlot(vaeData);

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
            data={[vaeDataPlot]}
            useResizeHandler={true}
            layout={layout}
            config={{ responsive: true }}
            className="w-100 h-100"
          />
        </div>
      </Card.Body>
    </Card>
  );
};
