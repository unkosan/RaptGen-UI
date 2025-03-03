import { useCallback, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { setIsDirty } from "../../redux/is-dirty";
import { setBayesoptConfig } from "../../redux/bayesopt-config";

/**
 * Hook for managing Bayesian optimization configuration
 * Handles state and event handlers for the configuration form
 */
export const useBayesOptConfig = () => {
  const dispatch = useDispatch();
  const bayesoptConfig = useSelector(
    (state: RootState) => state.bayesoptConfig
  );
  const columns = useSelector(
    (state: RootState) => state.registeredValues.columnNames
  );

  const [queryBudget, setQueryBudget] = useState(5);
  const [targetColumn, setTargetColumn] = useState(bayesoptConfig.targetColumn);

  const [isValidBudget, setIsValidBudget] = useState(true);

  useEffect(() => {
    dispatch(
      setBayesoptConfig({
        ...bayesoptConfig,
        queryBudget: isValidBudget ? queryBudget : bayesoptConfig.queryBudget,
        targetColumn: targetColumn,
      })
    );
  }, [
    bayesoptConfig.queryBudget,
    dispatch,
    isValidBudget,
    queryBudget,
    targetColumn,
  ]);

  // Mark state as dirty (unsaved changes)
  const setDirty = useCallback(() => {
    dispatch(setIsDirty(true));
  }, [dispatch]);

  const onChangeColumnName = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value;
      setTargetColumn(value);
      setDirty();
    },
    [bayesoptConfig, dispatch, setDirty]
  );

  const onChangeBudget = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      const isValid = !isNaN(value) && value > 0;
      setQueryBudget(value);
      setIsValidBudget(isValid);
      setDirty();
    },
    [bayesoptConfig, dispatch, setDirty]
  );

  // Implement in the future
  const onChangeOptimizationType = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {},
    [bayesoptConfig, dispatch, setDirty]
  );

  return {
    columns,
    optimizationType: "qEI (multiple query)",
    targetColumn,
    queryBudget,
    isValidBudget,
    onChangeColumnName,
    onChangeBudget,
    onChangeOptimizationType,
  };
};
