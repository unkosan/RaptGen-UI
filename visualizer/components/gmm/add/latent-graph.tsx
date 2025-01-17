import { useSelector } from "react-redux";
import { RootState } from "./redux/store";
import { PlotData, Layout } from "plotly.js";
import { apiClient } from "~/services/api-client";
import dynamic from "next/dynamic";
import { Card } from "react-bootstrap";
import { useAsyncMemo } from "~/hooks/common";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const returnLayout = (title: string): Partial<Layout> => {
  return {
    plot_bgcolor: "#EDEDED",
    xaxis: {
      color: "#FFFFFF",
      tickfont: {
        color: "#000000",
      },
      range: [-3.5, 3.5],
      gridcolor: "#FFFFFF",
    },
    yaxis: {
      color: "#FFFFFF",
      tickfont: {
        color: "#000000",
      },
      range: [-3.5, 3.5],
      gridcolor: "#FFFFFF",
    },
    legend: {
      yanchor: "top",
      y: 1,
      x: 0,
      bgcolor: "rgba(255,255,255,0.8)",
    },
    hoverlabel: {
      font: {
        family: "monospace",
      },
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
};

const LatentGraph: React.FC = () => {
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
      const res = await apiClient.getSelexData({
        queries: { vae_uuid: params.vaeId },
      });

      const mask = res.duplicates.map((value) => value >= 5);
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
      return trace;
    },
    [params.vaeId],
    {
      x: [],
      y: [],
      type: "scattergl",
      mode: "markers",
    }
  );

  return (
    <Card className="mb-3">
      <Card.Header>
        <Card.Text>Latent Space</Card.Text>
      </Card.Header>
      <Card.Body>
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "1 / 1",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Plot
            data={[vaeDataPlot]}
            useResizeHandler={true}
            layout={returnLayout("Latent Space")}
            config={{ responsive: true }}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      </Card.Body>
    </Card>
  );
};

export default LatentGraph;
