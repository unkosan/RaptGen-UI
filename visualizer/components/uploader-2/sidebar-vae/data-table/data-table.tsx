import { Table } from "react-bootstrap";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";

const DataTable: React.FC = () => {
  const sequenceData = useSelector(
    (state: RootState) => state.vaeConfig.sequenceData
  );
  return (
    <div style={{ height: "200px", overflowY: "auto" }}>
      <Table striped bordered hover>
        <thead>
          <tr>
            <td>
              <b>Trimmed Sequences</b>
            </td>
            <td>
              <b>Duplicates</b>
            </td>
          </tr>
        </thead>
        <tbody>
          {sequenceData.randomRegions.map((seq, i) => {
            return seq ? (
              <tr key={i}>
                <td>{seq}</td>
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
