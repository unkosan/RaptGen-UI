import NumberFilter from "@inovua/reactdatagrid-community/NumberFilter";
import SelectFilter from "@inovua/reactdatagrid-community/SelectFilter";
import { useSelector } from "react-redux";
import { RootState } from "./redux/store";
import { uniq } from "lodash";
import { EyeSlash, Eye, Check2, X, Trash } from "react-bootstrap-icons";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { apiClient } from "~/services/api-client";
import CustomDataGrid, {
  EditorProps,
} from "~/components/common/custom-datagrid";
import { setDecoded } from "./redux/interaction-data";
import { setEncoded } from "./redux/interaction-data";
import { Tab, Tabs } from "react-bootstrap";

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

const IdEditor: React.FC<EditorProps> = (props) => {
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

const SequenceEditor: React.FC<EditorProps> = (props) => {
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

type ActionProps = {
  data: {
    key: number;
    id: string;
    coordX: string;
    coordY: string;
    randomRegion: string;
    isShown: boolean;
  };
};

const actionButtonStyles = {
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

const DecoderActions: React.FC<ActionProps> = (props) => {
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

  return (
    <div className="d-flex">
      <span
        style={
          data.isShown ? actionButtonStyles.shown : actionButtonStyles.notShown
        }
        onClick={onClickShow}
      >
        {data.isShown ? <Eye size={16} /> : <EyeSlash size={16} />}
      </span>
      <span style={actionButtonStyles.delete} onClick={onClickDelete}>
        <Trash size={16} />
      </span>
    </div>
  );
};

const EncoderActions: React.FC<ActionProps> = (props) => {
  const { data } = props;
  const index = data.key; // key is index
  const dispatch = useDispatch();
  const encodeData = useSelector(
    (state: RootState) => state.interactionData.encoded
  );

  const onClickShow = async () => {
    const newShown = encodeData.shown.map((e, i) => (i === index ? !e : e));
    dispatch(
      setEncoded({
        ...encodeData,
        shown: newShown,
      })
    );
  };

  const onClickDelete = async () => {
    dispatch(
      setEncoded({
        ids: encodeData.ids.filter((_, i) => i !== index),
        coordsX: encodeData.coordsX.filter((_, i) => i !== index),
        coordsY: encodeData.coordsY.filter((_, i) => i !== index),
        randomRegions: encodeData.randomRegions.filter((_, i) => i !== index),
        shown: encodeData.shown.filter((_, i) => i !== index),
      })
    );
  };

  return (
    <div className="d-flex">
      <span
        style={
          data.isShown ? actionButtonStyles.shown : actionButtonStyles.notShown
        }
        onClick={onClickShow}
      >
        {data.isShown ? <Eye size={16} /> : <EyeSlash size={16} />}
      </span>
      <span style={actionButtonStyles.delete} onClick={onClickDelete}>
        <Trash size={16} />
      </span>
    </div>
  );
};

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

  const gridStyle = { minHeight: 500, width: "100%", zIndex: 1000 };

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
      render: (props: ActionProps) => <DecoderActions {...props} />,
    },
  ];

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

const EncodeTable: React.FC = () => {
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

  const gridStyle = { minHeight: 500, width: "100%", zIndex: 1000 };

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
      name: "coordX",
      header: "Coord X",
      editable: false,
    },
    {
      name: "coordY",
      header: "Coord Y",
      editable: false,
    },
    {
      name: "actions",
      header: "Actions",
      width: 100,
      editable: false,
      render: (props: ActionProps) => {
        return <EncoderActions {...props} />;
      },
    },
  ];

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

const SelectionTable: React.FC = () => {
  const selectedPoints = useSelector(
    (state: RootState) => state.selectedPoints
  );

  const ids = selectedPoints.ids as string[];
  const plotData = ids.map((id, index) => {
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

  const gridStyle = { minHeight: 500, width: "100%", zIndex: 950 };

  const columns = [
    { name: "index", header: "Index", defaultVisible: false },
    {
      name: "hue",
      header: "Hue",
      filterEditor: SelectFilter,
      filterEditorProps: {
        placeholder: "All",
        dataSource: uniq(plotData.map((value) => value.hue)).map((value) => {
          return { id: value, label: value };
        }),
      },
    },
    { name: "id", header: "ID", defaultVisible: false },
    {
      name: "coordX",
      header: "Coord X",
      type: "number",
      filterEditor: NumberFilter,
    },
    {
      name: "coordY",
      header: "Coord Y",
      type: "number",
      filterEditor: NumberFilter,
    },
    { name: "randomRegion", header: "Random Region", defaultFlex: 1 },
    { name: "duplicates", header: "Duplicates" },
  ];

  const filterValue = [
    { name: "hue", operator: "startsWith", type: "string", value: "" },
    { name: "id", operator: "startsWith", type: "string", value: "" },
    { name: "coordX", operator: "ne", type: "number", value: 0 },
    { name: "coordY", operator: "ne", type: "number", value: 0 },
    { name: "randomRegion", operator: "startsWith", type: "string", value: "" },
    { name: "duplicates", operator: "gte", type: "number", value: 0 },
  ];

  return (
    <CustomDataGrid
      idProperty="index"
      className="mb-3"
      columns={columns}
      dataSource={plotData}
      style={gridStyle}
      filterable
      defaultFilterValue={filterValue}
      pagination
      rowStyle={{ fontFamily: "monospace" }}
      downloadable
      copiable
    />
  );
};

const DataTable: React.FC = () => {
  return (
    <Tabs defaultActiveKey="selected-points" id="interaction-table">
      <Tab eventKey="selected-points" title="Selected points">
        <SelectionTable />
      </Tab>
      <Tab eventKey="encoded-sequences" title="Encoded sequences">
        <EncodeTable />
      </Tab>
      <Tab eventKey="decoded-points" title="Decoded points">
        <DecodeTable />
      </Tab>
    </Tabs>
  );
};

export default DataTable;
