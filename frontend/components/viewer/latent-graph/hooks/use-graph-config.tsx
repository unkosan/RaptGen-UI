import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { useSelector } from "react-redux";
import { setGraphConfig } from "../../redux/graph-config";

// Hook for graph configuration
export const useGraphConfig = () => {
  const [showGMM, setShowGMM] = useState<boolean>(true);
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
        showGMM,
      })
    );
  }, [isValidMinCount, showGMM, minCount, graphConfig.minCount]);

  const onMinCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setIsValidMinCount(!isNaN(value) && value >= 1);
    setMinCount(value);
  };

  const onShowGMMChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowGMM(e.target.checked);
  };

  return {
    showGMM,
    minCount,
    isValidMinCount,
    onMinCountChange,
    onShowGMMChange,
  };
};
