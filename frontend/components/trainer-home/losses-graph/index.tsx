import React from "react";
import dynamic from "next/dynamic";
import { Badge, Card } from "react-bootstrap";
import {
  LossData,
  useLossDataPlot,
  useDownloadCsv,
} from "./hooks/use-losses-graph";
import { Layout } from "plotly.js";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

type Props = {
  title: string;
  lossData: LossData;
};

export const LossesGraph: React.FC<Props> = ({ title, lossData }) => {
  const lossDataPlot = useLossDataPlot(lossData);
  const { handleClickSave } = useDownloadCsv(lossData);

  const layout: Partial<Layout> = {
    title: title,
    plot_bgcolor: "#EDEDED",
    xaxis: {
      color: "#FFFFFF",
      tickfont: {
        color: "#000000",
      },
      gridcolor: "#FFFFFF",
    },
    yaxis: {
      color: "#FFFFFF",
      tickfont: {
        color: "#000000",
      },
      gridcolor: "#FFFFFF",
    },
    hoverlabel: {
      font: {
        family: "monospace",
      },
    },
    showlegend: true,
    legend: {
      xanchor: "right",
      x: 1,
      yanchor: "top",
      y: 1,
    },
    clickmode: "event+select",
    margin: {
      l: 30,
      r: 30,
      b: 30,
      t: 30,
      pad: 5,
    },
  };

  return (
    <Card className="mb-3">
      <Card.Header className="d-flex justify-content-between">
        <span>Loss Transition</span>
        <span>
          <Badge
            pill
            bg="success"
            className="mx-1"
            onClick={handleClickSave}
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
