import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import CustomDataGrid from "~/components/common/custom-datagrid";

const columnsSequenceTable = [
  { name: "id", type: "number", label: "ID", defaultVisible: false },
  { name: "sequence", header: "Random Regions", defaultFlex: 1 },
  { name: "duplicate", header: "Duplicates", type: "number" },
];

const gridStyleSequenceTable = {
  minHeight: 500,
  width: "100%",
  zIndex: 1000,
  marginBlock: "1rem",
};

const SequenceTable: React.FC = () => {
  const { filteredRandomRegions, filteredDuplicates } = useSelector(
    (state: RootState) => state.selexData
  );

  const filteredDataSource = filteredRandomRegions.map((seq, i) => {
    return { id: i, sequence: seq, duplicate: filteredDuplicates[i] };
  });

  return (
    <CustomDataGrid
      idProperty="id"
      columns={columnsSequenceTable}
      dataSource={filteredDataSource}
      style={gridStyleSequenceTable}
      rowStyle={{
        fontFamily: "monospace",
      }}
    />
  );
};

export default SequenceTable;
