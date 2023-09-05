import { EyeSlash, Eye, Check2, X, Trash } from "react-bootstrap-icons";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import axios from "axios";
import ReactDataGrid from "@inovua/reactdatagrid-community";
import ClientOnly from "../../../common/client-only";
import { apiClient } from "../../../../services/api-client";

type CoordEditorProps = {
  value: number;
  onComplete: () => void;
  onCancel: () => void;
  onChange: (value: number) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  cellProps: any;
};

const CoordEditor: React.FC<CoordEditorProps> = (props) => {
  const [valueX, setValueX] = useState<string>(props.cellProps.data.coordX);
  const [valueY, setValueY] = useState<string>(props.cellProps.data.coordY);
  const [valid, setValid] = useState<boolean>(true);

  const dispatch = useDispatch();
  const decodeData = useSelector((state: RootState) => state.decodeData);

  const sessionId = useSelector(
    (state: RootState) => state.sessionConfig.sessionId
  );

  const onChangeX: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setValueX(e.target.value);
  };

  const onChangeY: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setValueY(e.target.value);
  };

  useEffect(() => {
    const xValid = !isNaN(parseFloat(valueX));
    const yValid = !isNaN(parseFloat(valueY));
    setValid(xValid && yValid);
  }, [valueX, valueY]);

  const onConfirmClick = async () => {
    const key: number = props.cellProps.data.key;
    const idx = decodeData.findIndex((e) => e.key === key);
    const newDecodeData = [...decodeData];

    const res = await apiClient.decode({
      session_id: sessionId,
      coords: [
        {
          coord_x: parseFloat(valueX),
          coord_y: parseFloat(valueY),
        },
      ],
    });

    if (res.status === "error") {
      return;
    }

    console.log("res", res);
    newDecodeData[idx] = {
      ...newDecodeData[idx],
      coordX: parseFloat(valueX),
      coordY: parseFloat(valueY),
      randomRegion: res.data[0],
      sequence: "",
    };

    dispatch({
      type: "decodeData/set",
      payload: newDecodeData,
    });

    props.onComplete();
  };

  const style = Object.assign(
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
    valid
      ? {}
      : {
          borderColor: "rgba(255, 0, 0, 0.5)",
          boxShadow: "0 0 0 2px rgba(255, 0, 0, 0.2)",
        }
  ) as React.CSSProperties;

  return (
    <div
      style={style}
      className="inovua-react-toolkit-text-input InovuaReactDataGrid__cell__editor InovuaReactDataGrid__cell__editor--text  inovua-react-toolkit-text-input--ltr inovua-react-toolkit-text-input--theme-default-light inovua-react-toolkit-text-input--enable-clear-button inovua-react-toolkit-text-input--focused"
    >
      <div style={{ flex: 1, display: "flex" }}>
        &#40;
        <input
          value={valueX}
          onChange={onChangeX}
          style={{
            width: 0,
            flexShrink: 1,
            flexGrow: 1,
            border: "none",
            background: "rgba(0, 0, 0, 0.1)",
            color: "inherit",
            outline: "none",
            padding: "0 0.5rem",
          }}
        />
        ,
        <input
          value={valueY}
          onChange={onChangeY}
          style={{
            width: 0,
            flexShrink: 1,
            flexGrow: 1,
            border: "none",
            background: "rgba(0, 0, 0, 0.1)",
            color: "inherit",
            outline: "none",
            padding: "0 0.5rem",
          }}
        />
        &#41;
      </div>

      <Check2
        size={18}
        style={{
          cursor: "pointer",
          marginInline: "0.2rem",
          color: valid ? "grey" : "lightgrey",
        }}
        onClick={valid ? onConfirmClick : () => {}}
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
  const key = data.key;
  const dispatch = useDispatch();
  const decodeData = useSelector((state: RootState) => state.decodeData);

  const onClickShow = async () => {
    const idx = decodeData.findIndex((e) => e.key === key);
    const newDecodeData = [...decodeData];
    newDecodeData[idx] = {
      ...newDecodeData[idx],
      isShown: !data.isShown,
    };

    dispatch({
      type: "decodeData/set",
      payload: newDecodeData,
    });
  };

  const onClickDelete = async () => {
    const idx = decodeData.findIndex((e) => e.key === key);
    const newDecodeData = [...decodeData];
    newDecodeData.splice(idx, 1);

    dispatch({
      type: "decodeData/set",
      payload: newDecodeData,
    });
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
  { name: "id", header: "ID", defaultVisible: false, editable: false },
  {
    name: "coord",
    header: "Coord",
    width: 160,
    editable: true,
    renderEditor: (props: CoordEditorProps) => <CoordEditor {...props} />,
  },
  {
    name: "randomRegion",
    header: "Random Region",
    defaultFlex: 1,
    editable: false,
  },
  {
    name: "actions",
    header: "Actions",
    width: 100,
    defaultVisible: false,
    editable: false,
    render: (props: ActionProps) => <Actions {...props} />,
  },
];

const gridStyle = { minHeight: 400, width: "100%", zIndex: 1000 };

const DecodeTable: React.FC = () => {
  const decodeData = useSelector((state: RootState) => state.decodeData);
  const data = decodeData.slice(1).map((e) => ({
    key: e.key,
    id: e.id,
    coordX: e.coordX,
    coordY: e.coordY,
    randomRegion: e.randomRegion,
    isShown: e.isShown,
    coord: "(" + e.coordX.toFixed(3) + ", " + e.coordY.toFixed(3) + ")",
  }));

  return (
    <ClientOnly>
      <ReactDataGrid
        idProperty="key"
        columns={columns}
        dataSource={data}
        editable={true}
        rowStyle={{ fontFamily: "monospace" }}
        pagination
        defaultLimit={20}
        rowHeight={35}
        style={gridStyle}
      />
    </ClientOnly>
  );
};

export default DecodeTable;
