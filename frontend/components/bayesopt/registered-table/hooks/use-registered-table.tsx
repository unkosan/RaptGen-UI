import { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { cloneDeep } from "lodash";
import { TypeEditInfo } from "@inovua/reactdatagrid-community/types";
import { TypeOnSelectionChangeArg } from "@inovua/reactdatagrid-community/types/TypeDataGridProps";
import { RootState } from "../../redux/store";
import { setRegisteredValues } from "../../redux/registered-values";
import { setIsDirty } from "../../redux/is-dirty";

export const useRegisteredTable = () => {
  const dispatch = useDispatch();
  const registeredData = useSelector(
    (state: RootState) => state.registeredValues
  );

  // Handle edit completion in the grid
  const onEditComplete = useCallback(
    (e: TypeEditInfo) => {
      let newData = cloneDeep(registeredData);
      if (e.columnId === "seq_id") {
        newData.id[e.rowIndex] = e.value;
      } else {
        // Identify the index in sequenceIndex array corresponding to the cell
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

      dispatch(setRegisteredValues(newData));
      dispatch(setIsDirty(true));
    },
    [registeredData, dispatch]
  );

  // Handle selection changes in the grid
  // This section complicated because ReactDataGrid does not provide instinctive API
  const onSelectionChange = useCallback(
    (e: TypeOnSelectionChangeArg) => {
      let newData = cloneDeep(registeredData);
      if (e.selected === true) {
        // masterbox checked
        newData.masterboxChecked = true;
        const unselected =
          e.unselected === null // all entries are selected
            ? []
            : Object.keys(e.unselected as Object);
        // each id of entries are saved as keys in object e.unselected
        newData.staged = newData.id.map((value, index) => {
          return !unselected.includes(value);
        });
      } else {
        // masterbox unchecked
        newData.masterboxChecked = false;
        const selected = Object.keys(e.selected as Object);
        // id saved as keys of object
        newData.staged = newData.id.map((value, index) => {
          return selected.includes(value);
        });
      }

      dispatch(setRegisteredValues(newData));
      dispatch(setIsDirty(true));
    },
    [registeredData, dispatch]
  );

  // Prepare data for the grid
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

  // Get default selected rows
  const defaultSelected = registeredData.staged
    .map((value, index) => (value ? index : -1))
    .filter((index) => index !== -1);

  return {
    dataSource,
    displayColumns,
    onEditComplete,
    onSelectionChange,
    defaultSelected,
  };
};
