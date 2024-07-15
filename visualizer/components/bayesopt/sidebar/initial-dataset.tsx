import { useEffect, useState } from "react";
import { Badge, InputGroup, Tooltip } from "react-bootstrap";
import {
  Button,
  Form,
  ListGroup,
  OverlayTrigger,
  Stack,
  Tab,
  Tabs,
} from "react-bootstrap";
import { PlusLg } from "react-bootstrap-icons";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { z } from "zod";
import { apiClient } from "~/services/api-client";
import { responseExperimentList } from "~/services/route/bayesopt";
import { RootState } from "../redux/store";

const parseCsv = (text: string) => {
  const lines = text.split(/\r\n|\n|\r/);
  let headers = lines[0].split(",");
  const randomRegionIndex = headers.indexOf("random_regions");
  if (randomRegionIndex === -1) {
    throw new Error("random_regions field is not found");
  }

  let sequenceIndex: number[] = [];
  let column: string[] = [];
  let value: number[] = [];
  let randomRegion: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const data = lines[i].split(",");
    randomRegion.push(data[randomRegionIndex].trim());

    for (let j = 0; j < headers.length; j++) {
      if (j === randomRegionIndex) continue;
      sequenceIndex.push(i - 1);
      column.push(headers[j]);
      value.push(Number(data[j]));
    }
  }

  headers.splice(randomRegionIndex, 1);

  return {
    columnNames: headers,
    randomRegion,
    sequenceIndex,
    column,
    value,
  };
};

const InitialDataset: React.FC = () => {
  const dispatch = useDispatch();
  const sessionId = useSelector(
    (state: RootState) => state.sessionConfig.sessionId
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (e) => {
      console.log("file loaded");
      const text = e.target?.result as string;
      const { columnNames, randomRegion, sequenceIndex, column, value } =
        parseCsv(text);

      const res = await apiClient.encode({
        session_id: sessionId,
        sequences: randomRegion,
      });
      if (res.status === "error") return;
      let coordX: number[] = [];
      let coordY: number[] = [];
      console.log(res.data);
      for (let i = 0; i < res.data.length; i++) {
        coordX.push(res.data[i].coord_x);
        coordY.push(res.data[i].coord_y);
      }

      dispatch({
        type: "registeredValues/set",
        payload: {
          randomRegion,
          coordX,
          coordY,
          staged: new Array(randomRegion.length).fill(false),
          columnNames,
          sequenceIndex,
          column,
          value,
        },
      });
    };
    reader.readAsText(file);
  };

  return (
    <>
      <legend>Initial dataset</legend>
      <Form.Group className="mb-3">
        <Form.Label>
          upload csv dataset
          <OverlayTrigger
            overlay={
              <Tooltip>
                <div style={{ textAlign: "left" }}>
                  Upload csv file with headers. The header must contain
                  <span className="font-monospace"> random_regions </span>
                  field.
                </div>
              </Tooltip>
            }
          >
            <span className="ms-1">
              <Badge pill bg="secondary">
                ?
              </Badge>
            </span>
          </OverlayTrigger>
        </Form.Label>
        <Form.Control type="file" onChange={handleFileChange} />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Or get from registered GMM centers</Form.Label>
        <InputGroup>
          <Form.Control as="select">
            <option>centers-1</option>
            <option>centers-2</option>
          </Form.Control>
          <Button variant="outline-primary">Load</Button>
        </InputGroup>
      </Form.Group>
    </>
  );
};

export default InitialDataset;
