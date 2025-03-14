import { useCallback, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { setIsDirty } from "../../redux/is-dirty";
import { setGraphConfig } from "../../redux/graph-config";

export const useGraphConfig = () => {
  const dispatch = useDispatch();
  const graphConfig = useSelector((state: RootState) => state.graphConfig);

  const [minCount, setMinCount] = useState(graphConfig.minCount);
  const [showSelex, setShowSelex] = useState(graphConfig.showSelex);
  const [showContour, setShowContour] = useState(graphConfig.showAcquisition);
  const [isValidMinCount, setIsValidMinCount] = useState(true);

  const setDirty = useCallback(() => {
    dispatch(setIsDirty(true));
  }, [dispatch]);

  const handleMinCountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDirty();

      const value = parseInt(e.currentTarget.value);
      const isValid = !isNaN(value) && value > 0;
      setMinCount(value);
      setIsValidMinCount(isValid);

      if (!isValid) {
        return;
      }

      try {
        dispatch(
          setGraphConfig({
            ...graphConfig,
            minCount: parseInt(e.currentTarget.value),
          })
        );
      } catch (e) {
        console.error(e);
        return;
      }
    },
    [dispatch, graphConfig, setDirty]
  );

  const handleShowSelexChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDirty();
      setShowSelex(e.currentTarget.checked);

      try {
        dispatch(
          setGraphConfig({
            ...graphConfig,
            showSelex: e.currentTarget.checked,
          })
        );
      } catch (e) {
        console.error(e);
        return;
      }
    },
    [dispatch, graphConfig, setDirty]
  );

  const handleChangeShowContour = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDirty();
      setShowContour(e.currentTarget.checked);

      try {
        dispatch(
          setGraphConfig({
            ...graphConfig,
            showAcquisition: e.currentTarget.checked,
          })
        );
      } catch (e) {
        console.error(e);
        return;
      }
    },
    [dispatch, graphConfig, setDirty]
  );

  return {
    minCount,
    showSelex,
    showContour,
    isValidMinCount,
    handleMinCountChange,
    handleShowSelexChange,
    handleChangeShowContour,
  };
};
