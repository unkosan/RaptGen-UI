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
  const paramsValid = useSelector((state: RootState) => state.paramsValid);
  const [vaeDataPlot, setVaeDataPlot] = useState<Partial<PlotData> | null>(
    null
  );

  useEffect(() => {
    console.log(params);
    if (!params?.vaeModelName) {
      return;
    }

    (async () => {
      const res = await apiClient.getSelexData({
        queries: { VAE_model_name: params.vaeModelName },
      });
      if (res.status !== "success") {
        return;
      }
      const data = res.data;

      const mask = data.Duplicates.map((value) => value >= 5);
      const trace: Partial<PlotData> = {
        x: data.coord_x.filter((_, index) => mask[index]),
        y: data.coord_y.filter((_, index) => mask[index]),
        type: "scattergl",
        mode: "markers",
        marker: {
          size: data.Duplicates.map((d) => Math.max(2, Math.sqrt(d))),
          color: "silver",
          line: {
            color: "silver",
          },
        },
        customdata: data.Without_Adapters.filter((_, index) => mask[index]),
        hovertemplate:
          "X: %{x}<br>" +
          "Y: %{y}<br>" +
          "Random Region: %{customdata}" +
          "<extra></extra>",
      };

      setVaeDataPlot(trace);
    })();
  }, [params?.vaeModelName]);

  if (!vaeDataPlot) {
    return <div>Loading...</div>;
  } else {
    return (
      <Plot
        data={[vaeDataPlot]}
        useResizeHandler={true}
        layout={returnLayout(params.vaeModelName)}
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
          n_trials: params.numTrials,
        },
        target: params.vaeModelName,
      });
      setIsLoading(false);
      router.push(`/gmm?experimentName=${res.uuid}`);
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
