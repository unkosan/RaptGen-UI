import { useEffect, useState } from "react";
import { Badge, InputGroup, Tooltip } from "react-bootstrap";
import { Button, Form, OverlayTrigger } from "react-bootstrap";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { apiClient } from "~/services/api-client";
import { RootState } from "./redux/store";

const parseCsv = (text: string) => {
  const lines = text.split(/\r\n|\n|\r/);
  let headers = lines[0].split(",");

  const randomRegionIndex = headers.indexOf("random_region");
  if (randomRegionIndex === -1) {
    alert("random_region field is not found");
    throw new Error("random_region field is not found");
  }
  const seqIdIndex = headers.indexOf("seq_id");
  if (seqIdIndex === -1) {
    alert("seq_id field is not found");
    throw new Error("seq_id field is not found");
  }

  const validColumnsLength = headers.filter((header: string) => {
    return (
      header !== "random_region" &&
      header !== "seq_id" &&
      header !== "" &&
      header !== "coord_x" &&
      header !== "coord_y"
    );
  }).length;
  if (validColumnsLength === 0) {
    alert("No valid columns found");
    throw new Error("No valid columns found");
  }

  let sequenceIndex: number[] = [];
  let column: string[] = [];
  let value: number[] = [];
  let randomRegion: string[] = [];
  let id: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const data = lines[i].split(",");
    randomRegion.push(data[randomRegionIndex].trim());
    id.push(data[seqIdIndex].trim());

    for (let j = 0; j < headers.length; j++) {
      if (j === randomRegionIndex) continue;
      if (j === seqIdIndex) continue;

      sequenceIndex.push(i - 1);
      column.push(headers[j]);
      value.push(Number(data[j]));
    }
  }

  headers.splice(randomRegionIndex, 1);
  headers.splice(seqIdIndex, 1);

  return {
    columnNames: headers,
    id,
    randomRegion,
    sequenceIndex,
    column,
    value,
  };
};

const InitialDataset: React.FC = () => {
  const dispatch = useDispatch();
  const sessionConfig = useSelector((state: RootState) => state.sessionConfig);
  const bayesoptConfig = useSelector(
    (state: RootState) => state.bayesoptConfig
  );
  const [gmmModels, setGmmModels] = useState<
    {
      uuid: string;
      name: string;
    }[]
  >([]);
  const [selectedModel, setSelectedModel] = useState<string>("");

  // retrieve GMM model names
  useEffect(() => {
    (async () => {
      if (sessionConfig.vaeId === "") return;
      const res = await apiClient.getGMMModelNames({
        queries: {
          vae_uuid: sessionConfig.vaeId,
        },
      });

      setGmmModels(res.entries);
      if (res.entries.length > 0) {
        setSelectedModel(res.entries[0].uuid);
      }
    })();
  }, [sessionConfig.vaeId]);

  // when gmm model is selected
  const onClickApplyGMM = async () => {
    if (selectedModel === "") return;
    try {
      const resModel = await apiClient.getGMMModel({
        queries: {
          gmm_uuid: selectedModel,
        },
      });

      const resDecode = await apiClient.decode({
        session_uuid: sessionConfig.sessionId,
        coords_x: resModel.means.map((mean) => mean[0]),
        coords_y: resModel.means.map((mean) => mean[1]),
      });

      const randomRegions = resDecode.sequences.map((value) => {
        return value.replaceAll("_", "").replaceAll("N", "");
      });

      const resEncode = await apiClient.encode({
        session_uuid: sessionConfig.sessionId,
        sequences: randomRegions,
      });

      setDirty();

      dispatch({
        type: "registeredValues/set",
        payload: {
          id: new Array(randomRegions.length)
            .fill("")
            .map((_, i) => `MoG No.${i + 1}`),
          randomRegion: randomRegions,
          coordX: resEncode.coords_x,
          coordY: resEncode.coords_y,
          staged: new Array(randomRegions.length).fill(false),
          columnNames: ["value"],
          sequenceIndex: randomRegions.map((_, i) => i),
          column: new Array(randomRegions.length).fill("value"),
          value: new Array(randomRegions.length).fill(null),
        },
      });

      dispatch({
        type: "bayesoptConfig/set",
        payload: {
          ...bayesoptConfig,
          targetColumn: "value",
        },
      });
    } catch (e) {
      console.error(e);
      return;
    }
  };

  // when a file is uploaded
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (e) => {
      const text = e.target?.result as string;
      try {
        let { columnNames, randomRegion, id, sequenceIndex, column, value } =
          parseCsv(text);

        if (columnNames.length === 0) {
          alert("No valid columns found");
          return;
        }

        const res = await apiClient.encode({
          session_uuid: sessionConfig.sessionId,
          sequences: randomRegion,
        });

        if (columnNames.includes("coord_X")) {
          columnNames.splice(columnNames.indexOf("coord_X"), 1);
        }
        if (columnNames.includes("coord_Y")) {
          columnNames.splice(columnNames.indexOf("coord_Y"), 1);
        }
        const mask = column.map((c) => c !== "coord_X" && c !== "coord_Y");
        column = column.filter((_, i) => mask[i]);
        sequenceIndex = sequenceIndex.filter((_, i) => mask[i]);
        value = value.filter((_, i) => mask[i]);

        setDirty();

        dispatch({
          type: "registeredValues/set",
          payload: {
            id,
            randomRegion,
            coordX: res.coords_x,
            coordY: res.coords_y,
            staged: new Array(randomRegion.length).fill(false),
            columnNames,
            sequenceIndex,
            column,
            value,
          },
        });

        dispatch({
          type: "bayesoptConfig/set",
          payload: {
            targetColumn: columnNames[0],
            optimizationType: "qEI",
            queryBudget: 3,
          },
        });
      } catch (e) {
        console.error(e);
        return;
      }
    };
    reader.readAsText(file);
  };

  const setDirty = () => {
    dispatch({
      type: "isDirty/set",
      payload: true,
    });
  };

  return (
    <>
      <Form.Group className="mb-3">
        <Form.Label>
          Upload manually curated csv dataset
          <OverlayTrigger
            overlay={
              <Tooltip>
                <div style={{ textAlign: "left" }}>
                  Upload csv file with headers. The header must contain
                  <code>&apos;random_region&apos;</code> and{" "}
                  <code>&apos;seq_id&apos;</code>
                  field.
                  <br />
                  if <code>&apos;coord_x&apos;</code> or{" "}
                  <code>&apos;coord_y&apos;</code> field is included, it will be
                  removed from the uploaded file to avoid duplication.
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
        <Form.Control type="file" onChange={onFileChange} />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>
          Auto-generate from registered GMM centers
          <OverlayTrigger
            overlay={
              <Tooltip>
                <div style={{ textAlign: "left" }}>
                  Decode sequences from GMM centers and reembed them for initial
                  dataset. If a decoded sequence has <code>&apos;N&apos;</code>{" "}
                  token, it will be removed and then reembedded.
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
        <InputGroup>
          <Form.Control
            as="select"
            onChange={(e) => {
              setSelectedModel(e.target.value);
            }}
          >
            {gmmModels.map((model, i) => (
              <option key={i} value={model.uuid}>
                {model.name}
              </option>
            ))}
          </Form.Control>
          <Button variant="outline-primary" onClick={onClickApplyGMM}>
            Load
          </Button>
        </InputGroup>
      </Form.Group>
    </>
  );
};

export default InitialDataset;
