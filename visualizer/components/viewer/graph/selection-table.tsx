import ReactDataGrid from "@inovua/reactdatagrid-community";
import NumberFilter from "@inovua/reactdatagrid-community/NumberFilter";
import SelectFilter from "@inovua/reactdatagrid-community/SelectFilter";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { groupBy, uniq } from "lodash";
import ClientOnly from "../../common/client-only";

const filterValue = [
  { name: "hue", operator: "startsWith", type: "string", value: "" },
  { name: "id", operator: "startsWith", type: "string", value: "" },
  { name: "coordX", operator: "ne", type: "number", value: 0 },
  { name: "coordY", operator: "ne", type: "number", value: 0 },
  { name: "randomRegion", operator: "startsWith", type: "string", value: "" },
  { name: "duplicates", operator: "gte", type: "number", value: 0 },
];

const gridStyle = { minHeight: 550, width: "100%", zIndex: 950 };

const SelectionTable: React.FC = () => {
  const vaeData = useSelector((state: RootState) => state.vaeData);
  const gmmData = useSelector((state: RootState) => state.gmmData);
  const measuredData = useSelector((state: RootState) => state.measuredData);
  const pivotMeasured = groupBy(measuredData, (value) => value.seriesName);
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
    } else if (/^MoG No.\d+$/.test(value.hue)) {
      const res = /MoG No.(\d+)/.exec(value.hue);
      const num = parseInt(res![1]);
      return {
        index: index,
        hue: "MoG centers",
        id: num,
        coordX: value.x,
        coordY: value.y,
        randomRegion: gmmData.decodedSequences[num],
        duplicates: 1,
      };
    } else {
      const measuredEntry = pivotMeasured[value.hue][value.key];
      return {
        index: index,
        hue: value.hue,
        id: measuredEntry.id,
        coordX: value.x,
        coordY: value.y,
        randomRegion: measuredEntry.randomRegion,
        duplicates: 1,
      };
    }
  });

  const columns = [
    { name: "index", header: "Index", defaultVisible: false },
    {
      name: "hue",
      header: "Hue",
      filterEditor: SelectFilter,
      filterEditorProps: {
        placeholder: "All",
        dataSource: uniq(data.map((value) => value.hue)).map((value) => {
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

  return (
    <>
      <legend>Selected sequences</legend>
      <ClientOnly>
        <ReactDataGrid
          idProperty="index"
          columns={columns}
          dataSource={data}
          style={gridStyle}
          filterable
          defaultFilterValue={filterValue}
          pagination
          rowStyle={{ fontFamily: "monospace" }}
        />
      </ClientOnly>
    </>
  );
};

export default SelectionTable;
