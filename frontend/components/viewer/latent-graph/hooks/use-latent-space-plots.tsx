// This file contains all hooks related to the latent graph visualization
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { apiClient } from "~/services/api-client";
import calculateTraces from "~/hooks/calculate-traces";
import { zip } from "lodash";
import { PlotData, PlotDatum, PlotSelectionEvent } from "plotly.js";
import { Data } from "plotly.js";
import { setSelectedPoints } from "../../redux/selected-points";

// Types for plot selection event
interface PlotDatumAmend extends PlotDatum {
  fullData: Data;
}

interface PlotSelectionEventAmend extends PlotSelectionEvent {
  points: PlotDatumAmend[];
}

// Hook for VAE plot data
export const useVaePlotData = (vaeId: string, minCount: number) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selexData, setSelexData] = useState<{
    duplicates: number[];
    coord_x: number[];
    coord_y: number[];
    random_regions: string[];
  }>({
    duplicates: [],
    coord_x: [],
    coord_y: [],
    random_regions: [],
  });

  // Fetch SELEX data from API
  useEffect(() => {
    const fetchSelexData = async () => {
      if (vaeId === "") {
        return;
      }

      setIsLoading(true);
      try {
        const res = await apiClient.getSelexData({
          queries: {
            vae_uuid: vaeId,
          },
        });
        setSelexData(res);
      } catch (error) {
        console.error("Error fetching SELEX data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSelexData();
  }, [vaeId]);

  // Process VAE data for plotting
  const vaeDataPlot: Partial<PlotData> = useMemo(() => {
    const mcMask = selexData.duplicates.map((value) => value >= minCount);
    const coordsX = selexData.coord_x.filter((_, index) => mcMask[index]);
    const coordsY = selexData.coord_y.filter((_, index) => mcMask[index]);
    const duplicates = selexData.duplicates.filter((_, index) => mcMask[index]);
    const randomRegions = selexData.random_regions.filter(
      (_, index) => mcMask[index]
    );

    return {
      name: "SELEX",
      showlegend: false,
      type: "scatter",
      x: coordsX,
      y: coordsY,
      mode: "markers",
      marker: {
        size: duplicates.map((d) => Math.max(2, Math.sqrt(d))),
        color: "silver",
        line: {
          color: "silver",
        },
      },
      customdata: zip(
        randomRegions,
        duplicates.map((d) => d.toString())
      ) as unknown as string[],
      hovertemplate:
        "<b>Coord</b>: (%{x:.4f}, %{y:.4f})<br>" +
        "<b>Seq</b>: %{customdata[0]}<br>" +
        "<b>Duplicates</b>: %{customdata[1]}",
    };
  }, [selexData, minCount]);

  return {
    selexData,
    vaeDataPlot,
    isLoading,
  };
};

// Hook for GMM data plot
export const useGmmDataPlot = (
  showGMM: boolean,
  gmmId: string,
  sessionId: string
) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [gmmDataPlot, setGmmDataPlot] = useState<Partial<PlotData>[]>([]);

  // Fetch and process GMM data
  useEffect(() => {
    const fetchGmmData = async () => {
      if (!showGMM || !gmmId) {
        setGmmDataPlot([]);
        return;
      }

      setIsLoading(true);
      try {
        const gmm = await apiClient.getGMMModel({
          queries: {
            gmm_uuid: gmmId,
          },
        });

        const centroidSequence = sessionId
          ? await apiClient
              .decode({
                session_uuid: sessionId,
                coords_x: gmm.means.map((value) => value[0]),
                coords_y: gmm.means.map((value) => value[1]),
              })
              .then((res) => res.sequences)
          : Array.from(
              { length: gmm.means.length },
              () => "No sequence provided"
            );

        let plots: Partial<PlotData>[] = [];

        for (let i = 0; i < gmm.weights.length; i++) {
          const weightStr = gmm.weights[i].toFixed(4);
          const meanStr =
            "[" + gmm.means[i].map((d) => d.toFixed(4)).join(", ") + "]";
          const covalStr =
            "[" +
            gmm.covariances[i]
              .map((row) => row.map((d) => d.toFixed(4)).join(", "))
              .join("],\n[") +
            "]";

          const trace = zip(
            ...calculateTraces(gmm.means[i], gmm.covariances[i])
          ) as unknown as number[][];

          const circle: Partial<PlotData> = {
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
              `<b>Weight</b>: ${weightStr}<br>` +
              `<b>Mean</b>: ${meanStr}<br>` +
              `<b>Coval</b>: ${covalStr}<br>` +
              `<b>Decoded Sequence</b>: ${centroidSequence[i]}<br>`,
          };

          const label: Partial<PlotData> = {
            name: `MoG No.${i}`,
            showlegend: false,
            type: "scatter",
            x: [gmm.means[i][0]],
            y: [gmm.means[i][1]],
            mode: "text",
            text: [`<b>${i}</b>`],
            textposition: "inside",
            hovertemplate:
              `<b>MoG No.${i}</b><br>` +
              `<b>Weight</b>: ${weightStr}<br>` +
              `<b>Mean</b>: ${meanStr}<br>` +
              `<b>Coval</b>: ${covalStr}<br>` +
              `<b>Decoded Sequence</b>: ${centroidSequence[i]}<br>`,
          };
          plots.push(...[circle, label]);
        }

        setGmmDataPlot(plots);
      } catch (error) {
        console.error("Error fetching GMM data:", error);
        setGmmDataPlot([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGmmData();
  }, [showGMM, gmmId, sessionId]);

  return {
    gmmDataPlot,
    isLoading,
  };
};

// Hook for encode data plot
export const useEncodeDataPlot = () => {
  const encodeData = useSelector(
    (state: RootState) => state.interactionData.encoded
  );

  // Process encode data for plotting
  const encodeDataPlot: Partial<PlotData> = useMemo(() => {
    const shMask = encodeData.shown;

    const ids = encodeData.ids.filter((_, index) => shMask[index]);
    const coordsX = encodeData.coordsX.filter((_, index) => shMask[index]);
    const coordsY = encodeData.coordsY.filter((_, index) => shMask[index]);
    const randomRegions = encodeData.randomRegions.filter(
      (_, index) => shMask[index]
    );

    return {
      name: "Encoded Data",
      showlegend: true,
      type: "scatter",
      x: coordsX,
      y: coordsY,
      mode: "markers",
      marker: {
        size: 5,
        color: "#90ee90",
      },
      customdata: zip(ids, randomRegions) as unknown as string[][],
      hovertemplate:
        "<b>Encoded Data</b><br>" +
        "<b>ID</b>: %{customdata[0]}<br>" +
        "<b>Coord</b>: (%{x:.4f}, %{y:.4f})<br>" +
        "<b>Seq</b>: %{customdata[1]}",
    };
  }, [encodeData]);

  return {
    encodeDataPlot,
  };
};

// Hook for decode data plot
export const useDecodeDataPlot = () => {
  const decodeData = useSelector(
    (state: RootState) => state.interactionData.decoded
  );

  // Process decode data for plotting
  const decodeDataPlot: Partial<PlotData> = useMemo(() => {
    const shMask = decodeData.shown;

    const ids = decodeData.ids.filter((_, index) => shMask[index]);
    const coordsX = decodeData.coordsX.filter((_, index) => shMask[index]);
    const coordsY = decodeData.coordsY.filter((_, index) => shMask[index]);
    const randomRegions = decodeData.randomRegions.filter(
      (_, index) => shMask[index]
    );

    return {
      name: "Decoded Data",
      showlegend: true,
      type: "scatter",
      x: coordsX,
      y: coordsY,
      mode: "markers",
      marker: {
        size: 5,
        color: "#14c714",
      },
      customdata: zip(ids, randomRegions) as unknown as string[][],
      hovertemplate:
        "<b>Decoded Data</b><br>" +
        "<b>ID</b>: %{customdata[0]}<br>" +
        "<b>Coord</b>: (%{x:.4f}, %{y:.4f})<br>" +
        "<b>Seq</b>: %{customdata[1]}",
    };
  }, [decodeData]);

  return {
    decodeDataPlot,
  };
};

// Hook for grid data plot
export const useGridDataPlot = () => {
  const graphConfig = useSelector((state: RootState) => state.graphConfig);
  const grid = useSelector(
    (state: RootState) => state.interactionData.decodeGrid
  );

  // Process grid data for plotting
  const gridPlot: Partial<PlotData>[] = useMemo(() => {
    if (!graphConfig.showDecodeGrid) {
      return [];
    }

    const decodeLineX: Partial<PlotData> = {
      name: "Decode Line X",
      showlegend: false,
      type: "scatter",
      x: [grid.coordX, grid.coordX],
      y: [-4, 4],
      mode: "lines",
      line: {
        color: "#14c714",
        width: 1,
      },
    };

    const decodeLineY: Partial<PlotData> = {
      name: "Decode Line Y",
      showlegend: false,
      type: "scatter",
      x: [-4, 4],
      y: [grid.coordY, grid.coordY],
      mode: "lines",
      line: {
        color: "#14c714",
        width: 1,
      },
    };

    const decodeCrossPoint: Partial<PlotData> = {
      name: "Decode Point",
      showlegend: false,
      type: "scatter",
      x: [grid.coordX],
      y: [grid.coordY],
      mode: "markers",
      marker: {
        size: 5,
        color: "#14c714",
      },
      hovertemplate:
        "<b>Decode Point</b><br>" + "<b>Coord</b>: (%{x:.4f}, %{y:.4f})<br>",
    };

    return [decodeLineX, decodeLineY, decodeCrossPoint];
  }, [grid, graphConfig.showDecodeGrid]);

  return {
    gridPlot,
  };
};

// Hook for selection handling
export const useSelectionHandler = (selexData: any) => {
  const dispatch = useDispatch();
  const encodeData = useSelector(
    (state: RootState) => state.interactionData.encoded
  );
  const decodeData = useSelector(
    (state: RootState) => state.interactionData.decoded
  );

  // Handle selection of points on the graph
  const handleSelected = useCallback(
    (eventData: PlotSelectionEventAmend) => {
      const points = eventData.points;
      let ids: string[] = [];
      let randomRegions: string[] = [];
      let duplicates: number[] = [];
      for (const point of points) {
        const hue = String(point.fullData.name);
        switch (hue) {
          case "SELEX":
            ids.push(selexData.duplicates[point.pointIndex].toString());
            randomRegions.push(selexData.random_regions[point.pointIndex]);
            duplicates.push(selexData.duplicates[point.pointIndex]);
            break;
          case "Encoded Data":
            ids.push(encodeData.ids[point.pointIndex]);
            randomRegions.push(encodeData.randomRegions[point.pointIndex]);
            duplicates.push(1);
            break;
          case "Decoded Data":
            ids.push(decodeData.ids[point.pointIndex]);
            randomRegions.push(decodeData.randomRegions[point.pointIndex]);
            duplicates.push(1);
            break;
          default:
            if (/^MoG No.\d+$/.test(hue)) {
              const res = /MoG No.(\d+)/.exec(hue);
              const num = parseInt(res![1]);
              duplicates.push(1);
            }
        }
      }
      dispatch(
        setSelectedPoints({
          ids: ids,
          coordsX: points.map((point) => point.x) as number[],
          coordsY: points.map((point) => point.y) as number[],
          series: points.map((point) => String(point.fullData.name)),
          duplicates: duplicates,
          randomRegions: randomRegions,
        })
      );
    },
    [selexData, encodeData, decodeData, dispatch]
  );

  return {
    handleSelected: handleSelected as (eventData: PlotSelectionEvent) => void,
  };
};
