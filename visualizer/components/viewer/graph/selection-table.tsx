import "@inovua/reactdatagrid-community/index.css";
import ReactDataGrid from "@inovua/reactdatagrid-community";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

const columns = [
  { name: "key", header: "Key", defaultFlex: 1 },
  { name: "hue", header: "Hue", defaultFlex: 1 },
  { name: "index", header: "Index", defaultFlex: 1 },
  { name: "coordX", header: "Coord X", defaultFlex: 1 },
  { name: "coordY", header: "Coord Y", defaultFlex: 1 },
];

const gridStyle = { minHeight: 550, width: "100%" };

const SelectionTable: React.FC = () => {
  const vaeData = useSelector((state: RootState) => state.vaeData);
  const measuredData = useSelector((state: RootState) => state.measuredData);
  const decodeData = useSelector((state: RootState) => state.decodeData);
  const encodeData = useSelector((state: RootState) => state.encodeData);

  const graphData = useSelector((state: RootState) => state.graphData);

  const data = graphData.map((value, index) => {
    return {
      key: value.key,
      hue: value.hue,
      index: index,
      coordX: value.x,
      coordY: value.y,
    };
  });

  return (
    <div style={{ zIndex: 1000 }}>
      <ReactDataGrid
        idProperty="index"
        columns={columns}
        dataSource={data}
        style={gridStyle}
        pagination
      />
    </div>
  );
};

export default SelectionTable;
