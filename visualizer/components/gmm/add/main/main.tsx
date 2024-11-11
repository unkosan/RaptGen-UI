import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { useEffect, useState } from "react";
import { PlotData, Layout } from "plotly.js";
import { apiClient } from "~/services/api-client";
import dynamic from "next/dynamic";
import { Button, Spinner } from "react-bootstrap";
import { useRouter } from "next/router";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const Main: React.FC = () => {
  return (
    <div>
      <LatentGraph />
      <PagenationNav />
    </div>
  );
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

const PagenationNav: React.FC = () => {
  const router = useRouter();
  const params = useSelector((state: RootState) => state.params);
  const paramsValid = useSelector((state: RootState) => state.paramsValid);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      return;
    }

    (async () => {
      const res = await apiClient.submitGMMJobs({
        params: {
          minimum_n_components: params.minNumComponents,
          maximum_n_components: params.maxNumComponents,
          step_size: params.stepSize,
          n_trials_per_component: params.numTrials,
        },
        target: params.vaeId,
        name: params.gmmName,
      });
      setIsLoading(false);
      router.push(`/gmm?experiment=${res.uuid}`);
    })();
  }, [isLoading]);

  return (
    <div className="d-flex justify-content-between my-3">
      <Button
        variant="primary"
        onClick={() => {
          router.push("/gmm");
        }}
      >
        Cancel
      </Button>

      <Button
        onClick={() => {
          setIsLoading(true);
        }}
        disabled={
          !(
            paramsValid.vaeId &&
            paramsValid.gmmName &&
            paramsValid.minNumComponents &&
            paramsValid.maxNumComponents &&
            paramsValid.stepSize &&
            paramsValid.numTrials
          )
        }
      >
        {isLoading ? <Spinner animation="border" size="sm" /> : "Train"}
      </Button>
    </div>
  );
};

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

export default Main;
