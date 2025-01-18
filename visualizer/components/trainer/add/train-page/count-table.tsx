import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import CustomDataGrid from "~/components/common/custom-datagrid";

const columnsCountTable = [
  { name: "id", type: "number", header: "ID", defaultVisible: false },
  { name: "item", header: "Item", defaultFlex: 1 },
  { name: "duplicate", header: "Duplicate", type: "number" },
];

const gridStyleCountTable = {
  minHeight: 243,
  width: "100%",
  zIndex: 1000,
};

const CountTable: React.FC = () => {
  const {
    totalCount,
    uniqueCount,
    validSequenceCount,
    duplicateFilteredCount,
    uniqueRatio,
  } = useSelector((state: RootState) => state.selexData);

  const propertiesDataSource = [
    { id: 0, item: "Total Entry Count", duplicate: totalCount },
    { id: 1, item: "Uniquified Entry Count", duplicate: uniqueCount },
    {
      id: 2,
      item: "Adapters Matched Count (uniquified)",
      duplicate: validSequenceCount,
    },
    {
      id: 3,
      item: "Min-count Filtered (uniquified)",
      duplicate: duplicateFilteredCount,
    },
    { id: 4, item: "Unique Ratio", duplicate: uniqueRatio },
  ];

  return (
    <CustomDataGrid
      idProperty="id"
      className="mb-3"
      columns={columnsCountTable}
      dataSource={propertiesDataSource}
      style={gridStyleCountTable}
      rowStyle={{
        fontFamily: "monospace",
      }}
    />
  );
};

export default CountTable;
