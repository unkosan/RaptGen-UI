import "@inovua/reactdatagrid-community/index.css";
import ReactDataGrid from "@inovua/reactdatagrid-community";
import NumberFilter from "@inovua/reactdatagrid-community/NumberFilter";
import SelectFilter from "@inovua/reactdatagrid-community/SelectFilter";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

const columns = [
  { name: "index", header: "Index", defaultVisible: false },
  {
    name: "hue",
    header: "Hue",
    filterEditor: SelectFilter,
    filterEditorProps: {
      placeholder: "All",
      dataSource: "SELEX,Encoded Data,Decoded Data,Measured Data".split(","),
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
  { name: "coordX", operator: "ne", type: "number", value: "" },
  { name: "coordY", operator: "ne", type: "number", value: "" },
  { name: "randomRegion", operator: "startsWith", type: "string", value: "" },
];

const gridStyle = { minHeight: 550, width: "100%" };

const SelectionTable: React.FC = () => {
  const vaeData = useSelector((state: RootState) => state.vaeData);
  const measuredData = useSelector((state: RootState) => state.measuredData);
  const decodeData = useSelector((state: RootState) => state.decodeData);
  const encodeData = useSelector((state: RootState) => state.encodeData);

  const graphData = useSelector((state: RootState) => state.graphData);

  const data = graphData.map((value, index) => {
    if (value.hue === "SELEX") {
      const vaeEntry = vaeData[value.key];
      return {
        index: index,
        hue: value.hue,
        id: value.key,
        coordX: value.x,
        coordY: value.y,
        randomRegion: vaeEntry.randomRegion,
        duplicates: vaeEntry.duplicates,
      };
    } else if (value.hue === "Encoded Data") {
      const encodeEntry = encodeData[value.key];
      return {
        index: index,
        hue: value.hue,
        id: encodeEntry.id,
        coordX: value.x,
        coordY: value.y,
        randomRegion: encodeEntry.randomRegion,
        duplicates: 1,
      };
    } else if (value.hue === "Decoded Data") {
      const decodeEntry = decodeData[value.key];
      return {
        index: index,
        hue: value.hue,
        id: decodeEntry.id,
        coordX: value.x,
        coordY: value.y,
        randomRegion: decodeEntry.randomRegion,
        duplicates: 1,
      };
    } else {
      return {
        index: index,
        hue: value.hue,
        id: "measuredData",
        coordX: value.x,
        coordY: value.y,
        randomRegion: "RANDOM",
        duplicates: 1,
      };
    }
  });

  return (
    <>
      <legend>Selected sequences</legend>
      <div style={{ zIndex: 1000 }}>
        <ReactDataGrid
          idProperty="index"
          columns={columns}
          dataSource={data}
          style={gridStyle}
          filterable
          filterValue={filterValue}
          pagination
        />
      </div>
    </>
  );
};

export default SelectionTable;
