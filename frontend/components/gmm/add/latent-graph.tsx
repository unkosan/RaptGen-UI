import { useSelector } from "react-redux";
import { RootState } from "./redux/store";
import { PlotData } from "plotly.js";
import { apiClient } from "~/services/api-client";
import dynamic from "next/dynamic";
import { Card, Form, Tab, Tabs } from "react-bootstrap";
import { useAsyncMemo, useIsLoading } from "~/hooks/common";
import { useState } from "react";
import { latentGraphLayout } from "~/components/common/graph-layout";
import LoadingPane from "~/components/common/loading-pane";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const LatentGraph: React.FC = () => {
  const [minCount, setMinCount] = useState(5);
  const [validMinCount, setValidMinCount] = useState(true);
  const [isLoading, lock, unlock] = useIsLoading();

  const params = useSelector((state: RootState) => state.params);
  const vaeDataPlot = useAsyncMemo(
    async () => {
      if (params.vaeId === "") {
        return {
          x: [],
          y: [],
          type: "scattergl",
          mode: "markers",
        } as Partial<PlotData>;
      }

      lock();

      const res = await apiClient.getSelexData({
        queries: { vae_uuid: params.vaeId },
      });

      const mask = res.duplicates.map((value) => value >= minCount);
      const trace: Partial<PlotData> = {
        x: res.coord_x.filter((_, index) => mask[index]),
        y: res.coord_y.filter((_, index) => mask[index]),
        type: "scattergl",
        mode: "markers",
        marker: {
          size: res.duplicates.map((d) => Math.max(2, Math.sqrt(d))),
          color: "silver",
          line: {
            color: "silver",
          },
        },
        customdata: res.random_regions.filter((_, index) => mask[index]),
        hovertemplate:
          "X: %{x}<br>" +
          "Y: %{y}<br>" +
          "Random Region: %{customdata}" +
          "<extra></extra>",
      };

      unlock();

      return trace;
    },
    [params.vaeId, minCount],
    {
      x: [],
      y: [],
      type: "scattergl",
      mode: "markers",
    }
  );

  return (
    <Tabs defaultActiveKey="latent-graph" id="gmm-latent-graph">
      <Tab eventKey="latent-graph" title="Latent space">
        <Card className="mb-3">
          <Card.Body>
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "10 / 9",
                justifyContent: "center",
                alignItems: "center",
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
                  style={{ width: "100%", height: "100%" }}
                />
              )}
            </div>
          </Card.Body>
        </Card>
      </Tab>
      <Tab eventKey="plot-config" title="Plot config">
        <Card className="mb-3">
          <Card.Body>
            <Form.Group className="">
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
          </Card.Body>
        </Card>
      </Tab>
    </Tabs>
  );
};

export default LatentGraph;
