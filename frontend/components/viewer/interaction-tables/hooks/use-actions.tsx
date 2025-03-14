import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { setDecoded, setEncoded } from "../../redux/interaction-data";
import { useCallback } from "react";

/**
 * Action button styles used across action components
 */
export const actionButtonStyles = {
  shown: {
    cursor: "pointer",
    borderRadius: 4,
    height: "24px",
    width: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#e8e8e8",
    background: "#7986cb",
    border: "2px solid #7986cb",
    marginInline: "0.2rem",
  },
  notShown: {
    cursor: "pointer",
    borderRadius: 4,
    height: "24px",
    width: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid #7986cb",
    marginInline: "0.2rem",
  },
  delete: {
    cursor: "pointer",
    borderRadius: 4,
    height: "24px",
    width: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    background: "#ff6347",
    border: "2px solid #ff6347",
    marginInline: "0.2rem",
  },
};

/**
 * Hook for handling decoder actions (show/hide and delete)
 * @param index - The index of the item to act on
 * @returns Functions to handle show/hide and delete actions
 */
export const useDecoderActions = (index: number) => {
  const dispatch = useDispatch();
  const decodeData = useSelector(
    (state: RootState) => state.interactionData.decoded
  );

  const handleClickShow = useCallback(async () => {
    const newShown = decodeData.shown.map((e, i) => (i === index ? !e : e));
    dispatch(
      setDecoded({
        ...decodeData,
        shown: newShown,
      })
    );
  }, [decodeData, dispatch, index]);

  const handleClickDelete = useCallback(async () => {
    dispatch(
      setDecoded({
        ids: decodeData.ids.filter((_, i) => i !== index),
        coordsX: decodeData.coordsX.filter((_, i) => i !== index),
        coordsY: decodeData.coordsY.filter((_, i) => i !== index),
        randomRegions: decodeData.randomRegions.filter((_, i) => i !== index),
        shown: decodeData.shown.filter((_, i) => i !== index),
      })
    );
  }, [decodeData, dispatch, index]);

  return {
    handleClickShow,
    handleClickDelete,
  };
};

/**
 * Hook for handling encoder actions (show/hide and delete)
 * @param index - The index of the item to act on
 * @returns Functions to handle show/hide and delete actions
 */
export const useEncoderActions = (index: number) => {
  const dispatch = useDispatch();
  const encodeData = useSelector(
    (state: RootState) => state.interactionData.encoded
  );

  const handleClickShow = useCallback(async () => {
    const newShown = encodeData.shown.map((e, i) => (i === index ? !e : e));
    dispatch(
      setEncoded({
        ...encodeData,
        shown: newShown,
      })
    );
  }, [encodeData, dispatch, index]);

  const handleClickDelete = useCallback(async () => {
    dispatch(
      setEncoded({
        ids: encodeData.ids.filter((_, i) => i !== index),
        coordsX: encodeData.coordsX.filter((_, i) => i !== index),
        coordsY: encodeData.coordsY.filter((_, i) => i !== index),
        randomRegions: encodeData.randomRegions.filter((_, i) => i !== index),
        shown: encodeData.shown.filter((_, i) => i !== index),
      })
    );
  }, [encodeData, dispatch, index]);

  return {
    handleClickShow,
    handleClickDelete,
  };
};
