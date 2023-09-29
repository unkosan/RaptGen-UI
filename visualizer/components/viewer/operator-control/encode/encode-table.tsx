import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { EyeSlash, Eye, Check2, X, Trash } from "react-bootstrap-icons";

import { apiClient } from "~/services/api-client";
import CustomDataGrid from "~/components/common/custom-datagrid";

type EditorProps = {
  value: string;
  onComplete: () => void;
  onCancel: () => void;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  cellProps: any;
};

const IdEditor: React.FC<EditorProps> = (props) => {
  const [value, setValue] = useState(props.value);
  const [valid, setValid] = useState(true);

  const encodeData = useSelector((state: RootState) => state.encodeData);
  const dispatch = useDispatch();

  const onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = e.target.value;
    setValue(value);
    setValid(value.length > 0);
  };

  const onConfirmClick = async () => {
    const key: number = props.cellProps.data.key;
    const idx = encodeData.findIndex((e) => e.key === key);
    const newEncodeData = [...encodeData];
    newEncodeData[idx] = {
      ...newEncodeData[idx],
      id: value,
    };

    dispatch({
      type: "encodeData/set",
      payload: newEncodeData,
    });

    console.log(props, props.onChange, value);
    // props.onChange(value); # onEditChangeValue does not work. fxxx
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
          borderColor: "rgba(255, 0, 0, 0.5)",
          boxShadow: "0 0 0 2px rgba(255, 0, 0, 0.2)",
        }
  ) as React.CSSProperties;

  return (
    <div
      style={style}
      className="inovua-react-toolkit-text-input InovuaReactDataGrid__cell__editor InovuaReactDataGrid__cell__editor--text  inovua-react-toolkit-text-input--ltr inovua-react-toolkit-text-input--theme-default-light inovua-react-toolkit-text-input--enable-clear-button inovua-react-toolkit-text-input--focused"
    >
      <input
        value={value}
        onChange={onChange}
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

const SequenceEditor: React.FC<EditorProps> = (props) => {
  const [value, setValue] = useState(props.value);
  const [valid, setValid] = useState(true);

  const encodeData = useSelector((state: RootState) => state.encodeData);
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
      session_id: sessionId,
      sequences: [value],
    });

    if (res.status === "error") {
      return;
    }

    const key: number = props.cellProps.data.key;
    const idx = encodeData.findIndex((e) => e.key === key);
    const newEncodeData = [...encodeData];
    newEncodeData[idx] = {
      ...newEncodeData[idx],
      randomRegion: value,
      sequence: "",
      coordX: res.data[0].coord_x,
      coordY: res.data[0].coord_y,
    };

    dispatch({
      type: "encodeData/set",
      payload: newEncodeData,
    });

    console.log(props, props.onChange, value);
    // props.onChange(value); # onEditChangeValue does not work. fxxx
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
      <input
        value={value}
        onChange={onChange}
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

type ActionsProps = {
  data: {
    key: number;
    id: string;
    randomRegion: string;
    isShown: boolean;
  };
};

const Actions: React.FC<ActionsProps> = (props) => {
  const { data } = props;
  const key = data.key;
  const dispatch = useDispatch();
  const encodeData = useSelector((state: RootState) => state.encodeData);

  console.log("Actions", props, data, encodeData);

  const onClickShow = async () => {
    const idx = encodeData.findIndex((e) => e.key === key);
    const newEncodeData = [...encodeData];
    newEncodeData[idx] = {
      ...newEncodeData[idx],
      isShown: !data.isShown,
    };

    dispatch({
      type: "encodeData/set",
      payload: newEncodeData,
    });
  };

  const onClickDelete = async () => {
    const idx = encodeData.findIndex((e) => e.key === key);
    const newEncodeData = [...encodeData];
    newEncodeData.splice(idx, 1);

    dispatch({
      type: "encodeData/set",
      payload: newEncodeData,
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
  {
    name: "id",
    header: "ID",
    renderEditor: (props: EditorProps) => {
      return <IdEditor {...props} />;
    },
  },
  {
    name: "randomRegion",
    header: "Random Region",
    defaultFlex: 1,
    renderEditor: (props: EditorProps) => {
      return <SequenceEditor {...props} />;
    },
  },
  {
    name: "action",
    header: "Action",
    width: 100,
    defaultVisible: false,
    editable: false,
    render: (props: ActionsProps) => {
      return <Actions {...props} />;
    },
  },
];

const gridStyle = { minHeight: 500, width: "100%", zIndex: 1000 };

const EncodeTable: React.FC = () => {
  const encodeData = useSelector((state: RootState) => state.encodeData);
  const data = encodeData.map((e) => {
    return {
      key: e.key,
      id: e.id,
      randomRegion: e.randomRegion,
      isShown: e.isShown,
    };
  });

  return (
    <CustomDataGrid
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
  );
};

export default EncodeTable;
