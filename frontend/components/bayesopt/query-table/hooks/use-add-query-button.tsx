import { useSelector, useDispatch } from "react-redux";
import { useCallback, useState } from "react";
import { cloneDeep } from "lodash";
import { RootState } from "../../redux/store";
import { QueriedValues, setQueriedValues } from "../../redux/queried-values";
import { setRegisteredValues } from "../../redux/registered-values";
import { setIsDirty } from "../../redux/is-dirty";

export const useAddQueryButton = () => {
  const dispatch = useDispatch();
  const registeredData = useSelector(
    (state: RootState) => state.registeredValues
  );
  const queryData = useSelector((state: RootState) => state.queriedValues);

  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(() => {
    setIsLoading(true);

    let newRegisteredData = cloneDeep(registeredData);
    let newQueryData: QueriedValues = {
      masterboxChecked: queryData.masterboxChecked,
      randomRegion: [],
      coordX: [],
      coordY: [],
      coordOriginalX: [],
      coordOriginalY: [],
      staged: [],
    };

    let currIndex = Math.max(...newRegisteredData.sequenceIndex);

    for (let i = 0; i < queryData.staged.length; i++) {
      if (queryData.staged[i]) {
        // move entry to registered data
        currIndex += 1;
        newRegisteredData.id.push("untitled -- " + currIndex.toString());
        newRegisteredData.randomRegion.push(queryData.randomRegion[i]);
        newRegisteredData.coordX.push(queryData.coordX[i]);
        newRegisteredData.coordY.push(queryData.coordY[i]);
        newRegisteredData.staged.push(registeredData.masterboxChecked);
        for (let j = 0; j < registeredData.columnNames.length; j++) {
          // All values are null for initialization
          newRegisteredData.sequenceIndex.push(currIndex);
          newRegisteredData.column.push(registeredData.columnNames[j]);
          newRegisteredData.value.push(null);
        }
      } else {
        // remain in query data
        newQueryData.randomRegion.push(queryData.randomRegion[i]);
        newQueryData.coordX.push(queryData.coordX[i]);
        newQueryData.coordY.push(queryData.coordY[i]);
        newQueryData.coordOriginalX.push(queryData.coordOriginalX[i]);
        newQueryData.coordOriginalY.push(queryData.coordOriginalY[i]);
        newQueryData.staged.push(queryData.masterboxChecked);
      }
    }

    dispatch(setRegisteredValues(newRegisteredData));
    dispatch(setQueriedValues(newQueryData));
    dispatch(setIsDirty(true));

    setIsLoading(false);
  }, [dispatch, registeredData, queryData, setIsLoading]);

  return {
    handleClick,
    isLoading,
  };
};
