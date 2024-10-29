import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Data,
  Layout,
  PlotData,
  PlotDatum,
  PlotSelectionEvent,
} from "plotly.js";
import dynamic from "next/dynamic";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { cloneDeep, zip } from "lodash";

import { eigs, cos, sin, pi, range, atan2, transpose } from "mathjs";
import { useDispatch } from "react-redux";
import { apiClient } from "~/services/api-client";
import { setSelectedPoints } from "../redux/graph-data2";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });
interface PlotDatumAmend extends PlotDatum {
  fullData: Data;
}
interface PlotSelectionEventAmend extends PlotSelectionEvent {
  points: PlotDatumAmend[];
}

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

function useAsyncMemo<T>(
  asyncFunction: () => Promise<T>,
  deps: any[],
  defaultValue: T
): T {
  const [value, setValue] = useState<T>(defaultValue);
  const func = useCallback(asyncFunction, deps);
  useEffect(() => {
    func().then(setValue);
  }, [func, ...deps]);
  return value;
}

function useIsLoading(): [boolean, () => void, () => void] {
  const [currentJobs, setCurrentJobs] = useState(0);
  const lock = useCallback(() => {
    setCurrentJobs((prev) => prev + 1);
  }, []);
  const unlock = useCallback(() => {
    setCurrentJobs((prev) => prev - 1);
  }, [currentJobs]);
  const isLoading = currentJobs > 0;

  return [isLoading, lock, unlock];
}

const LatentGraph: React.FC = () => {
  const graphConfig = useSelector((state: RootState) => state.graphConfig);

  const graphConfig2 = useSelector((state: RootState) => state.graphConfig2);
  const encodeData2 = useSelector(
    (state: RootState) => state.interactionData.encoded
  );
  const decodeData2 = useSelector(
    (state: RootState) => state.interactionData.decoded
  );
  const grid = useSelector(
    (state: RootState) => state.interactionData.decodeGrid
  );
  const sessionConfig2 = useSelector(
    (state: RootState) => state.sessionConfig2
  );

  const layout = returnLayout(graphConfig.vaeName);

  const dispatch = useDispatch();

  const [isLoading, lock, unlock] = useIsLoading();

  // VAE data //
  const selexData = useAsyncMemo(
    async () => {
      if (sessionConfig2.vaeId === "") {
        return {
          duplicates: [],
          coord_x: [],
          coord_y: [],
          random_regions: [],
        };
      }

      lock();

      const res = await apiClient.getSelexData({
        queries: {
          vae_uuid: sessionConfig2.vaeId,
        },
      });

      unlock();

      return res;
    },
    [sessionConfig2.vaeId],
    { duplicates: [], coord_x: [], coord_y: [], random_regions: [] }
  );

  const vaeDataPlot: Partial<PlotData> = useMemo(() => {
    lock();
    const mcMask = selexData.duplicates.map(
      (value) => value >= graphConfig2.minCount
    );
    const coordsX = selexData.coord_x.filter((_, index) => mcMask[index]);
    const coordsY = selexData.coord_y.filter((_, index) => mcMask[index]);
    const duplicates = selexData.duplicates.filter((_, index) => mcMask[index]);
    const randomRegions = selexData.random_regions.filter(
      (_, index) => mcMask[index]
    );
    unlock();

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
      customdata: randomRegions,
      hovertemplate:
        "<b>Coord</b>: (%{x:.4f}, %{y:.4f})<br>" +
        "<b>Seq</b>: %{customdata}<br>" +
        "<b>Duplicates</b>: %{duplicates}",
    };
  }, [selexData, graphConfig2.minCount]);

  // Measured data //
  // const measuredDataPlot: Partial<PlotData>[] = useMemo(() => {
  //   if (!graphConfig.showMeasured) {
  //     return [];
  //   }

  //   let measuredDataPlot = [...measuredData];

  //   // categorize with series name
  //   const groupedData = groupBy(measuredDataPlot, "seriesName");

  //   return Object.keys(groupedData).map((key, index) => {
  //     const data = groupedData[key];
  //     return {
  //       name: key,
  //       showlegend: true,
  //       type: "scatter",
  //       x: data.map((d) => d.coordX),
  //       y: data.map((d) => d.coordY),
  //       mode: "markers",
  //       marker: {
  //         size: 5,
  //         color: ["#6495ed", "#ffa500", "#ffff00", "#800080", "#ff0000"][
  //           index % 5
  //         ],
  //       },
  //       customdata: data.map((d) => [d.id, d.randomRegion]),
  //       hovertemplate:
  //         `<b>ID</b>: %{customdata[0]}<br>` +
  //         "<b>Coord</b>: (%{x:.4f}, %{y:.4f})<br>" +
  //         `<b>Sequence:</b> %{customdata[1]}<br>`,
  //     };
  //   });
  // }, [measuredData, graphConfig.showMeasured]);

  // encode data //
  const encodeDataPlot: Partial<PlotData> = useMemo(() => {
    const shMask = encodeData2.shown;

    const ids = encodeData2.ids.filter((_, index) => shMask[index]);
    const coordsX = encodeData2.coordsX.filter((_, index) => shMask[index]);
    const coordsY = encodeData2.coordsY.filter((_, index) => shMask[index]);
    const randomRegions = encodeData2.randomRegions.filter(
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
        "<b>Coord:</b> (%{x:.4f}, %{y:.4f})<br>" +
        "<b>Seq:</b> %{customdata[1]}",
    };
  }, [encodeData2]);

  // decode data //
  const decodeDataPlot: Partial<PlotData> = useMemo(() => {
    const shMask = decodeData2.shown;

    const ids = decodeData2.ids.filter((_, index) => shMask[index]);
    const coordsX = decodeData2.coordsX.filter((_, index) => shMask[index]);
    const coordsY = decodeData2.coordsY.filter((_, index) => shMask[index]);
    const randomRegions = decodeData2.randomRegions.filter(
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
        "<b>Coord:</b> (%{x:.4f}, %{y:.4f})<br>" +
        "<b>Seq:</b> %{customdata[1]}",
    };
  }, [decodeData2]);

  const gridPlot: Partial<PlotData>[] = useMemo(() => {
    if (!graphConfig2.showDecodeGrid) {
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
        "<b>Decode Point</b><br>" +
        "<b>Coord:</b> (%{x:.4f}, %{y:.4f})<br>" +
        `<b>Seq:</b> ${grid.randomRegion}`,
    };

    return [decodeLineX, decodeLineY, decodeCrossPoint];
  }, [grid, graphConfig2.showDecodeGrid]);

  // GMM data //
  const gmmDataPlot: Partial<PlotData>[] = useAsyncMemo(
    async () => {
      if (!graphConfig2.showGMM || !sessionConfig2.gmmId) {
        return [];
      }

      lock();

      const gmm = await apiClient.getGMMModel({
        queries: {
          gmm_uuid: sessionConfig2.gmmId,
        },
      });

      const decoded = await apiClient.decode({
        session_uuid: sessionConfig2.sessionId,
        coords_x: gmm.means.map((value) => value[0]),
        coords_y: gmm.means.map((value) => value[1]),
      });

      let gmmPlots: Partial<PlotData>[] = [];

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
            `<b>Weight:</b> ${weightStr}<br>` +
            `<b>Mean:</b> ${meanStr}<br>` +
            `<b>Coval:</b> ${covalStr}<br>` +
            `<b>Decoded Seq:</b> ${decoded.sequences[i]}<br>`,
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
            `<b>Weight:</b> ${weightStr}<br>` +
            `<b>Mean:</b> ${meanStr}<br>` +
            `<b>Coval:</b> ${covalStr}<br>` +
            `<b>Sequence:</b> ${decoded.sequences[i]}<br>`,
        };
        gmmPlots.push(...[circle, label]);
      }

      unlock();

      return gmmPlots;
    },
    [graphConfig2.showGMM, sessionConfig2.gmmId],
    []
  );

  const handleSelected = ((eventData: PlotSelectionEventAmend) => {
    const points = eventData.points;
    const selectedData = points.map((point: any) => {
      return {
        key: point.pointIndex,
        uid: point.fullData.uid,
        hue: point.fullData.name,
        x: point.x,
        y: point.y,
      };
    });
    dispatch({
      type: "graphData/set",
      payload: selectedData,
    });
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
          ids.push(encodeData2.ids[point.pointIndex]);
          randomRegions.push(encodeData2.randomRegions[point.pointIndex]);
          duplicates.push(1);
          break;
        case "Decoded Data":
          ids.push(decodeData2.ids[point.pointIndex]);
          randomRegions.push(decodeData2.randomRegions[point.pointIndex]);
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
  }) as (eventData: PlotSelectionEvent) => void;

  return (
    <div>
      {isLoading.toString()}
      <Plot
        data={[
          vaeDataPlot,
          ...gmmDataPlot,
          encodeDataPlot,
          decodeDataPlot,
          ...gridPlot,
          // ...measuredDataPlot,
        ]}
        layout={layout}
        useResizeHandler={true}
        style={{ width: "100%" }}
        onSelected={handleSelected}
      />
    </div>
  );
};

export default LatentGraph;
