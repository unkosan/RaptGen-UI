import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import ReactDataGrid from "@inovua/reactdatagrid-community";
import "@inovua/reactdatagrid-community/index.css";
import { useCallback } from "react";

const columns = [
  { name: "id", type: "number", header: "ID", defaultVisible: false },
  { name: "trimmedSequences", header: "Trimmed Sequences", defaultFlex: 1 },
  { name: "duplicates", header: "Duplicates" },
];

const gridStyle = { minHeight: 550, width: "100%" };

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
  const onCopyActiveRowChange = useCallback((row: unknown) => {
    console.log(row);
  }, []);
  return (
    <div style={{ zIndex: 1000 }}>
      <ReactDataGrid
        idProperty="id"
        style={gridStyle}
        columns={columns}
        dataSource={data}
        rowHeight={25}
        pagination
        defaultLimit={20}
        enableSelection
        multiSelect
        enableClipboard
        onCopyActiveRowChange={onCopyActiveRowChange}
        rowStyle={{
          fontFamily: "monospace",
        }}
      />
    </div>
  );
};

export default DataTable;
