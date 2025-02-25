import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { uniq } from "lodash";
import { useState } from "react";

// const actionButtonStyles = {
//   shown: {
//     cursor: "pointer",
//     borderRadius: 4,
//     height: "24px",
//     width: "24px",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     color: "#e8e8e8",
//     background: "#7986cb",
//     border: "2px solid #7986cb",
//     marginInline: "0.2rem",
//   },
//   notShown: {
//     cursor: "pointer",
//     borderRadius: 4,
//     height: "24px",
//     width: "24px",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     border: "2px solid #7986cb",
//     marginInline: "0.2rem",
//   },
//   delete: {
//     cursor: "pointer",
//     borderRadius: 4,
//     height: "24px",
//     width: "24px",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     color: "#ffffff",
//     background: "#ff6347",
//     border: "2px solid #ff6347",
//     marginInline: "0.2rem",
//   },
// };

// const useButtonVisible = (
//   entries: {
//     ids: string[];
//     coordsX: string[];
//     coordsY: string[];
//     randomRegions: string[];
//     shown: boolean[];
//   },
//   data: {
//     key: number;
//     id: string;
//     coordX: string;
//     coordY: string;
//     randomRegion: string;
//     isShown: boolean;
//   }
// ) => {
//     // return style here
//     return {
//         // buttonStyle
//     }
// }

const useNumericStateWithValidation = (
  initialValue: number,
  predicate?: (value: number) => boolean
) => {
  const [value, setValue] = useState<string>(initialValue.toString());
  const [valid, setValid] = useState<boolean>(true);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = parseInt(value);
    setValue(value);
    setValid(
      !isNaN(numericValue) && predicate ? predicate(numericValue) : true
    );
  };

  return {
    value,
    valid,
    onChange,
  };
};

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
