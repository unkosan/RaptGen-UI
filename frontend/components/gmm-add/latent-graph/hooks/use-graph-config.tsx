import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { setGraphConfig } from "../../redux/graphConfig";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";

/**
 * Hook for managing graph configuration
 * Handles minimum count state and validation
 */
export const useGraphConfig = () => {
  const graphConfig = useSelector((state: RootState) => state.graphConfig);
  const [minCount, setMinCount] = useState<string>(
    graphConfig.minCount.toString()
  );
  const [isValidMinCount, setIsValidMinCount] = useState<boolean>(true);
  const dispatch = useDispatch();

  const handleMinCountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value);
      const isValid = !isNaN(value) && value > 0;
      setMinCount(e.target.value);
      setIsValidMinCount(isValid);

      if (!isValid) {
        return;
      }

      try {
        dispatch(
          setGraphConfig({
            ...graphConfig,
            minCount: value,
          })
        );
      } catch (error) {
        console.error("Error setting graph config:", error);
      }
    },
    [dispatch, graphConfig]
  );

  return {
    minCount: parseInt(minCount),
    isValidMinCount,
    handleMinCountChange,
  };
};
