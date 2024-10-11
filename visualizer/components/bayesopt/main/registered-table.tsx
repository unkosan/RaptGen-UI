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
        // if selected all value by clicking the master checkbox
        newData.wholeSelected = true;
        const unselected =
          e.unselected === null // and if there is no unselected value by clicking the per-row checkbox
            ? []
            : Object.keys(e.unselected as Object);
        newData.staged = newData.id.map((value, index) => {
          return !unselected.includes(value);
        });
      } else {
        newData.wholeSelected = false;
        const selected = Object.keys(e.selected as Object);
        newData.staged = newData.id.map((value, index) => {
          return selected.includes(value);
        });
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
        idProperty="seq_id"
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
  const queryData = useSelector((state: RootState) => state.queriedValues);
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
      if (isNaN(value)) {
        alert("Please fill all the values with valid numbers");
        return false;
      }
    }

    return true;
  };

  const onClick = async () => {
    console.log("Run Bayes-Opt");

    if (!validate()) return;

    let coordX: number[] = [];
    let coordY: number[] = [];
    let values: number[] = [];
    for (let i = 0; i < registeredData.sequenceIndex.length; i++) {
      const index = registeredData.sequenceIndex[i];
      const column = registeredData.column[i];
      const value = registeredData.value[i];

      if (
        column !== bayesoptConfig.targetColumn ||
        registeredData.staged[index] === false ||
        typeof value !== "number"
      ) {
        continue;
      }

      values.push(value);
      coordX.push(registeredData.coordX[index]);
      coordY.push(registeredData.coordY[index]);
    }

    let resBayesopt = await apiClient.runBayesopt({
      coords_x: coordX,
      coords_y: coordY,
      optimization_args: {
        method_name: "qEI",
        query_budget: bayesoptConfig.queryBudget,
      },
      distribution_args: {
        xlim_max: 3.5,
        xlim_min: -3.5,
        ylim_max: 3.5,
        ylim_min: -3.5,
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

    try {
      const resDecode = await apiClient.decode({
        session_uuid: sessionId,
        coords_x: resBayesopt.query_data.coords_x,
        coords_y: resBayesopt.query_data.coords_y,
      });

      const randomRegion = resDecode.sequences.map((value) => {
        return value.replaceAll("_", "").replaceAll("N", "");
      });

      const resEncode = await apiClient.encode({
        session_uuid: sessionId,
        sequences: randomRegion,
      });

      dispatch({
        type: "isDirty/set",
        payload: true,
      });

      dispatch({
        type: "queriedValues/set",
        payload: {
          wholeSelected: queryData.wholeSelected,
          randomRegion: randomRegion,
          coordX: resEncode.coords_x,
          coordY: resEncode.coords_y,
          coordOriginalX: resBayesopt.query_data.coords_x,
          coordOriginalY: resBayesopt.query_data.coords_y,
          staged: new Array(resDecode.sequences.length).fill(
            queryData.wholeSelected
          ),
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
    } catch (e) {
      console.error(e);
      return;
    }
  };

  return (
    <Button variant="primary" style={{ marginBottom: 10 }} onClick={onClick}>
      Run Bayes-Opt with checked data
    </Button>
  );
};
