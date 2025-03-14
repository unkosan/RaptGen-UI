import { PlotData } from "plotly.js";
import { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { latentGraphLayout } from "~/components/common/graph-helper";

export type VaeData = {
  coordsX: number[];
  coordsY: number[];
  randomRegions: string[];
  duplicates: number[];
};

/**
 * Hook for preparing VAE data plot
 */
export const useVaeDataPlot = (vaeData: VaeData) => {
  const { minCount } = useSelector((state: RootState) => state.graphConfig);

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

  const layout = useMemo(() => {
    return latentGraphLayout("");
  }, []);

  return { vaeDataPlot, layout };
};

/**
 * Hook for CSV download functionality
 */
export const useDownloadCsv = (vaeData: VaeData) => {
  const handleClickSave = useCallback(() => {
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
  }, [vaeData]);

  return { handleClickSave };
};
