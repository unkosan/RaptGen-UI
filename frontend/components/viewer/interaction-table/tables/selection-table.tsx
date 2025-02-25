import SelectFilter from "@inovua/reactdatagrid-community/SelectFilter";
import NumberFilter from "@inovua/reactdatagrid-community/NumberFilter";
import CustomDataGrid from "~/components/common/custom-datagrid";
import { useSelectedTableData } from "../hooks/hooks";

const SelectionTable: React.FC = () => {
  const { data, hues } = useSelectedTableData();

  const gridStyle = { minHeight: 500, width: "100%", zIndex: 950 };

  const columns = [
    { name: "index", header: "Index", defaultVisible: false },
    {
      name: "hue",
      header: "Hue",
      filterEditor: SelectFilter,
      filterEditorProps: {
        placeholder: "All",
        dataSource: hues.map((value) => {
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
      dataSource={data}
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

export default SelectionTable;
