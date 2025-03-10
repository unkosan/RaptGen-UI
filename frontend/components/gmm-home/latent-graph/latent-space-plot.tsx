import { zip } from "lodash";
import dynamic from "next/dynamic";
import { PlotData } from "plotly.js";
import { useMemo } from "react";
import { Card } from "react-bootstrap";
import {
  calculateGMMRings,
  latentGraphLayout,
} from "~/components/common/graph-helper";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

import { Props } from ".";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const useVaeDataPlot = (vaeData: Props["vaeData"], minCount: number) => {
  const vaeDataPlot: Partial<PlotData> = useMemo(() => {
    const { coordsX, coordsY, randomRegions, duplicates } = vaeData;
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
  }, [vaeData, minCount]);

  return { vaeDataPlot };
};

const useGmmDataPlot = (gmmData: Props["gmmData"]) => {
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
        ...calculateGMMRings(gmmData.means[i], gmmData.covariances[i])
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

  return { gmmDataPlot };
};

export const LatentSpacePlot: React.FC<Props> = ({ vaeData, gmmData }) => {
  const { minCount } = useSelector((state: RootState) => state.graphConfig);
  const { vaeDataPlot } = useVaeDataPlot(vaeData, minCount);
  const { gmmDataPlot } = useGmmDataPlot(gmmData);

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
            data={[vaeDataPlot, ...gmmDataPlot]}
            layout={latentGraphLayout("")}
            config={{
              responsive: true,
              displayModeBar: false,
            }}
            className="w-100 h-100"
          />
        </div>
      </Card.Body>
    </Card>
  );
};
