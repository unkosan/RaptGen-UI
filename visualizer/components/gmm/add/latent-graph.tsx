import { useSelector } from "react-redux";
import { RootState } from "./redux/store";
import { useEffect, useState } from "react";
import { PlotData, Layout } from "plotly.js";
import { apiClient } from "~/services/api-client";
import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const returnLayout = (title: string): Partial<Layout> => {
  return {
    height: 800,
    title: title,
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
        family: "Courier New",
      },
    },
    clickmode: "event+select",
  };
};

const LatentGraph: React.FC = () => {
  const params = useSelector((state: RootState) => state.params);
  const [vaeDataPlot, setVaeDataPlot] = useState<Partial<PlotData> | null>(
    null
  );

  useEffect(() => {
    if (params.vaeId === "") {
      return;
    }

    (async () => {
      console.log(params);
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

      setVaeDataPlot(trace);
    })();
  }, [params.vaeId]);

  if (!vaeDataPlot) {
    return <div>Loading...</div>;
  } else {
    return (
      <Plot
        data={[vaeDataPlot]}
        useResizeHandler={true}
        layout={returnLayout("Latent Space")}
        config={{ responsive: true }}
        style={{ width: "100%" }}
      />
    );
  }
};

export default LatentGraph;
