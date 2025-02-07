import { PlotData } from "plotly.js";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Card, Tabs, Tab, Form, Button } from "react-bootstrap";
import { latentGraphLayout } from "~/components/common/graph-layout";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

type Props = {
  title: string;
  vaeData: {
    coordsX: number[];
    coordsY: number[];
    randomRegions: string[];
    duplicates: number[];
    minCount: number;
  };
};

export const LatentGraph: React.FC<Props> = ({ title, vaeData }) => {
  const [minCount, setMinCount] = useState(5);
  const [validMinCount, setValidMinCount] = useState(true);

  const vaeDataPlot: Partial<PlotData> = useMemo(() => {
    const { coordsX, coordsY, randomRegions, duplicates } = vaeData;
    const mask = duplicates.map((value) => value >= minCount);
    const trace: Partial<PlotData> = {
      x: coordsX.filter((_, index) => mask[index]),
      y: coordsY.filter((_, index) => mask[index]),
      type: "scattergl",
      mode: "markers",
      marker: {
        size: duplicates.map((d) => Math.max(2, Math.sqrt(d))),
        color: "black",
        opacity: 0.5,
        line: {
          color: "black",
        },
      },
      customdata: mask
        .map((value, index) =>
          value ? [randomRegions[index], duplicates[index]] : null
        )
        .filter((value) => value !== null) as [string, number][],
      hovertemplate:
        "<b>X</b>: %{x}<br>" +
        "<b>Y</b>: %{y}<br>" +
        "<b>Random Region</b>: %{customdata[0]}<br>" +
        "<b>Duplicates</b>: %{customdata[1]}<br>" +
        "<extra></extra>",
    };
    return trace;
  }, [vaeData, minCount]);

  const onClickSave = () => {
    const csvHeader = "random_region, x, y, duplicate";
    let csvData = "";
    for (let i = 0; i < vaeData.randomRegions.length; i++) {
      csvData +=
        vaeData.randomRegions[i] +
        "," +
        vaeData.coordsX[i] +
        "," +
        vaeData.coordsY[i] +
        "," +
        vaeData.duplicates[i] +
        "\n";
    }
    // download csv file
    const blob = new Blob([csvHeader + "\n" + csvData], {
      type: "text/csv",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", "latent_points.csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Tabs defaultActiveKey="latent-space" id="latent-graph-tabs">
      <Tab eventKey="latent-space" title="Latent space">
        <Card className="mb-3">
          <Card.Body>
            <div style={{ aspectRatio: "1 / 1" }}>
              <Plot
                data={[vaeDataPlot]}
                useResizeHandler={true}
                layout={latentGraphLayout(title)}
                config={{ responsive: true }}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          </Card.Body>
        </Card>
      </Tab>
      <Tab eventKey="plot-config" title="Plot config">
        <Card className="mb-3">
          <Card.Body>
            <Form.Group className="mb-3">
              <Form.Label>Minimum count</Form.Label>
              <Form.Control
                type="number"
                value={minCount}
                onChange={(e) => {
                  const minCount = parseInt(e.target.value);
                  if (!isNaN(minCount) && minCount > 0) {
                    setMinCount(minCount);
                    setValidMinCount(true);
                  } else {
                    setValidMinCount(true);
                  }
                }}
                isInvalid={!validMinCount}
              />
            </Form.Group>
            <Button
              variant="success"
              className="mx-1"
              style={{ cursor: "pointer" }}
              onClick={onClickSave}
            >
              Download Latent Points
            </Button>
          </Card.Body>
        </Card>
      </Tab>
    </Tabs>
  );
};
