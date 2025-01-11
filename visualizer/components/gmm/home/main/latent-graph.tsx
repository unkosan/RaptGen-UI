import { cloneDeep, zip } from "lodash";
import { eigs, cos, sin, pi, range, atan2, transpose } from "mathjs";
import dynamic from "next/dynamic";
import { Layout, PlotData } from "plotly.js";
import { useMemo } from "react";
import { Card } from "react-bootstrap";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const returnLayout = (title: string): Partial<Layout> => {
  return {
    // title: title,
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
    margin: {
      l: 30,
      r: 30,
      b: 30,
      t: 30,
      pad: 5,
    },
  };
};

type Props = {
  title: string;
  vaeData: {
    coordsX: number[];
    coordsY: number[];
    randomRegions: string[];
    duplicates: number[];
    minCount: number;
  };
  gmmData: {
    means: number[][];
    covariances: number[][][];
  };
};

const LatentGraph: React.FC<Props> = ({ vaeData, gmmData }) => {
  const vaeDataPlot: Partial<PlotData> = useMemo(() => {
    const { coordsX, coordsY, randomRegions, duplicates, minCount } = vaeData;
    const mask = duplicates.map((value) => value >= minCount);
    const trace: Partial<PlotData> = {
      x: coordsX.filter((_, index) => mask[index]),
      y: coordsY.filter((_, index) => mask[index]),
      type: "scatter",
      mode: "markers",
      name: "SELEX",
      marker: {
        size: duplicates.map((d) => Math.max(2, Math.sqrt(d))),
        color: "silver",
        opacity: 0.5,
        line: {
          color: "silver",
        },
      },
      customdata: randomRegions.filter((_, index) => mask[index]),
      hovertemplate:
        "X: %{x}<br>" +
        "Y: %{y}<br>" +
        "Random Region: %{customdata}" +
        "<extra></extra>",
      zorder: -1, // to show behind GMM, this is implemented in @types/react-plotly
    } as Partial<PlotData>;
    return trace;
  }, [vaeData]);

  const gmmDataPlot: Partial<PlotData>[] = useMemo(() => {
    if (gmmData.means.length === 0) {
      return [];
    }

    let gmmDataPlot: Partial<PlotData>[] = [];
    for (let i = 0; i < gmmData.means.length; i++) {
      const covalStr =
        "[" +
        gmmData.covariances[i]
          .map((row) => row.map((d) => d.toFixed(4)).join(", "))
          .join("],\n[") +
        "]";
      const meanStr =
        "[" + gmmData.means[i].map((d) => d.toFixed(4)).join(", ") + "]";

      const trace = zip(
        ...calculateTraces(gmmData.means[i], gmmData.covariances[i])
      ) as unknown as number[][];
      const plotData: Partial<PlotData> = {
        name: `MoG No.${i}`,
        showlegend: false,
        type: "scatter",
        x: trace[0],
        y: trace[1],
        mode: "lines",
        line: {
          color: "black",
        },
        hovertemplate:
          `<b>MoG No.${i}</b><br>` +
          `<b>Mean:</b> ${meanStr}<br>` +
          `<b>Coval:</b> ${covalStr}<br>`, // +
        // `<b>Sequence:</b> ${gmmData.decodedSequences[i]}<br>`,
      };
      const plotLabel: Partial<PlotData> = {
        name: `MoG No.${i}`,
        showlegend: false,
        type: "scatter",
        x: [gmmData.means[i][0]],
        y: [gmmData.means[i][1]],
        mode: "text",
        text: [`<b>${i}</b>`],
        textposition: "inside",
        hovertemplate:
          `<b>MoG No.${i}</b><br>` +
          `<b>Mean:</b> ${meanStr}<br>` +
          `<b>Coval:</b> ${covalStr}<br>`, // +
        // `<b>Sequence:</b> ${gmmData.decodedSequences[i]}<br>`,
      };
      gmmDataPlot.push(...[plotData, plotLabel]);
    }

    return gmmDataPlot;
  }, [gmmData]);

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
            aspectRatio: "10 / 9",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Plot
            data={[vaeDataPlot, ...gmmDataPlot]}
            useResizeHandler={true}
            layout={returnLayout("")}
            config={{ responsive: true }}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      </Card.Body>
    </Card>
  );
};

const calculateTraces = (mu: number[], sigma: number[][]) => {
  sigma = cloneDeep(sigma);
  const eig = eigs(sigma);
  let [lambda1, lambda2] = eig.values as number[];
  let [v1, v2] = transpose(eig.vectors) as number[][];

  if (lambda1 < lambda2) {
    [lambda1, lambda2] = [lambda2, lambda1];
    [v1, v2] = [v2, v1];
  }

  const [v1x, v1y] = v1;
  const theta = atan2(v1y, v1x);
  const width = 2 * Math.sqrt(lambda1);
  const height = 2 * Math.sqrt(lambda2);

  const trace = range(0, 2 * pi, 0.01, true)
    .map((t) => {
      const x =
        mu[0] + width * cos(t) * cos(theta) - height * sin(t) * sin(theta);
      const y =
        mu[1] + width * cos(t) * sin(theta) + height * sin(t) * cos(theta);
      return [x, y];
    })
    .toArray() as number[][];

  return trace;
};

export default LatentGraph;
