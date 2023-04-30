import { Table } from "react-bootstrap";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";

const DataTable: React.FC = () => {
  const sequenceData = useSelector(
    (state: RootState) => state.vaeConfig.sequenceData
  );
  return (
    <div style={{ height: "200px", overflowY: "auto", marginBottom: "1em" }}>
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
