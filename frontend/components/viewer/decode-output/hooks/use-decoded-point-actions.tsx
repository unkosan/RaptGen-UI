import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { setDecoded } from "../../redux/interaction-data";

interface GridPoint {
  coordX: number;
  coordY: number;
}

interface DecodedData {
  ids: string[];
  coordsX: number[];
  coordsY: number[];
  randomRegions: string[];
  shown: boolean[];
}

/**
 * Hook to handle decoded point actions
 * @param gridPoint - The grid point data
 * @param decodeData - The current decoded data
 * @returns isLoading state and onAdd function
 */
export const useDecodedPointActions = (
  gridPoint: GridPoint,
  sequence: string,
  decodeData: DecodedData
) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Add the current grid point to the decoded data
   */
  const handleAdd = useCallback(async () => {
    setIsLoading(true);
    try {
      await dispatch(
        setDecoded({
          ids: decodeData.ids.concat(`manual-${decodeData.ids.length}`),
          coordsX: decodeData.coordsX.concat(gridPoint.coordX),
          coordsY: decodeData.coordsY.concat(gridPoint.coordY),
          randomRegions: decodeData.randomRegions.concat(sequence),
          shown: decodeData.shown.concat(true),
        })
      );
    } catch (error) {
      console.error("Error adding decoded point:", error);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, decodeData, gridPoint, sequence]);

  return { isLoading, handleAdd };
};
