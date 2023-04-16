import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { Table } from "react-bootstrap";
import React from "react";

const InfoTable: React.FC = () => {
  const sequenceData = useSelector(
    (state: RootState) => state.vaeConfig.sequenceData
  );
  return (
    <>
      <Table striped bordered hover>
        <thead>
          <tr>
            <td>
              <b>Item</b>
            </td>
            <td>
              <b>Value</b>
            </td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Total Entry Count</td>
            <td>{sequenceData.totalLength}</td>
          </tr>
          <tr>
            <td>Uniquified Entry Count</td>
            <td>{sequenceData.uniqueLength}</td>
          </tr>
          <tr>
            <td>Adapters Matched</td>
            <td>{sequenceData.matchedLength}</td>
          </tr>
        </tbody>
      </Table>
    </>
  );
};

export default InfoTable;
