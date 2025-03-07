import React from "react";
import dynamic from "next/dynamic";
import { Badge, Card } from "react-bootstrap";
import {
  LossData,
  useLayout,
  useLossDataPlot,
  useDownloadCsv,
} from "./hooks/use-losses-graph";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

type Props = {
  title: string;
  lossData: LossData;
};

export const LossesGraph: React.FC<Props> = ({ title, lossData }) => {
  const layout = useLayout(title);
  const lossDataPlot = useLossDataPlot(lossData);
  const { onClickSave } = useDownloadCsv(lossData);

  return (
    <Card className="mb-3">
      <Card.Header className="d-flex justify-content-between">
        <span>Loss Transition</span>
        <span>
          <Badge
            pill
            bg="success"
            className="mx-1"
            onClick={onClickSave}
            style={{ cursor: "pointer" }}
          >
            Download Loss Transitions
          </Badge>
        </span>
      </Card.Header>
      <Card.Body>
        <div style={{ aspectRatio: "2 / 1" }}>
          <Plot
            data={lossDataPlot}
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
