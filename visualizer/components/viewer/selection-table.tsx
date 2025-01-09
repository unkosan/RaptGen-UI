import NumberFilter from "@inovua/reactdatagrid-community/NumberFilter";
import SelectFilter from "@inovua/reactdatagrid-community/SelectFilter";
import { useSelector } from "react-redux";
import { RootState } from "./redux/store";
import { groupBy, uniq } from "lodash";
import CustomDataGrid from "~/components/common/custom-datagrid";

const filterValue = [
  { name: "hue", operator: "startsWith", type: "string", value: "" },
  { name: "id", operator: "startsWith", type: "string", value: "" },
  { name: "coordX", operator: "ne", type: "number", value: 0 },
  { name: "coordY", operator: "ne", type: "number", value: 0 },
  { name: "randomRegion", operator: "startsWith", type: "string", value: "" },
  { name: "duplicates", operator: "gte", type: "number", value: 0 },
];

const gridStyle = { minHeight: 650, width: "100%", zIndex: 950 };

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

  return (
    <>
      <legend>Selected sequences</legend>
      <CustomDataGrid
        idProperty="index"
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
    </>
  );
};

export default SelectionTable;
