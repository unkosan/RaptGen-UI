import { EyeSlash, Eye, Check2, X, Trash } from "react-bootstrap-icons";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { RootState } from "./redux/store";
import { apiClient } from "~/services/api-client";
import CustomDataGrid, {
  EditorProps,
} from "~/components/common/custom-datagrid";
import { setDecoded } from "./redux/interaction-data";

const validStyle = (isValid: boolean) => {
  return Object.assign(
    {
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
    isValid
      ? {}
      : {
          borderColor: "rgba(255, 0, 0, 0.5)",
          boxShadow: "0 0 0 2px rgba(255, 0, 0, 0.2)",
        }
  ) as React.CSSProperties;
};

const CoordXEditor: React.FC<EditorProps> = (props) => {
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
    <div
      style={validStyle(valid)}
      className="inovua-react-toolkit-text-input InovuaReactDataGrid__cell__editor InovuaReactDataGrid__cell__editor--text  inovua-react-toolkit-text-input--ltr inovua-react-toolkit-text-input--theme-default-light inovua-react-toolkit-text-input--enable-clear-button inovua-react-toolkit-text-input--focused"
    >
      <input
        value={valueX}
        onChange={(e) => {
          setValueX(e.target.value);
          setValid(!isNaN(parseFloat(e.target.value)));
        }}
        style={{
          width: 0,
          flexShrink: 1,
          flexGrow: 1,
          border: "none",
          background: "transparent",
          color: "inherit",
          outline: "none",
          padding: "0 0.5rem",
        }}
      />
      <Check2
        size={18}
        style={{
          cursor: valid ? "pointer" : "not-allowed",
          marginInline: "0.2rem",
          color: valid ? "grey" : "lightgrey",
        }}
        onClick={valid ? onConfirmClick : undefined}
      />
      <X
        size={20}
        style={{ cursor: "pointer", marginInline: "0.2rem", color: "grey" }}
        onClick={() => {
          props.onCancel();
        }}
      />
    </div>
  );
};

const CoordYEditor: React.FC<EditorProps> = (props) => {
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
    <div
      style={validStyle(valid)}
      className="inovua-react-toolkit-text-input InovuaReactDataGrid__cell__editor InovuaReactDataGrid__cell__editor--text  inovua-react-toolkit-text-input--ltr inovua-react-toolkit-text-input--theme-default-light inovua-react-toolkit-text-input--enable-clear-button inovua-react-toolkit-text-input--focused"
    >
      <input
        value={valueY}
        onChange={(e) => {
          setValueY(e.target.value);
          setValid(!isNaN(parseFloat(e.target.value)));
        }}
        style={{
          width: 0,
          flexShrink: 1,
          flexGrow: 1,
          border: "none",
          background: "transparent",
          color: "inherit",
          outline: "none",
          padding: "0 0.5rem",
        }}
      />
      <Check2
        size={18}
        style={{
          cursor: valid ? "pointer" : "not-allowed",
          marginInline: "0.2rem",
          color: valid ? "grey" : "lightgrey",
        }}
        onClick={valid ? onConfirmClick : undefined}
      />
      <X
        size={20}
        style={{ cursor: "pointer", marginInline: "0.2rem", color: "grey" }}
        onClick={() => {
          props.onCancel();
        }}
      />
    </div>
  );
};

type ActionProps = {
  data: {
    key: number;
    id: string;
    coordX: number;
    coordY: number;
    randomRegion: string;
    isShown: boolean;
  };
};

const Actions: React.FC<ActionProps> = (props) => {
  const { data } = props;
  const index = data.key; // key is index
  const dispatch = useDispatch();
  const decodeData = useSelector(
    (state: RootState) => state.interactionData.decoded
  );

  const onClickShow = async () => {
    const newShown = decodeData.shown.map((e, i) => (i === index ? !e : e));
    dispatch(
      setDecoded({
        ...decodeData,
        shown: newShown,
      })
    );
  };

  const onClickDelete = async () => {
    dispatch(
      setDecoded({
        ids: decodeData.ids.filter((_, i) => i !== index),
        coordsX: decodeData.coordsX.filter((_, i) => i !== index),
        coordsY: decodeData.coordsY.filter((_, i) => i !== index),
        randomRegions: decodeData.randomRegions.filter((_, i) => i !== index),
        shown: decodeData.shown.filter((_, i) => i !== index),
      })
    );
  };

  const showStyle = {
    cursor: "pointer",
    borderRadius: 4,
    height: "24px",
    width: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: data.isShown ? "#e8e8e8" : "inherit",
    background: data.isShown ? "#7986cb" : "#ffffff",
    border: "2px solid #7986cb",
    marginInline: "0.2rem",
  } as React.CSSProperties;

  const deleteStyle = {
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
  } as React.CSSProperties;

  return (
    <div className="d-flex">
      <span style={showStyle} onClick={onClickShow}>
        {data.isShown ? <Eye size={16} /> : <EyeSlash size={16} />}
      </span>
      <span style={deleteStyle} onClick={onClickDelete}>
        <Trash size={16} />
      </span>
    </div>
  );
};

const columns = [
  { name: "key", header: "Key", defaultVisible: false, editable: false },
  { name: "id", header: "ID", editable: false },
  {
    name: "randomRegion",
    header: "Random Region",
    defaultFlex: 1,
    editable: false,
  },
  {
    name: "coordX",
    header: "Coord X",
    editable: true,
    renderEditor: (props: EditorProps) => <CoordXEditor {...props} />,
  },
  {
    name: "coordY",
    header: "Coord Y",
    editable: true,
    renderEditor: (props: EditorProps) => <CoordYEditor {...props} />,
  },
  {
    name: "actions",
    header: "Actions",
    width: 100,
    editable: false,
    render: (props: ActionProps) => <Actions {...props} />,
  },
];

const gridStyle = { minHeight: 500, width: "100%", zIndex: 1000 };

const DecodeTable: React.FC = () => {
  const decodeData = useSelector(
    (state: RootState) => state.interactionData.decoded
  );
  const data = decodeData.ids.map((id, index) => {
    const coordX = decodeData.coordsX[index];
    const coordY = decodeData.coordsY[index];
    return {
      key: index, // key is index
      id: id,
      coordX: coordX,
      coordY: coordY,
      randomRegion: decodeData.randomRegions[index],
      isShown: decodeData.shown[index],
    };
  });

  return (
    <CustomDataGrid
      idProperty="key"
      className="mb-3"
      columns={columns}
      dataSource={data}
      editable={true}
      rowStyle={{ fontFamily: "monospace" }}
      pagination
      defaultLimit={20}
      rowHeight={35}
      style={gridStyle}
      copiable
      downloadable
    />
  );
};

export default DecodeTable;
