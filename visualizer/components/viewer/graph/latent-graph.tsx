import React, { useMemo } from "react";
import { Layout, PlotData } from "plotly.js";
import dynamic from "next/dynamic";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { cloneDeep, groupBy, zip } from "lodash";

import { eigs, cos, sin, pi, range, atan2, transpose } from "mathjs";
import { useDispatch } from "react-redux";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

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

const LatentGraph: React.FC = () => {
  const vaeData = useSelector((state: RootState) => state.vaeData);
  const gmmData = useSelector((state: RootState) => state.gmmData);
  const measuredData = useSelector((state: RootState) => state.measuredData);
  const encodeData = useSelector((state: RootState) => state.encodeData);
  const decodeData = useSelector((state: RootState) => state.decodeData);
  const graphConfig = useSelector((state: RootState) => state.graphConfig);

  const layout = returnLayout(graphConfig.vaeName);

  const dispatch = useDispatch();

  // VAE data //
  const vaeDataPlot: Partial<PlotData> = useMemo(() => {
    let vaeDataPlot = cloneDeep(vaeData);

    // filter with minimum count
    vaeDataPlot.forEach((value) => {
      if (value.duplicates >= graphConfig.minCount) {
        value.isShown = true;
      } else {
        value.isShown = false;
      }
    });

    // return PlotData object
    const filteredData = vaeDataPlot.filter((value) => value.isShown);
    return {
      name: "SELEX",
      showlegend: false,
      type: "scatter",
      x: filteredData.map((value) => value.coordX),
      y: filteredData.map((value) => value.coordY),
      mode: "markers",
      marker: {
        size: filteredData.map((d) => Math.max(2, Math.sqrt(d.duplicates))),
        color: "silver",
        line: {
          color: "silver",
        },
      },
      customdata: filteredData.map((d) => [d.randomRegion, d.duplicates]),
      hovertemplate:
        "<b>Coord</b>: (%{x:.4f}, %{y:.4f})<br>" +
        "<b>Seq</b>: %{customdata[0]}<br>" +
        "<b>Duplicates</b>: %{customdata[1]}",
    };
  }, [vaeData, graphConfig.minCount]);

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
    const filteredData = encodeData.filter((d) => d.isShown);

    return {
      name: "Encoded Data",
      showlegend: true,
      type: "scatter",
      x: filteredData.map((d) => d.coordX),
      y: filteredData.map((d) => d.coordY),
      mode: "markers",
      marker: {
        size: 5,
        color: "#90ee90",
      },
      customdata: filteredData.map((d) => [d.id, d.randomRegion]),
      hovertemplate:
        "<b>Encoded Data</b><br>" +
        "<b>ID</b>: %{customdata[0]}<br>" +
        "<b>Coord:</b> (%{x:.4f}, %{y:.4f})<br>" +
        "<b>Seq:</b> %{customdata[1]}",
    };
  }, [encodeData]);

  // decode data //
  const decodeDataPlot: Partial<PlotData>[] = useMemo(() => {
    let filteredData;
    if (graphConfig.showDecodeGrid) {
      filteredData = decodeData.filter((d) => d.isShown);
    } else {
      filteredData = decodeData.slice(1).filter((d) => d.isShown);
    }

    const decodeDataPlot: Partial<PlotData> = {
      name: "Decoded Data",
      showlegend: true,
      type: "scatter",
      x: filteredData.map((d) => d.coordX),
      y: filteredData.map((d) => d.coordY),
      mode: "markers",
      marker: {
        size: 5,
        color: "#14c714",
      },
      customdata: filteredData.map((d) => [d.id, d.randomRegion]),
      hovertemplate:
        "<b>Decoded Data</b><br>" +
        "<b>ID</b>: %{customdata[0]}<br>" +
        "<b>Coord:</b> (%{x:.4f}, %{y:.4f})<br>" +
        "<b>Seq:</b> %{customdata[1]}",
    };

    const decodeLineX: Partial<PlotData> = {
      name: "Decode Line X",
      showlegend: false,
      type: "scatter",
      x: [decodeData[0]?.coordX, decodeData[0]?.coordX],
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
      y: [decodeData[0]?.coordY, decodeData[0]?.coordY],
      mode: "lines",
      line: {
        color: "#14c714",
        width: 1,
      },
    };

    if (graphConfig.showDecodeGrid) {
      return [decodeDataPlot, decodeLineX, decodeLineY];
    } else {
      return [decodeDataPlot];
    }
  }, [decodeData, graphConfig.showDecodeGrid]);

  // GMM data //
  const gmmDataPlot: Partial<PlotData>[] = useMemo(() => {
    if (!graphConfig.showGmm) {
      return [];
    }

    if (gmmData.means.length === 0) {
      return [];
    }

    let gmmDataPlot: Partial<PlotData>[] = [];
    for (let i = 0; i < gmmData.means.length; i++) {
      if (!gmmData.isShown[i]) {
        continue;
      }

      const covalStr =
        "[" +
        gmmData.covariances[i]
          .map((row) => row.map((d) => d.toFixed(4)).join(", "))
          .join("],\n[") +
        "]";
      const meanStr =
        "[" + gmmData.means[i].map((d) => d.toFixed(4)).join(", ") + "]";
      // const weightStr = gmmData.weights[i].toFixed(4);

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
          // `<b>Weight:</b> ${weightStr}<br>` +
          `<b>Mean:</b> ${meanStr}<br>` +
          `<b>Coval:</b> ${covalStr}<br>` +
          `<b>Sequence:</b> ${gmmData.decodedSequences[i]}<br>`,
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
          // `<b>Weight:</b> ${weightStr}<br>` +
          `<b>Mean:</b> ${meanStr}<br>` +
          `<b>Coval:</b> ${covalStr}<br>` +
          `<b>Sequence:</b> ${gmmData.decodedSequences[i]}<br>`,
      };
      gmmDataPlot.push(...[plotData, plotLabel]);
    }

    return gmmDataPlot;
  }, [graphConfig.showGmm, gmmData]);

  const handleSelected = (eventData: any) => {
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
  };

  return (
    <Plot
      data={[
        vaeDataPlot,
        ...gmmDataPlot,
        encodeDataPlot,
        ...decodeDataPlot,
        // ...measuredDataPlot,
      ]}
      layout={layout}
      useResizeHandler={true}
      style={{ width: "100%" }}
      onSelected={handleSelected}
    />
  );
};

export default LatentGraph;
