import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { uniq } from "lodash";

/**
 * This hook converts the decoded data into a table data format.
 * @returns {
 *  data: {
 *    key: number;
 *    id: string;
 *    coordX: string;
 *    coordY: string;
 *    randomRegion: string;
 *    isShown: boolean;
 *  }[]
 * }
 */
export const useDecodeTableData = () => {
  const decodeData = useSelector(
    (state: RootState) => state.interactionData.decoded
  );
  const data = decodeData.ids.map((id, index) => {
    return {
      key: index, // key is index
      id: id,
      coordX: decodeData.coordsX[index],
      coordY: decodeData.coordsY[index],
      randomRegion: decodeData.randomRegions[index],
      isShown: decodeData.shown[index],
    };
  });
  return {
    data,
  };
};

/**
 * This hook converts the encoded data into a table data format.
 * @returns {
 *  data: {
 *    key: number;
 *    id: string;
 *    randomRegion: string;
 *    coordX: string;
 *    coordY: string;
 *    isShown: boolean;
 *  }[]
 * }
 */
export const useEncodeTableData = () => {
  const encodeData = useSelector(
    (state: RootState) => state.interactionData.encoded
  );
  const data = encodeData.ids.map((id, index) => {
    return {
      key: index, // key is index
      id: id,
      randomRegion: encodeData.randomRegions[index],
      coordX: encodeData.coordsX[index],
      coordY: encodeData.coordsY[index],
      isShown: encodeData.shown[index],
    };
  });
  return {
    data,
  };
};

/**
 * This hook converts the selected points into a table data format.
 * @returns {
 *  data: {
 *    index: number;
 *    id: string;
 *    hue: number;
 *    coordX: string;
 *    coordY: string;
 *    randomRegion: string;
 *    duplicates: boolean;
 *  }[]
 *  hues: number[]
 * }
 */
export const useSelectedTableData = () => {
  const selectedPoints = useSelector(
    (state: RootState) => state.selectedPoints
  );

  const ids = selectedPoints.ids as string[];
  const data = ids.map((id, index) => {
    return {
      index: index,
      id: id,
      hue: selectedPoints.series[index],
      coordX: selectedPoints.coordsX[index],
      coordY: selectedPoints.coordsY[index],
      randomRegion: selectedPoints.randomRegions[index],
      duplicates: selectedPoints.duplicates[index],
    };
  });
  const hues = uniq(data.map((value) => value.hue));

  return {
    data,
    hues,
  };
};
