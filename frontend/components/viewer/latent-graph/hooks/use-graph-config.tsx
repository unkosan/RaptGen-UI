import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { useSelector } from "react-redux";
import { setGraphConfig } from "../../redux/graph-config";

// Hook for graph configuration
export const useGraphConfig = () => {
  const [showGMM, setShowGMM] = useState<boolean>(true);
  const [showTitle, setShowTitle] = useState<boolean>(false);
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
        showTitle,
      })
    );
  }, [isValidMinCount, showGMM, showTitle, minCount, dispatch, graphConfig.minCount]);

  const handleMinCountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value);
      setIsValidMinCount(!isNaN(value) && value >= 1);
      setMinCount(value);
    },
    []
  );

  const handleShowGMMChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setShowGMM(e.target.checked);
    },
    []
  );

  const handleShowTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setShowTitle(e.target.checked);
    },
    []
  )

  return {
    showGMM,
    showTitle,
    minCount,
    isValidMinCount,
    handleMinCountChange,
    handleShowGMMChange,
    handleShowTitleChange,
  };
};
