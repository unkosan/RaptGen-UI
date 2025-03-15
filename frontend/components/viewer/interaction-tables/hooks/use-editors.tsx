import { useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { setDecoded, setEncoded } from "../../redux/interaction-data";
import { apiClient } from "~/services/api-client";

/**
 * Common editor styles used across editor components
 */
export const editorStyles = {
  base: {
    width: "100%",
    height: "100%",
    display: "flex",
    background: "white",
    color: "inherit",
    alignItems: "center",
    position: "absolute",
    justifyContent: "space-between",
    left: 0,
    top: 0,
  },
  invalid: {
    borderColor: "rgba(255, 0, 0, 0.5)",
    boxShadow: "0 0 0 2px rgba(255, 0, 0, 0.2)",
  },
  input: {
    width: 0,
    flexShrink: 1,
    flexGrow: 1,
    border: "none",
    background: "transparent",
    color: "inherit",
    outline: "none",
    padding: "0 0.5rem",
  },
};

export const EDITOR_CLASS_NAME =
  "inovua-react-toolkit-text-input InovuaReactDataGrid__cell__editor InovuaReactDataGrid__cell__editor--text  inovua-react-toolkit-text-input--ltr inovua-react-toolkit-text-input--theme-default-light inovua-react-toolkit-text-input--enable-clear-button inovua-react-toolkit-text-input--focused";

/**
 * Hook for managing text input with validation
 * @param initialValue - Initial value of the input
 * @param validator - Optional validation function
 * @returns State and handlers for text input with validation
 */
export const useTextInputWithValidation = (
  initialValue: string,
  validator?: (value: string) => boolean
) => {
  const [value, setValue] = useState<string>(initialValue);
  const [valid, setValid] = useState<boolean>(
    validator ? validator(initialValue) : true
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    setValid(validator ? validator(newValue) : true);
  };

  return {
    value,
    valid,
    handleChange,
    setValue,
    setValid,
  };
};

/**
 * Hook for CoordX editor functionality
 * @param cellProps - Props from the cell being edited
 * @param onComplete - Callback when editing is complete
 * @param onCancel - Callback when editing is canceled
 * @returns State and handlers for the CoordX editor
 */
export const useCoordXEditor = (
  cellProps: any,
  onComplete: () => void,
  onCancel: () => void
) => {
  const valueY = cellProps.data.coordY;
  const initialValueX = cellProps.data.coordX;

  const {
    value: valueX,
    valid,
    handleChange,
  } = useTextInputWithValidation(
    initialValueX,
    (value) => !isNaN(parseFloat(value))
  );

  const decodeData = useSelector(
    (state: RootState) => state.interactionData.decoded
  );
  const sessionId = useSelector(
    (state: RootState) => state.sessionConfig.sessionId
  );
  const dispatch = useDispatch();

  const handleConfirmClick = useCallback(async () => {
    const res = await apiClient.decode({
      session_uuid: sessionId,
      coords_x: [parseFloat(valueX)],
      coords_y: [parseFloat(valueY)],
    });

    const index: number = cellProps.data.key;
    const sequence = res.sequences[0];
    dispatch(
      setDecoded({
        ...decodeData,
        coordsX: decodeData.coordsX.map((e, i) =>
          i === index ? parseFloat(valueX) : e
        ),
        coordsY: decodeData.coordsY.map((e, i) =>
          i === index ? parseFloat(valueY) : e
        ),
        randomRegions: decodeData.randomRegions.map((region, i) =>
          i === index ? sequence : region
        ),
      })
    );

    onComplete();
  }, [valueX, valueY, dispatch, decodeData, onComplete, sessionId]);

  return {
    valueX,
    valid,
    handleChange,
    handleConfirmClick,
    handleCancel: onCancel,
  };
};

/**
 * Hook for CoordY editor functionality
 * @param cellProps - Props from the cell being edited
 * @param onComplete - Callback when editing is complete
 * @param onCancel - Callback when editing is canceled
 * @returns State and handlers for the CoordY editor
 */
export const useCoordYEditor = (
  cellProps: any,
  onComplete: () => void,
  onCancel: () => void
) => {
  const valueX = cellProps.data.coordX;
  const initialValueY = cellProps.data.coordY;

  const {
    value: valueY,
    valid,
    handleChange,
  } = useTextInputWithValidation(
    initialValueY,
    (value) => !isNaN(parseFloat(value))
  );

  const dispatch = useDispatch();
  const decodeData = useSelector(
    (state: RootState) => state.interactionData.decoded
  );
  const sessionId = useSelector(
    (state: RootState) => state.sessionConfig.sessionId
  );

  const handleConfirmClick = useCallback(async () => {
    const res = await apiClient.decode({
      session_uuid: sessionId,
      coords_x: [parseFloat(valueX)],
      coords_y: [parseFloat(valueY)],
    });

    const index: number = cellProps.data.key;
    const sequence = res.sequences[0];
    dispatch(
      setDecoded({
        ...decodeData,
        coordsX: decodeData.coordsX.map((e, i) =>
          i === index ? parseFloat(valueX) : e
        ),
        coordsY: decodeData.coordsY.map((e, i) =>
          i === index ? parseFloat(valueY) : e
        ),
        randomRegions: decodeData.randomRegions.map((region, i) =>
          i === index ? sequence : region
        ),
      })
    );

    onComplete();
  }, [valueX, valueY, dispatch, decodeData, onComplete, sessionId]);

  return {
    valueY,
    valid,
    handleChange,
    handleConfirmClick,
    handleCancel: onCancel,
  };
};

/**
 * Hook for ID editor functionality
 * @param cellProps - Props from the cell being edited
 * @param value - Initial value
 * @param onComplete - Callback when editing is complete
 * @param onCancel - Callback when editing is canceled
 * @returns State and handlers for the ID editor
 */
export const useIdEditor = (
  cellProps: any,
  value: string,
  onComplete: () => void,
  onCancel: () => void
) => {
  const {
    value: currentValue,
    valid,
    handleChange,
  } = useTextInputWithValidation(value, (value) => value.length > 0);

  const encodeData = useSelector(
    (state: RootState) => state.interactionData.encoded
  );
  const dispatch = useDispatch();

  const handleConfirmClick = useCallback(async () => {
    const index: number = cellProps.data.key;
    dispatch(
      setEncoded({
        ids: encodeData.ids.map((e, i) => (i === index ? currentValue : e)),
        coordsX: encodeData.coordsX,
        coordsY: encodeData.coordsY,
        randomRegions: encodeData.randomRegions,
        shown: encodeData.shown,
      })
    );

    onComplete();
  }, [currentValue, dispatch, encodeData, onComplete]);

  return {
    value: currentValue,
    valid,
    handleChange,
    handleConfirmClick,
    handleCancel: onCancel,
  };
};

/**
 * Hook for Sequence editor functionality
 * @param cellProps - Props from the cell being edited
 * @param value - Initial value
 * @param onComplete - Callback when editing is complete
 * @param onCancel - Callback when editing is canceled
 * @returns State and handlers for the Sequence editor
 */
export const useSequenceEditor = (
  cellProps: any,
  value: string,
  onComplete: () => void,
  onCancel: () => void
) => {
  const {
    value: currentValue,
    valid,
    handleChange: baseHandleChange,
    setValue,
  } = useTextInputWithValidation(value, (value) => /^[ATGCU]+$/.test(value));

  const encodeData = useSelector(
    (state: RootState) => state.interactionData.encoded
  );
  const sessionId = useSelector(
    (state: RootState) => state.sessionConfig.sessionId
  );
  const dispatch = useDispatch();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.toUpperCase().replaceAll("T", "U");
      setValue(value);
      baseHandleChange({
        ...e,
        target: { ...e.target, value },
      } as React.ChangeEvent<HTMLInputElement>);
    },
    [setValue, baseHandleChange]
  );

  const handleConfirmClick = useCallback(async () => {
    const res = await apiClient.encode({
      session_uuid: sessionId,
      sequences: [currentValue],
    });

    const index: number = cellProps.data.key;
    const coordX = res.coords_x[0];
    const coordY = res.coords_y[0];
    dispatch(
      setEncoded({
        ...encodeData,
        coordsX: encodeData.coordsX.map((e, i) => (i === index ? coordX : e)),
        coordsY: encodeData.coordsY.map((e, i) => (i === index ? coordY : e)),
        randomRegions: encodeData.randomRegions.map((e, i) =>
          i === index ? currentValue : e
        ),
      })
    );

    onComplete();
  }, [currentValue, dispatch, encodeData, onComplete, sessionId]);

  return {
    value: currentValue,
    valid,
    handleChange,
    handleConfirmClick,
    handleCancel: onCancel,
  };
};
