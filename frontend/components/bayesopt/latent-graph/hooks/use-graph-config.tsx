import { useCallback, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { setIsDirty } from "../../redux/is-dirty";
import { setGraphConfig } from "../../redux/graph-config";

export const useGraphConfig = () => {
  const dispatch = useDispatch();
  const graphConfig = useSelector((state: RootState) => state.graphConfig);

  const [minCount, setMinCount] = useState(graphConfig.minCount);
  const [showTitle, setShowTitle] = useState(graphConfig.showTitle);
  const [showSelex, setShowSelex] = useState(graphConfig.showSelex);
  const [showContour, setShowContour] = useState(graphConfig.showAcquisition);
  const [isValidMinCount, setIsValidMinCount] = useState(true);

  const setDirty = useCallback(() => {
    dispatch(setIsDirty(true));
  }, [dispatch]);

  const handleMinCountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.currentTarget.value);
      const isValid = !isNaN(value) && value > 0;
      setMinCount(value);
      setIsValidMinCount(isValid);

      if (!isValid) {
        try {
          setDirty();
        } catch (e) {
          console.error(e);
        }
        return;
      }

      try {
        setDirty();
        dispatch(
          setGraphConfig({
            ...graphConfig,
            minCount: parseInt(e.currentTarget.value),
          })
        );
      } catch (e) {
        console.error(e);
      }
    },
    [dispatch, graphConfig, setDirty]
  );

  const handleChangeShowSelex = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setShowSelex(e.currentTarget.checked);

      try {
        setDirty();
        dispatch(
          setGraphConfig({
            ...graphConfig,
            showSelex: e.currentTarget.checked,
          })
        );
      } catch (e) {
        console.error(e);
      }
    },
    [dispatch, graphConfig, setDirty]
  );

  const handleChangeShowContour = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setShowContour(e.currentTarget.checked);

      try {
        setDirty();
        dispatch(
          setGraphConfig({
            ...graphConfig,
            showAcquisition: e.currentTarget.checked,
          })
        );
      } catch (e) {
        console.error(e);
      }
    },
    [dispatch, graphConfig, setDirty]
  );

  const handleChangeShowTitle = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setShowTitle(e.currentTarget.checked);

      try {
        dispatch(
          setGraphConfig({
            ...graphConfig,
            showTitle: e.currentTarget.checked,
          })
        );
      } catch (e) {
        console.error(e);
      }
      return;
    },
    [dispatch, graphConfig, setDirty]
  );

  return {
    minCount,
    showSelex,
    showContour,
    showTitle,
    isValidMinCount,
    handleMinCountChange,
    handleChangeShowSelex,
    handleChangeShowContour,
    handleChangeShowTitle,
  };
};
