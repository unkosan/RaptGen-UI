import { Button } from "react-bootstrap";
import { useSelector } from "react-redux";
import CustomDataGrid from "~/components/common/custom-datagrid";
import { RootState } from "../redux/store";
import React, { useCallback } from "react";
import { cloneDeep } from "lodash";
import { useDispatch } from "react-redux";
import { TypeEditInfo } from "@inovua/reactdatagrid-community/types";
import { TypeOnSelectionChangeArg } from "@inovua/reactdatagrid-community/types/TypeDataGridProps";
import { apiClient } from "~/services/api-client";

const gridStyle = { minHeight: 400, width: "100%", zIndex: 950 };

export const RegisteredTable: React.FC = () => {
  const dispatch = useDispatch();
  const registeredData = useSelector(
    (state: RootState) => state.registeredValues
  );

  const onEditComplete = useCallback(
    (e: TypeEditInfo) => {
      let newData = cloneDeep(registeredData);
      if (e.columnId === "seq_id") {
        newData.id[e.rowIndex] = e.value;
      } else {
        let meltedIndex = -1;
        for (let i = 0; i < newData.sequenceIndex.length; i++) {
          if (
            newData.sequenceIndex[i] === e.rowIndex &&
            newData.column[i] === e.columnId
          ) {
            meltedIndex = i;
            break;
          }
        }
        newData.value[meltedIndex] = parseFloat(e.value);
      }

      dispatch({
        type: "registeredValues/set",
        payload: newData,
      });
      dispatch({
        type: "isDirty/set",
        payload: true,
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
      dispatch({
        type: "isDirty/set",
        payload: true,
      });
    },
    [registeredData]
  );

  const columns = registeredData.columnNames;

  let dataSource = registeredData.id.map((value, index) => {
    let row: { [key: string]: string | number | null } = {
      seq_id: value,
      random_region: registeredData.randomRegion[index],
      coord_X: registeredData.coordX[index],
      coord_Y: registeredData.coordY[index],
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
          {
            name: "seq_id",
            header: "ID",
            defaultVisible: true,
            editable: true,
          },
          {
            name: "random_region",
            header: "Random Region",
            defaultFlex: 1,
            editable: false,
          },
          ...displayColumns,
          { name: "coord_X", header: "X", editable: false },
          { name: "coord_Y", header: "Y", editable: false },
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

    dispatch({
      type: "isDirty/set",
      payload: true,
    });
  };

  return (
    <Button variant="primary" style={{ marginBottom: 10 }} onClick={onClick}>
      Run Bayes-Opt with checked data
    </Button>
  );
};
