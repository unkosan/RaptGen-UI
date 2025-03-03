import { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { cloneDeep } from "lodash";
import { TypeOnSelectionChangeArg } from "@inovua/reactdatagrid-community/types/TypeDataGridProps";
import { RootState } from "../../redux/store";
import { setQueriedValues } from "../../redux/queried-values";
import { setIsDirty } from "../../redux/is-dirty";

export const useQueryTable = () => {
  const dispatch = useDispatch();
  const queryData = useSelector((state: RootState) => state.queriedValues);

  // Create data source for the grid
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

  // Handle selection changes in the grid table
  // This section complicated because ReactDataGrid does not provide instinctive API
  const onSelectionChange = useCallback(
    (e: TypeOnSelectionChangeArg) => {
      let newData = cloneDeep(queryData);
      if (e.selected === true) {
        // masterbox checked
        newData.masterboxChecked = true;
        const unselected =
          e.unselected === null // all entries are selected
            ? []
            : Object.keys(e.unselected as Object).map((value) =>
                parseInt(value)
              );
        // each index of entries are saved as keys in object e.unselected
        newData.staged = newData.staged.map((_, index) => {
          return !unselected.includes(index);
        });
      } else {
        // masterbox unchecked
        newData.masterboxChecked = false;
        // selected entries are saved as keys in e.selected
        const selected = Object.keys(e.selected as Object).map((value) =>
          parseInt(value)
        );
        // index saved as keys of array
        newData.staged = newData.staged.map((_, index) => {
          return selected.includes(index);
        });
      }

      dispatch(setQueriedValues(newData));
      dispatch(setIsDirty(true));
    },
    [queryData, dispatch]
  );

  // Indices of selected rows, used for default selection
  const selectedIndices = queryData.staged
    .map((value, index) => (value ? index : -1))
    .filter((index) => index !== -1);

  return {
    dataSource,
    onSelectionChange,
    selectedIndices,
  };
};
