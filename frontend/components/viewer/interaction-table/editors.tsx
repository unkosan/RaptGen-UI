import { useState } from "react";
import { Check2, X } from "react-bootstrap-icons";
import { useSelector } from "react-redux";
import { EditorProps } from "~/components/common/custom-datagrid";
import { RootState } from "../redux/store";
import { useDispatch } from "react-redux";
import { apiClient } from "~/services/api-client";
import { setDecoded, setEncoded } from "../redux/interaction-data";

const editorStyles = {
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
const EDITOR_CLASS_NAME =
  "inovua-react-toolkit-text-input InovuaReactDataGrid__cell__editor InovuaReactDataGrid__cell__editor--text  inovua-react-toolkit-text-input--ltr inovua-react-toolkit-text-input--theme-default-light inovua-react-toolkit-text-input--enable-clear-button inovua-react-toolkit-text-input--focused";

const Editor: React.FC<{
  value: string;
  isInvalid: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onConfirmClick: () => Promise<void>;
  onCancel: () => void;
}> = (props) => {
  return (
    <div
      style={
        {
          ...editorStyles.base,
          ...(props.isInvalid ? editorStyles.invalid : {}),
        } as React.CSSProperties
      }
      className={EDITOR_CLASS_NAME}
    >
      <input
        value={props.value}
        onChange={props.onChange}
        style={editorStyles.input}
      />
      <Check2
        size={18}
        style={{
          cursor: !props.isInvalid ? "pointer" : "not-allowed",
          marginInline: "0.2rem",
          color: !props.isInvalid ? "grey" : "lightgrey",
        }}
        onClick={!props.isInvalid ? props.onConfirmClick : undefined}
      />
      <X
        size={20}
        style={{ cursor: "pointer", marginInline: "0.2rem", color: "grey" }}
        onClick={props.onCancel}
      />
    </div>
  );
};

export const CoordXEditor: React.FC<EditorProps> = (props) => {
  const valueY = props.cellProps.data.coordY;
  const [valueX, setValueX] = useState<string>(props.cellProps.data.coordX);
  const [valid, setValid] = useState<boolean>(true);

  const decodeData = useSelector(
    (state: RootState) => state.interactionData.decoded
  );
  const sessionId = useSelector(
    (state: RootState) => state.sessionConfig.sessionId
  );
  const dispatch = useDispatch();

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValueX(value);
    setValid(!isNaN(parseFloat(value)));
  };

  const onConfirmClick = async () => {
    const res = await apiClient.decode({
      session_uuid: sessionId,
      coords_x: [parseFloat(valueX)],
      coords_y: [parseFloat(valueY)],
    });

    const index: number = props.cellProps.data.key;
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

    props.onComplete();
  };

  return (
    <Editor
      value={valueX}
      isInvalid={!valid}
      onChange={onChange}
      onConfirmClick={onConfirmClick}
      onCancel={props.onCancel}
    />
  );
};

export const CoordYEditor: React.FC<EditorProps> = (props) => {
  const valueX = props.cellProps.data.coordX;
  const [valueY, setValueY] = useState<string>(props.cellProps.data.coordY);
  const [valid, setValid] = useState<boolean>(true);

  const dispatch = useDispatch();
  const decodeData = useSelector(
    (state: RootState) => state.interactionData.decoded
  );
  const sessionId = useSelector(
    (state: RootState) => state.sessionConfig.sessionId
  );

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValueY(value);
    setValid(!isNaN(parseFloat(value)));
  };

  const onConfirmClick = async () => {
    const res = await apiClient.decode({
      session_uuid: sessionId,
      coords_x: [parseFloat(valueX)],
      coords_y: [parseFloat(valueY)],
    });

    const index: number = props.cellProps.data.key;
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

    props.onComplete();
  };

  return (
    <Editor
      value={valueY}
      isInvalid={!valid}
      onChange={onChange}
      onConfirmClick={onConfirmClick}
      onCancel={props.onCancel}
    />
  );
};

export const IdEditor: React.FC<EditorProps> = (props) => {
  const [value, setValue] = useState(props.value);
  const [valid, setValid] = useState(true);

  const encodeData = useSelector(
    (state: RootState) => state.interactionData.encoded
  );
  const dispatch = useDispatch();

  const onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = e.target.value;
    setValue(value);
    setValid(value.length > 0);
  };

  const onConfirmClick = async () => {
    const index: number = props.cellProps.data.key;
    dispatch(
      setEncoded({
        ids: encodeData.ids.map((e, i) => (i === index ? value : e)),
        coordsX: encodeData.coordsX,
        coordsY: encodeData.coordsY,
        randomRegions: encodeData.randomRegions,
        shown: encodeData.shown,
      })
    );

    props.onComplete();
  };

  return (
    <Editor
      value={value}
      isInvalid={!valid}
      onChange={onChange}
      onConfirmClick={onConfirmClick}
      onCancel={props.onCancel}
    />
  );
};

export const SequenceEditor: React.FC<EditorProps> = (props) => {
  const [value, setValue] = useState(props.value);
  const [valid, setValid] = useState(true);

  const encodeData = useSelector(
    (state: RootState) => state.interactionData.encoded
  );
  const sessionId = useSelector(
    (state: RootState) => state.sessionConfig.sessionId
  );
  const dispatch = useDispatch();

  const onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = e.target.value.toUpperCase().replaceAll("T", "U");
    setValue(value);
    setValid(/^[ATGCU]+$/.test(value));
  };

  const onConfirmClick = async () => {
    const res = await apiClient.encode({
      session_uuid: sessionId,
      sequences: [value],
    });

    const index: number = props.cellProps.data.key;
    const coordX = res.coords_x[0];
    const coordY = res.coords_y[0];
    dispatch(
      setEncoded({
        ...encodeData,
        coordsX: encodeData.coordsX.map((e, i) => (i === index ? coordX : e)),
        coordsY: encodeData.coordsY.map((e, i) => (i === index ? coordY : e)),
        randomRegions: encodeData.randomRegions.map((e, i) =>
          i === index ? value : e
        ),
      })
    );

    props.onComplete();
  };

  return (
    <Editor
      value={value}
      isInvalid={!valid}
      onChange={onChange}
      onConfirmClick={onConfirmClick}
      onCancel={props.onCancel}
    />
  );
};
