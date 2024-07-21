import dynamic from "next/dynamic";
import { Layout, PlotData } from "plotly.js";
import { Badge, Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import { useSelector } from "react-redux";
import CustomDataGrid from "~/components/common/custom-datagrid";
import { RootState } from "../redux/store";
import React, { useCallback, useMemo } from "react";
import { cloneDeep } from "lodash";
import { useDispatch } from "react-redux";
import { TypeEditInfo } from "@inovua/reactdatagrid-community/types";
import { TypeOnSelectionChangeArg } from "@inovua/reactdatagrid-community/types/TypeDataGridProps";
import { apiClient } from "~/services/api-client";
import { QueriedValues } from "../redux/queried-values";

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

const LatentGraph: React.FC = () => {
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
    <Plot
      data={plots}
      layout={returnLayout("Latent Space")}
      config={{ responsive: true }}
      style={{ width: "100%" }}
    />
  );
};

const gridStyle = { minHeight: 400, width: "100%", zIndex: 950 };

const RegisteredTable: React.FC = () => {
  const dispatch = useDispatch();
  const registeredData = useSelector(
    (state: RootState) => state.registeredValues
  );

  const onEditComplete = useCallback(
    (e: TypeEditInfo) => {
      let newData = cloneDeep(registeredData);
      let index = -1;
      for (let i = 0; i < newData.sequenceIndex.length; i++) {
        if (
          newData.sequenceIndex[i] === parseInt(e.rowId) &&
          newData.column[i] === e.columnId
        ) {
          index = i;
          break;
        }
      }
      newData.value[index] = parseFloat(e.value);

      dispatch({
        type: "registeredValues/set",
        payload: newData,
      });
    },
    [registeredData]
  );

  const onSelectionChange = useCallback(
    (e: TypeOnSelectionChangeArg) => {
      let newData = cloneDeep(registeredData);
      if (e.selected === true) {
        const unselected =
          e.unselected === null
            ? []
            : Object.keys(e.unselected as Object).map((value) =>
                parseInt(value)
              );
        newData.staged = newData.staged.map((value, index) => {
          return !unselected.includes(index);
        });
      } else {
        const selected = Object.keys(e.selected as Object).map((value) =>
          parseInt(value)
        );
        newData.staged = newData.staged.map((value, index) => {
          return selected.includes(index);
        });
      }
      console.log(e.selected);
      console.log(e.unselected);

      dispatch({
        type: "registeredValues/set",
        payload: newData,
      });
    },
    [registeredData]
  );

  const columns = registeredData.columnNames;

  let dataSource = registeredData.randomRegion.map((value, index) => {
    let row: { [key: string]: string | number | null } = {
      id: index,
      randomRegion: value,
      coordX: registeredData.coordX[index],
      coordY: registeredData.coordY[index],
    };
    for (let i = 0; i < columns.length; i++) {
      row[columns[i]] = null;
    }
    return row;
  });

  for (let i = 0; i < registeredData.sequenceIndex.length; i++) {
    const index = registeredData.sequenceIndex[i];
    const column = registeredData.column[i];
    const value = registeredData.value[i];

    if (typeof dataSource[index] === "object") {
      dataSource[index][column] = value;
    }
  }

  const displayColumns = columns.map((column) => {
    return {
      name: column,
      header: column,
      defaultVisible: true,
    };
  });

  return (
    <>
      <legend>Registered values</legend>
      <CustomDataGrid
        columns={[
          { name: "id", header: "ID", defaultVisible: false, editable: false },
          {
            name: "randomRegion",
            header: "Random Region",
            defaultFlex: 1,
            editable: false,
          },
          ...displayColumns,
          { name: "coordX", header: "X", editable: false },
          { name: "coordY", header: "Y", editable: false },
        ]}
        dataSource={dataSource}
        style={gridStyle}
        rowStyle={{ fontFamily: "monospace" }}
        checkboxColumn
        pagination
        downloadable
        editable
        onEditComplete={onEditComplete}
        defaultSelected={registeredData.staged.map((value, index) => {
          return value ? index : -1;
        })}
        onSelectionChange={onSelectionChange}
        checkboxOnlyRowSelect
        copiable
      />
      <RunBayesOptButton />
    </>
  );
};

const QueryTable: React.FC = () => {
  const dispatch = useDispatch();
  const queryData = useSelector((state: RootState) => state.queriedValues);

  const dataSource = queryData.randomRegion.map((value, index) => {
    return {
      id: index,
      randomRegion: value,
      coordX: queryData.coordX[index],
      coordY: queryData.coordY[index],
      originalCoordX: queryData.coordOriginalX[index],
      originalCoordY: queryData.coordOriginalY[index],
    };
  });

  const onSelectionChange = useCallback(
    (e: TypeOnSelectionChangeArg) => {
      let newData = cloneDeep(queryData);
      if (e.selected === true) {
        const unselected =
          e.unselected === null
            ? []
            : Object.keys(e.unselected as Object).map((value) =>
                parseInt(value)
              );
        newData.staged = newData.staged.map((value, index) => {
          return !unselected.includes(index);
        });
      } else {
        const selected = Object.keys(e.selected as Object).map((value) =>
          parseInt(value)
        );
        newData.staged = newData.staged.map((value, index) => {
          return selected.includes(index);
        });
      }

      dispatch({
        type: "queriedValues/set",
        payload: newData,
      });
    },
    [queryData]
  );

  return (
    <>
      <legend>Query points by Bayesian Optimization</legend>
      <CustomDataGrid
        columns={[
          { name: "id", header: "ID", defaultVisible: false },
          { name: "randomRegion", header: "Random Region", defaultFlex: 1 },
          { name: "coordX", header: "X" },
          { name: "coordY", header: "Y" },
          {
            name: "originalCoordX",
            header: () => (
              <>
                Original X
                <OverlayTrigger
                  overlay={
                    <Tooltip>
                      <div style={{ textAlign: "left" }}>
                        <span className="font-monospace">Original X</span>
                        means the raw value of the X coordinate returned by the
                        Bayesian optimization. This value is reembedded through
                        the decoder and encoder of the VAE model to keep the
                        consistency of the latent space.
                      </div>
                    </Tooltip>
                  }
                >
                  <span className="ms-1">
                    <Badge pill bg="secondary">
                      ?
                    </Badge>
                  </span>
                </OverlayTrigger>
              </>
            ),
            defaultVisible: false,
          },
          {
            name: "originalCoordY",
            header: () => (
              <>
                Original Y
                <OverlayTrigger
                  overlay={
                    <Tooltip>
                      <div style={{ textAlign: "left" }}>
                        <span className="font-monospace">Original Y</span>
                        means the raw value of the Y coordinate returned by the
                        Bayesian optimization. This value is reembedded through
                        the decoder and encoder of the VAE model to keep the
                        consistency of the latent space.
                      </div>
                    </Tooltip>
                  }
                >
                  <span className="ms-1">
                    <Badge pill bg="secondary">
                      ?
                    </Badge>
                  </span>
                </OverlayTrigger>
              </>
            ),
            defaultVisible: false,
          },
        ]}
        dataSource={dataSource}
        style={gridStyle}
        rowStyle={{ fontFamily: "monospace" }}
        checkboxColumn
        pagination
        downloadable
        copiable
        defaultSelected={queryData.staged.map((value, index) => {
          return value ? index : -1;
        })}
        onSelectionChange={onSelectionChange}
        checkboxOnlyRowSelect
      />
      <AddQueryButton />
    </>
  );
};

const AddQueryButton: React.FC = () => {
  const dispatch = useDispatch();
  const registeredData = useSelector(
    (state: RootState) => state.registeredValues
  );
  const queryData = useSelector((state: RootState) => state.queriedValues);

  const onClick = () => {
    console.log("Add to the Register values table");
    console.log(queryData);

    let newRegisteredData = cloneDeep(registeredData);
    let newQueryData: QueriedValues = {
      randomRegion: [],
      coordX: [],
      coordY: [],
      coordOriginalX: [],
      coordOriginalY: [],
      staged: [],
    };

    let currIndex = Math.max(...newRegisteredData.sequenceIndex);

    for (let i = 0; i < queryData.staged.length; i++) {
      if (queryData.staged[i] === true) {
        currIndex += 1;
        newRegisteredData.randomRegion.push(queryData.randomRegion[i]);
        newRegisteredData.coordX.push(queryData.coordX[i]);
        newRegisteredData.coordY.push(queryData.coordY[i]);
        newRegisteredData.staged.push(false);
        for (let j = 0; j < registeredData.columnNames.length; j++) {
          newRegisteredData.sequenceIndex.push(currIndex);
          newRegisteredData.column.push(registeredData.columnNames[j]);
          newRegisteredData.value.push(null);
        }
      } else {
        newQueryData.randomRegion.push(queryData.randomRegion[i]);
        newQueryData.coordX.push(queryData.coordX[i]);
        newQueryData.coordY.push(queryData.coordY[i]);
        newQueryData.coordOriginalX.push(queryData.coordOriginalX[i]);
        newQueryData.coordOriginalY.push(queryData.coordOriginalY[i]);
        newQueryData.staged.push(false);
      }
    }

    dispatch({
      type: "registeredValues/set",
      payload: newRegisteredData,
    });
    dispatch({
      type: "queriedValues/set",
      payload: newQueryData,
    });
  };

  return (
    <Button variant="primary" onClick={onClick} style={{ marginBottom: 10 }}>
      Add to the Register values table
    </Button>
  );
};

const RunBayesOptButton: React.FC = () => {
  const dispatch = useDispatch();
  const bayesoptConfig = useSelector(
    (state: RootState) => state.bayesoptConfig
  );
  const registeredData = useSelector(
    (state: RootState) => state.registeredValues
  );
  const sessionId = useSelector(
    (state: RootState) => state.sessionConfig.sessionId
  );

  const validate = () => {
    console.log(bayesoptConfig);
    if (bayesoptConfig.targetColumn === "") {
      alert("Please select the target column");
      return false;
    }
    if (bayesoptConfig.queryBudget === 0) {
      alert("Please set the query budget");
      return false;
    }
    if (registeredData.staged.filter((value) => value).length === 0) {
      alert("Please register at least one value");
      return false;
    }

    for (let i = 0; i < registeredData.sequenceIndex.length; i++) {
      const index = registeredData.sequenceIndex[i];
      const column = registeredData.column[i];
      const value = registeredData.value[i];

      if (column !== bayesoptConfig.targetColumn) {
        continue;
      }
      if (registeredData.staged[index] === false) {
        continue;
      }

      if (typeof value !== "number") {
        alert("Please fill all the values");
        return false;
      }
    }

    return true;
  };

  const onClick = async () => {
    console.log("Run Bayes-Opt");

    if (!validate()) return;

    let values: number[] = [];
    for (let i = 0; i < registeredData.sequenceIndex.length; i++) {
      const index = registeredData.sequenceIndex[i];
      const column = registeredData.column[i];
      const value = registeredData.value[i];

      if (
        column === bayesoptConfig.targetColumn &&
        registeredData.staged[index]
      ) {
        if (typeof value === "number") values.push(value);
      }
    }

    let resBayesopt = await apiClient.runBayesopt({
      coords_x: registeredData.coordX,
      coords_y: registeredData.coordY,
      optimization_params: {
        method_name: "qEI",
        query_budget: bayesoptConfig.queryBudget,
      },
      distribution_params: {
        xlim_end: 3.5,
        xlim_start: -3.5,
        ylim_end: 3.5,
        ylim_start: -3.5,
      },
      values: [values],
    });

    console.log(resBayesopt.acquisition_data);
    console.log(resBayesopt.query_data);

    let coords_original = [];
    for (let i = 0; i < resBayesopt.query_data.coords_x.length; i++) {
      coords_original.push({
        coord_x: resBayesopt.query_data.coords_x[i],
        coord_y: resBayesopt.query_data.coords_y[i],
      });
    }

    let resDecode = await apiClient.decode({
      session_id: sessionId,
      coords: coords_original,
    });

    if (resDecode.status === "error") return;

    let resEncode = await apiClient.encode({
      session_id: sessionId,
      sequences: resDecode.data,
    });

    if (resEncode.status === "error") return;

    let coordX: number[] = [];
    let coordY: number[] = [];
    resEncode.data.forEach((value) => {
      coordX.push(value.coord_x);
      coordY.push(value.coord_y);
    });

    dispatch({
      type: "queriedValues/set",
      payload: {
        randomRegion: resDecode.data,
        coordX: coordX,
        coordY: coordY,
        coordOriginalX: resBayesopt.query_data.coords_x,
        coordOriginalY: resBayesopt.query_data.coords_y,
        staged: new Array(resDecode.data.length).fill(false),
      },
    });

    dispatch({
      type: "acquisitionValues/set",
      payload: {
        acquisitionValues: resBayesopt.acquisition_data.values,
        coordX: resBayesopt.acquisition_data.coords_x,
        coordY: resBayesopt.acquisition_data.coords_y,
      },
    });
  };

  return (
    <Button variant="primary" style={{ marginBottom: 10 }} onClick={onClick}>
      Run Bayes-Opt with checked data
    </Button>
  );
};

const Main: React.FC = () => {
  return (
    <div>
      <LatentGraph />

      <RegisteredTable />

      <QueryTable />
    </div>
  );
};

export default Main;
