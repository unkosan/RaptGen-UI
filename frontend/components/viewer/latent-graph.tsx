import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Data, PlotData, PlotDatum, PlotSelectionEvent } from "plotly.js";
import dynamic from "next/dynamic";
import { useSelector } from "react-redux";
import { RootState } from "./redux/store";
import { cloneDeep, zip } from "lodash";
import { Card, Tab, Tabs } from "react-bootstrap";

import { eigs, cos, sin, pi, range, atan2, transpose } from "mathjs";
import { useDispatch } from "react-redux";
import { apiClient } from "~/services/api-client";
import { setSelectedPoints } from "./redux/selected-points";
import ConfigSelector from "./config-selector";
import { latentGraphLayout } from "../common/graph-layout";
import LoadingPane from "../common/loading-pane";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });
interface PlotDatumAmend extends PlotDatum {
  fullData: Data;
}
interface PlotSelectionEventAmend extends PlotSelectionEvent {
  points: PlotDatumAmend[];
}

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
  const encodeData = useSelector(
    (state: RootState) => state.interactionData.encoded
  );
  const decodeData = useSelector(
    (state: RootState) => state.interactionData.decoded
  );
  const grid = useSelector(
    (state: RootState) => state.interactionData.decodeGrid
  );
  const sessionConfig = useSelector((state: RootState) => state.sessionConfig);

  // const layout = latentGraphLayout(sessionConfig.vaeName);
  const layout = latentGraphLayout("");

  const dispatch = useDispatch();

  const [isLoading, lock, unlock] = useIsLoading();

  // VAE data //
  const selexData = useAsyncMemo(
    async () => {
      if (sessionConfig.vaeId === "") {
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
          vae_uuid: sessionConfig.vaeId,
        },
      });

      unlock();

      return res;
    },
    [sessionConfig.vaeId],
    { duplicates: [], coord_x: [], coord_y: [], random_regions: [] }
  );

  const vaeDataPlot: Partial<PlotData> = useMemo(() => {
    lock();
    const mcMask = selexData.duplicates.map(
      (value) => value >= graphConfig.minCount
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
      customdata: zip(
        randomRegions,
        duplicates.map((d) => d.toString())
      ) as unknown as string[],
      hovertemplate:
        "<b>Coord</b>: (%{x:.4f}, %{y:.4f})<br>" +
        "<b>Seq</b>: %{customdata[0]}<br>" +
        "<b>Duplicates</b>: %{customdata[1]}",
    };
  }, [selexData, graphConfig.minCount]);

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
        "<b>Coord:</b> (%{x:.4f}, %{y:.4f})<br>" +
        "<b>Seq:</b> %{customdata[1]}",
    };
  }, [encodeData]);

  // decode data //
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
        "<b>Coord:</b> (%{x:.4f}, %{y:.4f})<br>" +
        "<b>Seq:</b> %{customdata[1]}",
    };
  }, [decodeData]);

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
        "<b>Decode Point</b><br>" +
        "<b>Coord:</b> (%{x:.4f}, %{y:.4f})<br>" +
        `<b>Seq:</b> ${grid.randomRegion}`,
    };

    return [decodeLineX, decodeLineY, decodeCrossPoint];
  }, [grid, graphConfig.showDecodeGrid]);

  // GMM data //
  const gmmDataPlot: Partial<PlotData>[] = useAsyncMemo(
    async () => {
      if (!graphConfig.showGMM || !sessionConfig.gmmId) {
        return [];
      }

      lock();

      const gmm = await apiClient.getGMMModel({
        queries: {
          gmm_uuid: sessionConfig.gmmId,
        },
      });

      const decoded = await apiClient.decode({
        session_uuid: sessionConfig.sessionId,
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
            `<b>Decoded Centroid:</b> ${decoded.sequences[i]}<br>`,
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
            `<b>Decoded Sequence:</b> ${decoded.sequences[i]}<br>`,
        };
        gmmPlots.push(...[circle, label]);
      }

      unlock();

      return gmmPlots;
    },
    [graphConfig.showGMM, sessionConfig.gmmId],
    []
  );

  const handleSelected = ((eventData: PlotSelectionEventAmend) => {
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
  }) as (eventData: PlotSelectionEvent) => void;

  return (
    <Tabs className="" defaultActiveKey="latent-graph" id="latent-graph">
      <Tab eventKey="latent-graph" title="Latent space">
        <Card className="mb-3">
          <Card.Body>
            <div
              className="justify-content-center align-items-center w-100"
              style={{
                aspectRatio: "1 / 1",
              }}
            >
              {isLoading ? (
                <LoadingPane label="Loading..." />
              ) : (
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
                  onSelected={handleSelected}
                  className="w-100 h-100"
                />
              )}
            </div>
          </Card.Body>
        </Card>
      </Tab>
      <Tab eventKey="plot-config" title="Plot config">
        <ConfigSelector />
      </Tab>
    </Tabs>
  );
};

export default LatentGraph;
