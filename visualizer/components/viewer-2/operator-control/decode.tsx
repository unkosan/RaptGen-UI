import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { DecodeDataEntry } from "../redux/decode-data";
import { Button, ButtonGroup, Form, Image, InputGroup } from "react-bootstrap";

import RangeSlider from "react-bootstrap-range-slider";
import { useDispatch } from "react-redux";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

type PointSelectorProps = {
  point: Record<number, number>;
  setPoint: React.Dispatch<SetStateAction<Record<number, number>>>;
};

type ResultViewerProps = {
  point: Record<number, number>;
};

type RecordProps = {
  record: DecodeDataEntry;
};

const PointSelector: React.FC<PointSelectorProps> = (props) => {
  const [pointValueX, setPointValueX] = useState<number>(0);
  const [pointValueY, setPointValueY] = useState<number>(0);

  const [pointValidX, setPointValidX] = useState<boolean>(true);
  const [pointValidY, setPointValidY] = useState<boolean>(true);

  const onChangePointX = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setPointValidX(!isNaN(value));
    setPointValueX(value);
  };
  const onChangePointY = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setPointValidY(!isNaN(value));
    setPointValueY(value);
  };

  useEffect(() => {
    if (pointValidX && pointValidY) {
      props.setPoint({ 0: pointValueX, 1: pointValueY });
    }
  }, [pointValueX, pointValueY, pointValidX, pointValidY]);

  return (
    <>
      <InputGroup hasValidation>
        <InputGroup.Text>X :</InputGroup.Text>
        <InputGroup.Text
          style={{
            backgroundColor: "white",
          }}
        >
          <RangeSlider
            value={pointValueX}
            onChange={onChangePointX}
            min={-3.5}
            max={3.5}
            step={0.1}
            tooltipPlacement="top"
          />
        </InputGroup.Text>
        <Form.Control
          className="w-25"
          type="number"
          step={0.1}
          value={pointValueX}
          onChange={onChangePointX}
          isInvalid={!pointValidX}
        />
        <Form.Control.Feedback type="invalid">
          Please input a valid number
        </Form.Control.Feedback>
      </InputGroup>
      <InputGroup hasValidation>
        <InputGroup.Text>Y :</InputGroup.Text>
        <InputGroup.Text
          style={{
            backgroundColor: "white",
          }}
        >
          <RangeSlider
            value={pointValueY}
            onChange={onChangePointY}
            min={-3.5}
            max={3.5}
            step={0.1}
          />
        </InputGroup.Text>
        <Form.Control
          type="number"
          step={0.1}
          value={pointValueY}
          onChange={onChangePointY}
          isInvalid={!pointValidY}
        />
        <Form.Control.Feedback type="invalid">
          Please input a valid number
        </Form.Control.Feedback>
      </InputGroup>
    </>
  );
};

const ResultViewer: React.FC<ResultViewerProps> = (props) => {
  const [showWeblogo, setShowWeblogo] = useState<boolean>(false);
  const [showSecondaryStructure, setShowSecondaryStructure] =
    useState<boolean>(false);

  const [weblogoBase64, setWeblogoBase64] = useState<string>("");
  const [secondaryStructureBase64, setSecondaryStructureBase64] =
    useState<string>("");

  const dispatch = useDispatch();
  const sessionConfig = useSelector((state: RootState) => state.sessionConfig);
  const plotConfig = useSelector((state: RootState) => state.graphConfig);

  // set lock with useState to avoid too many requests of decoding
  const [lock, setLock] = useState<boolean>(false);

  const [decodedSeq, setDecodedSeq] = useState<string>("");

  // 200 ms delay and then unlock
  useEffect(() => {
    if (lock) {
      return;
    }

    setLock(true);
    setTimeout(() => {
      setLock(false);
    }, 200);
  }, [props.point, showWeblogo, showSecondaryStructure]);

  useEffect(() => {
    if (!showWeblogo) {
      setWeblogoBase64("");
      return;
    }

    if (lock) {
      return;
    }

    (async () => {
      const res = await axios
        .post(
          "/session/decode/weblogo",
          {
            session_id: sessionConfig.sessionId,
            coords: [
              {
                coord_x: props.point[0],
                coord_y: props.point[1],
              },
            ],
          },
          {
            responseType: "arraybuffer",
          }
        )
        .then((res) => res.data);

      const base64 = Buffer.from(res, "binary").toString("base64");
      setWeblogoBase64(base64);
    })();
  }, [sessionConfig.sessionId, props.point, showWeblogo]);

  useEffect(() => {
    if (!showSecondaryStructure || decodedSeq === "") {
      setSecondaryStructureBase64("");
      return;
    }

    if (lock) {
      return;
    }

    (async () => {
      const res = await axios
        .get("/tool/secondary-structure", {
          params: {
            sequence: decodedSeq,
          },
          responseType: "arraybuffer",
        })
        .then((res) => res.data);

      const base64 = Buffer.from(res, "binary").toString("base64");
      setSecondaryStructureBase64(base64);
    })();
  }, [decodedSeq, showSecondaryStructure]);

  useEffect(() => {
    if (sessionConfig.sessionId === 0) {
      return;
    }

    if (lock) {
      return;
    }

    (async () => {
      const res = await axios
        .post("/session/decode", {
          session_id: sessionConfig.sessionId,
          coords: [
            {
              coord_x: props.point[0],
              coord_y: props.point[1],
            },
          ],
        })
        .then((res) => res.data);
      setDecodedSeq(res.data[0]);
    })();
  }, [sessionConfig.sessionId, props.point]);

  useEffect(() => {
    dispatch({
      type: "decodeData/update",
      payload: {
        key: 0,
        id: "grid",
        sequence: decodedSeq,
        randomRegion: decodedSeq,
        coordX: props.point[0],
        coordY: props.point[1],
        isSelected: false,
        isShown: true,
        category: "manual",
        seriesName: "grid",
      },
    });
  }, [props.point, decodedSeq]);

  const onAdd = async () => {
    dispatch({
      type: "decodeData/add",
      payload: {
        key: sessionConfig.manualDecodeCount,
        id: `seq ${sessionConfig.manualDecodeCount}`,
        sequence: decodedSeq,
        randomRegion: decodedSeq,
        coordX: props.point[0],
        coordY: props.point[1],
        isSelected: false,
        isShown: true,
        category: "manual",
        seriesName: "manual",
      },
    });
    dispatch({
      type: "sessionConfig/incrementManualDecodeCount",
      payload: null,
    });
  };

  const onChangeShow = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: "graphConfig/set",
      payload: {
        ...plotConfig,
        showDecodeGrid: e.currentTarget.checked,
      },
    });
  };

  return (
    <div>
      <InputGroup>
        <InputGroup.Text>
          <Form.Check
            label="Show"
            checked={plotConfig.showDecodeGrid}
            onChange={onChangeShow}
          />
        </InputGroup.Text>
        <Form.Control value={decodedSeq} readOnly />
        <Button disabled={decodedSeq === ""} onClick={onAdd}>
          <i className="bi bi-plus"></i>
        </Button>
      </InputGroup>
      <Form.Switch
        label="Show Weblogo"
        checked={showWeblogo}
        onChange={(e) => setShowWeblogo(e.currentTarget.checked)}
      />
      <Form.Switch
        label="Show Secondary Structure"
        checked={showSecondaryStructure}
        onChange={(e) => setShowSecondaryStructure(e.currentTarget.checked)}
      />
      {showWeblogo ? (
        <div>
          <Form.Label>Weblogo</Form.Label>
          <Image
            alt="weblogo"
            src={`data:image/png;charset=utf-8;base64,${weblogoBase64}`}
            fluid
          />
        </div>
      ) : null}
      {showSecondaryStructure ? (
        <div>
          <Form.Label>Secondary Structure</Form.Label>
          <Image
            alt="secondary structure"
            src={`data:image/png;base64,${secondaryStructureBase64}`}
            fluid
          />
        </div>
      ) : null}
    </div>
  );
};

const Record: React.FC<RecordProps> = React.memo<RecordProps>(function _Record(
  props
) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [valueX, setValueX] = useState<number>(props.record.coordX);
  const [valueY, setValueY] = useState<number>(props.record.coordY);
  const [idValue, setIdValue] = useState<string>(props.record.id);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isValid, setIsValid] = useState<boolean>(true);

  const dispatch = useDispatch();

  const sessionId = useSelector(
    (state: RootState) => state.sessionConfig.sessionId
  );

  useEffect(() => {
    const valueXValid = !isNaN(valueX);
    const valueYValid = !isNaN(valueY);
    const idValid = idValue !== "";
    setIsValid(valueXValid && valueYValid && idValid);
  }, [valueX, valueY, idValue]);

  const onChangeShow = () => {
    // dispatch action to change show status
    let newRecord: DecodeDataEntry = { ...props.record };
    newRecord.isShown = !newRecord.isShown;
    dispatch({
      type: "decodeData/update",
      payload: newRecord,
    });
  };

  const onEdit = () => {
    setIsEditing(true);
  };

  const onRemove = () => {
    // dispatch action to remove record
    dispatch({
      type: "decodeData/remove",
      payload: props.record,
    });
  };

  const onEditCancel = () => {
    setValueX(props.record.coordX);
    setValueY(props.record.coordY);
    setIdValue(props.record.id);
    setIsEditing(false);
  };

  const onEditSave = async () => {
    if (isValid && isDirty) {
      // dispatch action to update record
      let newRecord: DecodeDataEntry = { ...props.record };
      newRecord.coordX = valueX;
      newRecord.coordY = valueY;
      newRecord.id = idValue;
      if (valueX !== props.record.coordX || valueY !== props.record.coordY) {
        const res = await axios
          .post("/session/decode", {
            session_id: sessionId,
            coords: [{ coord_x: valueX, coord_y: valueY }],
          })
          .then((res) => res.data);
        const newSeq = res.data[0];
        newRecord.sequence = newSeq;
        newRecord.randomRegion = newSeq;
      }
      dispatch({
        type: "decodeData/update",
        payload: newRecord,
      });
      setIsEditing(false);
    }
  };

  const onChangeX = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValueX(parseInt(e.currentTarget.value));
    setIsDirty(true);
  };

  const onChangeY = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValueY(parseInt(e.currentTarget.value));
    setIsDirty(true);
  };

  if (isEditing) {
    return (
      <tr key={props.record.key}>
        <td>
          <Form.Control
            value={idValue}
            onChange={(e) => setIdValue(e.currentTarget.value)}
          />
        </td>
        <td>
          <Form.Control value={valueX} onChange={onChangeX} />
        </td>
        <td>
          <Form.Control value={valueY} onChange={onChangeY} />
        </td>
        <td>
          <ButtonGroup>
            <Button
              variant="success"
              onClick={onEditSave}
              disabled={!isValid || !isDirty}
            >
              <i className="bi bi-check"></i>
            </Button>
            <Button variant="danger" onClick={onEditCancel}>
              <i className="bi bi-x"></i>
            </Button>
          </ButtonGroup>
        </td>
      </tr>
    );
  } else {
    return (
      <tr key={props.record.key}>
        <td>{props.record.id}</td>
        <td>{props.record.coordX}</td>
        <td>{props.record.coordY}</td>
        <td>
          <ButtonGroup>
            <Button variant="primary" onClick={onChangeShow}>
              <i className="bi bi-check"></i>
            </Button>
            <Button variant="success" onClick={onEdit}>
              <i className="bi bi-pencil"></i>
            </Button>
            <Button>
              <i className="bi bi-x"></i>
            </Button>
          </ButtonGroup>
        </td>
      </tr>
    );
  }
});

const Table: React.FC = React.memo(function _Table() {
  const decodeData = useSelector((state: RootState) => state.decodeData);

  return (
    <div>
      <div className="table-responsive">
        <table className="table table-hover table-sm">
          <thead>
            <tr>
              <th>ID</th>
              <th>Coord X</th>
              <th>Coord Y</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {decodeData.map((record) => (
              <Record key={record.key} record={record} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

const DecodePanel: React.FC = () => {
  const dispatch = useDispatch();

  const [point, setPoint] = useState<Record<number, number>>({ 0: 0, 1: 0 });

  return (
    <Form>
      <Form.Group className="mb-3">
        <Form.Label>Latent Point</Form.Label>
        <PointSelector point={point} setPoint={setPoint} />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Decoded Sequence</Form.Label>
        <ResultViewer point={point} />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Sequence List</Form.Label>
        <Table />
      </Form.Group>
    </Form>
  );
};

export default DecodePanel;
