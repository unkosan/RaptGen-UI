import dynamic from "next/dynamic";
import { Layout, PlotData } from "plotly.js";
import { useSelector } from "react-redux";
import { RootState } from "./redux/store";
import React, { useMemo } from "react";
import { cloneDeep } from "lodash";
import { Card, Tab, Tabs } from "react-bootstrap";
import PlotConfig from "./plot-config";

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
        family: "monospace",
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

export const LatentGraph: React.FC = () => {
  const vaeData = useSelector((state: RootState) => state.vaeData);
  const registeredData = useSelector(
    (state: RootState) => state.registeredValues
  );
  const queryData = useSelector((state: RootState) => state.queriedValues);
  const graphConfig = useSelector((state: RootState) => state.graphConfig);
  const acquisitionData = useSelector(
    (state: RootState) => state.acquisitionValues
  );

  const acquisitionDataPlot: Partial<PlotData> = useMemo(() => {
    let acquisitionDataPlot = cloneDeep(acquisitionData);

    return {
      name: "Acquisition",
      showlegend: false,
      type: "contour",
      colorscale: "Viridis",

      x: acquisitionDataPlot.coordX,
      y: acquisitionDataPlot.coordY,
      z: acquisitionDataPlot.acquisitionValues,
      hoverinfo: "skip",
      line: {
        width: 2,
      },
      contours: {
        coloring: "lines",
        showlabels: true,
      },
      colorbar: {
        title: "Acq. Value",
      },
    };
  }, [acquisitionData]);

  const vaeDataPlot: Partial<PlotData> = useMemo(() => {
    let vaeDataPlot = cloneDeep(vaeData);

    vaeDataPlot.forEach((value) => {
      if (value.duplicates >= graphConfig.minCount) {
        value.isShown = true;
      } else {
        value.isShown = false;
      }
    });

    const filteredData = vaeDataPlot.filter((value) => value.isShown);
    return {
      name: "SELEX",
      showlegend: true,
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
  }, [vaeData, graphConfig]);

  const unregisteredDataPlot: Partial<PlotData> = useMemo(() => {
    return {
      name: "Unregistered",
      showlegend: true,
      type: "scatter",
      x: registeredData.coordX.filter((_, i) => !registeredData.staged[i]),
      y: registeredData.coordY.filter((_, i) => !registeredData.staged[i]),
      mode: "markers",
      marker: {
        size: 8,
        color: "blue",
        opacity: 0.3,
        line: {
          color: "blue",
        },
      },
      customdata: registeredData.randomRegion
        .filter((_, i) => !registeredData.staged[i])
        .map((d) => [d]),
      hovertemplate:
        "<b>Coord</b>: (%{x:.4f}, %{y:.4f})<br>" +
        "<b>Seq</b>: %{customdata[0]}",
    };
  }, [registeredData]);

  const registeredDataPlot: Partial<PlotData> = useMemo(() => {
    return {
      name: "Registered",
      showlegend: true,
      type: "scatter",
      x: registeredData.coordX.filter((_, i) => registeredData.staged[i]),
      y: registeredData.coordY.filter((_, i) => registeredData.staged[i]),
      mode: "markers",
      marker: {
        size: 8,
        color: "red",
        opacity: 0.5,
        line: {
          color: "red",
        },
      },
      customdata: registeredData.randomRegion
        .filter((_, i) => registeredData.staged[i])
        .map((d) => [d]),
      hovertemplate:
        "<b>Coord</b>: (%{x:.4f}, %{y:.4f})<br>" +
        "<b>Seq</b>: %{customdata[0]}",
    };
  }, [registeredData]);

  const queryDataPlot: Partial<PlotData> = useMemo(() => {
    return {
      name: "Query",
      showlegend: true,
      type: "scatter",
      x: queryData.coordX,
      y: queryData.coordY,
      mode: "markers",
      marker: {
        size: 8,
        color: "green",
        line: {
          color: "green",
        },
      },
      customdata: queryData.randomRegion.map((d) => [d]),
      hovertemplate:
        "<b>Coord</b>: (%{x:.4f}, %{y:.4f})<br>" +
        "<b>Seq</b>: %{customdata[0]}",
    };
  }, [queryData]);

  let plots = [registeredDataPlot, unregisteredDataPlot, queryDataPlot];
  if (graphConfig.showSelex) {
    plots = [vaeDataPlot, ...plots];
  }
  if (graphConfig.showAcquisition) {
    plots = [acquisitionDataPlot, ...plots];
  }

  return (
    <Tabs defaultActiveKey="latent-graph" id="latent-graph">
      <Tab eventKey="latent-graph" title="Latent Space">
        <Card className="mb-3">
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
                data={plots}
                layout={returnLayout("Latent Space")}
                useResizeHandler={true}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          </Card.Body>
        </Card>
      </Tab>
      <Tab eventKey="plot-config" title="Plot Config">
        <PlotConfig />
      </Tab>
    </Tabs>
  );
};
