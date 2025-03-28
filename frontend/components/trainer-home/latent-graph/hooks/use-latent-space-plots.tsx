import { PlotData } from "plotly.js";
import { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { latentGraphLayout } from "~/components/common/graph-helper";
import { downloadFileFromText } from "~/components/viewer/downloader/hooks/utils";
import { zip } from "lodash";

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
    const mcMask = vaeData.duplicates.map((value) => value >= minCount);
    const coordsX = vaeData.coordsX.filter((_, index) => mcMask[index]);
    const coordsY = vaeData.coordsY.filter((_, index) => mcMask[index]);
    const duplicates = vaeData.duplicates.filter((_, index) => mcMask[index]);
    const randomRegions = vaeData.randomRegions.filter(
      (_, index) => mcMask[index]
    );

    return {
      x: coordsX,
      y: coordsY,
      type: "scatter",
      mode: "markers",
      marker: {
        size: duplicates.map((d) => Math.max(2, Math.sqrt(d))),
        color: "black",
        opacity: 0.5,
        line: {
          color: "black",
        },
      },
      customdata: zip(
        randomRegions,
        duplicates.map((d) => d.toString())
      ) as unknown as string[],
      hovertemplate:
        "<b>Coord</b>: (%{x:.4f}, %{y:.4f})<br>" +
        "<b>Random Region</b>: %{customdata[0]}<br>" +
        "<b>Duplicates</b>: %{customdata[1]}<br>",
    };
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
    downloadFileFromText(csvHeader + "\n" + csvData, "latent_points.csv");
  }, [vaeData]);

  return { handleClickSave };
};
