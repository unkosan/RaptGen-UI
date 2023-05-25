import { Table } from "react-bootstrap";
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
          wrap: "break-word",
        }}
      />
    </div>
  );
};

const DataTable2: React.FC = () => {
  const sequenceData = useSelector(
    (state: RootState) => state.vaeConfig.sequenceData
  );
  return (
    <div style={{ height: "200px", overflowY: "auto" }}>
      <Table striped bordered hover size="sm">
        <thead>
          <tr>
            <th>Trimmed Sequences</th>
            <th>Duplicates</th>
          </tr>
        </thead>
        <tbody>
          {sequenceData.randomRegions.map((seq, i) => {
            return seq ? (
              <tr key={i}>
                <td className="font-monospace text-break">{seq}</td>
                <td>{sequenceData.duplicates[i]}</td>
              </tr>
            ) : null;
          })}
        </tbody>
      </Table>
    </div>
  );
};

export default DataTable;
