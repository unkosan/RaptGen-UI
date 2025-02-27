import { useEffect, useState } from "react";
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

  const onChangeX = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPointX(value);
    setIsValidX(!isNaN(parseFloat(value)));
  };

  const onChangeY = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPointY(value);
    setIsValidY(!isNaN(parseFloat(value)));
  };

  useEffect(() => {
    if (isValidX && isValidY) {
      dispatch(
        setDecodeGrid({
          coordX: parseFloat(pointX),
          coordY: parseFloat(pointY),
        })
      );
    }
  });

  return {
    pointX,
    pointY,
    isValidX,
    isValidY,
    onChangeX,
    onChangeY,
  };
};

export const useGridConfig = () => {
  const dispatch = useDispatch();
  const graphConfig2 = useSelector((state: RootState) => state.graphConfig);

  const onChangeShowGrid = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(
      setGraphConfig({
        ...graphConfig2,
        showDecodeGrid: e.target.checked,
      })
    );
  };

  return {
    showGrid: graphConfig2.showDecodeGrid,
    onChangeShowGrid,
  };
};
