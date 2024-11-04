import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import CustomDataGrid from "~/components/common/custom-datagrid";

const columnsCountTable = [
  { name: "id", type: "number", header: "ID", defaultVisible: false },
  { name: "item", header: "Item", defaultFlex: 1 },
  { name: "duplicate", header: "Duplicate", type: "number" },
];

const columnsSequenceTable = [
  { name: "id", type: "number", label: "ID", defaultVisible: false },
  { name: "sequence", header: "Random Regions", defaultFlex: 1 },
  { name: "duplicate", header: "Duplicates", type: "number" },
];

const gridStyleCountTable = {
  minHeight: 300,
  width: "100%",
  zIndex: 1000,
  marginBlock: "1rem",
};

const gridStyleSequenceTable = {
  minHeight: 500,
  width: "100%",
  zIndex: 1000,
  marginBlock: "1rem",
};

const Tables: React.FC = () => {
  const {
    randomRegions,
    duplicatesFiltered,
    totalCount,
    uniqueCount,
    sequenceFilterCount,
    duplicateFilterCount,
    uniqueRatio,
  } = useSelector((state: RootState) => state.selexData);

  const propertiesDataSource = [
    { id: 0, item: "Total Entry Count", duplicate: totalCount },
    { id: 1, item: "Uniquified Entry Count", duplicate: uniqueCount },
    { id: 2, item: "Adapters Matched Count", duplicate: sequenceFilterCount },
    { id: 3, item: "Min-count Filtered", duplicate: duplicateFilterCount },
    { id: 4, item: "Filtered", duplicate: randomRegions.length },
    { id: 5, item: "Unique Ratio", duplicate: uniqueRatio },
  ];
  const filteredDataSource = randomRegions.map((seq, i) => {
    return { id: i, sequence: seq, duplicate: duplicatesFiltered[i] };
  });
  console.log(filteredDataSource);

  return (
    <>
      <CustomDataGrid
        idProperty="id"
        columns={columnsCountTable}
        dataSource={propertiesDataSource}
        style={gridStyleCountTable}
        rowStyle={{
          fontFamily: "monospace",
        }}
      />
      <CustomDataGrid
        idProperty="id"
        columns={columnsSequenceTable}
        dataSource={filteredDataSource}
        style={gridStyleSequenceTable}
        rowStyle={{
          fontFamily: "monospace",
        }}
      />
    </>
  );
};

export default Tables;
