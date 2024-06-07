import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import "@inovua/reactdatagrid-community/index.css";
import CustomDataGrid from "~/components/common/custom-datagrid";

const columns = [
  { name: "id", type: "number", header: "ID", defaultVisible: false },
  { name: "trimmedSequences", header: "Trimmed Sequences", defaultFlex: 1 },
  { name: "duplicates", header: "Duplicates" },
];

const gridStyle = { minHeight: 450, width: "100%", zIndex: 1000 };

const DataTable: React.FC = () => {
  const sequenceData = useSelector(
    (state: RootState) => state.vaeConfig.sequenceData
  );
  const data = sequenceData.randomRegions
    .map((seq, i) => {
      return seq
        ? {
            id: i,
            trimmedSequences: seq,
            duplicates: sequenceData.duplicates[i],
          }
        : null;
    })
    .filter((obj) => obj !== null);
  return (
    <CustomDataGrid
      idProperty="id"
      style={gridStyle}
      columns={columns}
      dataSource={data}
      rowHeight={30}
      pagination
      defaultLimit={20}
      rowStyle={{
        fontFamily: "monospace",
      }}
      downloadable
      copiable
    />
  );
};

export default DataTable;
