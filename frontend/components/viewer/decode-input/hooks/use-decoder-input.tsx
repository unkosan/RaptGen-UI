import { useCallback, useEffect, useState } from "react";
import { setDecodeGrid } from "../../redux/interaction-data";
import { useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { useSelector } from "react-redux";
import { setGraphConfig } from "../../redux/graph-config";

export const useCoords = () => {
  const [pointX, setPointX] = useState<string>("0");
  const [pointY, setPointY] = useState<string>("0");
  const [isValidX, setIsValidX] = useState<boolean>(true);
  const [isValidY, setIsValidY] = useState<boolean>(true);

  const dispatch = useDispatch();

  const handleChangeX = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setPointX(value);
      setIsValidX(!isNaN(parseFloat(value)));
    },
    []
  );

  const handleChangeY = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setPointY(value);
      setIsValidY(!isNaN(parseFloat(value)));
    },
    []
  );

  useEffect(() => {
    if (isValidX && isValidY) {
      dispatch(
        setDecodeGrid({
          coordX: parseFloat(pointX),
          coordY: parseFloat(pointY),
        })
      );
    }
  }, [isValidX, isValidY, pointX, pointY, dispatch]);

  return {
    pointX,
    pointY,
    isValidX,
    isValidY,
    handleChangeX,
    handleChangeY,
  };
};

export const useGridConfig = () => {
  const dispatch = useDispatch();
  const graphConfig = useSelector((state: RootState) => state.graphConfig);

  const handleChangeShowGrid = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(
      setGraphConfig({
        ...graphConfig,
        showDecodeGrid: e.target.checked,
      })
    );
  };

  return {
    showGrid: graphConfig.showDecodeGrid,
    handleChangeShowGrid,
  };
};
