import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { setGraphConfig } from "../../redux/graph-config";

/**
 * Hook for graph configuration
 * Manages minimum count for filtering data points
 */
export const useGraphConfig = () => {
  const [minCount, setMinCount] = useState<number>(5);
  const [isValidMinCount, setIsValidMinCount] = useState<boolean>(true);

  const dispatch = useDispatch();
  const graphConfig = useSelector((state: RootState) => state.graphConfig);

  // Update configs in redux store
  useEffect(() => {
    dispatch(
      setGraphConfig({
        ...graphConfig,
        minCount: isValidMinCount ? minCount : graphConfig.minCount,
      })
    );
  }, [isValidMinCount, minCount, dispatch, graphConfig.minCount]);

  const onMinCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setIsValidMinCount(!isNaN(value) && value > 0);
    setMinCount(value);
  };

  return {
    minCount,
    isValidMinCount,
    onMinCountChange,
  };
};
