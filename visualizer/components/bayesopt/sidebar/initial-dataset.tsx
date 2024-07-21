import { useEffect, useState } from "react";
import { Badge, InputGroup, Tooltip } from "react-bootstrap";
import { Button, Form, OverlayTrigger } from "react-bootstrap";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { apiClient } from "~/services/api-client";
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
  const bayesoptConfig = useSelector(
    (state: RootState) => state.bayesoptConfig
  );
  const selectedVAE = useSelector(
    (statet: RootState) => statet.sessionConfig.vaeName
  );
  const [gmmNames, setGmmNames] = useState<string[]>([]);
  const [selectedGMM, setSelectedGMM] = useState<string>("");

  useEffect(() => {
    (async () => {
      if (selectedVAE === "") return;
      const res = await apiClient.getGMMModelNames({
        queries: {
          VAE_model_name: selectedVAE,
        },
      });
      if (res.status === "error") return;
      setGmmNames(res.data);
      if (res.data.length > 0) {
        setSelectedGMM(res.data[0]);
      }
    })();
  }, [selectedVAE]);

  const retrieveGMM = async () => {
    if (selectedVAE === "") return;
    if (selectedGMM === "") return;

    const resGMM = await apiClient.getGMMModel({
      queries: {
        VAE_model_name: selectedVAE,
        GMM_model_name: selectedGMM,
      },
    });
    if (resGMM.status === "error") return;

    const resDecode = await apiClient.decode({
      session_id: sessionId,
      coords: resGMM.data.means.map((mean: number[]) => {
        return { coord_x: mean[0], coord_y: mean[1] };
      }),
    });
    if (resDecode.status === "error") return;

    const randomRegion = resDecode.data;
    const resEncode = await apiClient.encode({
      session_id: sessionId,
      sequences: randomRegion,
    });
    if (resEncode.status === "error") return;

    dispatch({
      type: "registeredValues/set",
      payload: {
        randomRegion,
        coordX: resEncode.data.map((data) => data.coord_x),
        coordY: resEncode.data.map((data) => data.coord_y),
        staged: new Array(randomRegion.length).fill(false),
        columnNames: ["value"],
        sequenceIndex: resEncode.data.map((_, i) => i),
        column: new Array(randomRegion.length).fill("value"),
        value: new Array(randomRegion.length).fill(null),
      },
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (e) => {
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

      if (columnNames.length === 0) return;

      dispatch({
        type: "bayesoptConfig/set",
        payload: {
          ...bayesoptConfig,
          targetColumn: columnNames[0],
          optimizationType: "qEI",
          queryBudget: 3,
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
        <Form.Label>or get from registered GMM centers</Form.Label>
        <InputGroup>
          <Form.Control
            as="select"
            onChange={(e) => {
              setSelectedGMM(e.target.value);
            }}
          >
            {gmmNames.map((name, i) => (
              <option key={i}>{name}</option>
            ))}
          </Form.Control>
          <Button
            variant="outline-primary"
            onClick={() => {
              retrieveGMM();
            }}
          >
            Load
          </Button>
        </InputGroup>
      </Form.Group>
    </>
  );
};

export default InitialDataset;
