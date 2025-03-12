import { zip } from "lodash";
import { PlotData } from "plotly.js";
import { useMemo } from "react";
import { calculateGMMRings } from "~/components/common/graph-helper";

import { Props } from "../";

export const useVaeDataPlot = (vaeData: Props["vaeData"], minCount: number) => {
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

export const useGmmDataPlot = (gmmData: Props["gmmData"]) => {
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
