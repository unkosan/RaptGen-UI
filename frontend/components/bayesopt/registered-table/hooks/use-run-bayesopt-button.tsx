import { useSelector, useDispatch } from "react-redux";
import { useCallback, useState } from "react";
import { RootState } from "../../redux/store";
import { setQueriedValues } from "../../redux/queried-values";
import { setAcquisitionValues } from "../../redux/acquisition-values";
import { setIsDirty } from "../../redux/is-dirty";
import { apiClient } from "~/services/api-client";

export const useRunBayesOptButton = () => {
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
  const [isLoading, setIsLoading] = useState(false);

  // Validate input data before running Bayesian optimization
  const validate = () => {
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
        // when value is null
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

  // Handle button click to run Bayesian optimization
  const handleClick = useCallback(async () => {
    if (!validate()) return;

    setIsLoading(true);

    try {
      // Prepare data for Bayesian optimization
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

      // Run Bayesian optimization
      const { query_data, acquisition_data } = await apiClient.runBayesopt({
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

      // Decode the coordinates to sequences
      const { sequences: decodedSequences } = await apiClient.decode({
        session_uuid: sessionId,
        coords_x: query_data.coords_x,
        coords_y: query_data.coords_y,
      });

      const randomRegion = decodedSequences.map((value) => {
        return value.replaceAll("_", "").replaceAll("N", "");
      });

      // Re-encode the sequences to get consistent coordinates
      const resEncode = await apiClient.encode({
        session_uuid: sessionId,
        sequences: randomRegion,
      });

      // Update Redux store with results
      dispatch(setIsDirty(true));
      dispatch(
        setQueriedValues({
          masterboxChecked: queryData.masterboxChecked,
          randomRegion: randomRegion,
          coordX: resEncode.coords_x,
          coordY: resEncode.coords_y,
          coordOriginalX: query_data.coords_x,
          coordOriginalY: query_data.coords_y,
          staged: new Array(decodedSequences.length).fill(
            queryData.masterboxChecked
          ),
        })
      );
      dispatch(
        setAcquisitionValues({
          acquisitionValues: acquisition_data.values,
          coordX: acquisition_data.coords_x,
          coordY: acquisition_data.coords_y,
        })
      );

      // Switch to query table tab
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [bayesoptConfig, registeredData, queryData, sessionId, dispatch]);

  return {
    isLoading,
    handleClick,
  };
};
