import {
  EyeSlash,
  Eye,
  PencilSquare,
  Eraser,
  Check2,
  X,
} from "react-bootstrap-icons";
import { DecodeDataEntry } from "../../redux/decode-data";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import axios from "axios";
import { Button, ButtonGroup, Form } from "react-bootstrap";

type RecordProps = {
  record: DecodeDataEntry;
};

const Record: React.FC<RecordProps> = React.memo<RecordProps>(function _Record(
  props
) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [valueX, setValueX] = useState<number>(props.record.coordX);
  const [valueY, setValueY] = useState<number>(props.record.coordY);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isValid, setIsValid] = useState<boolean>(true);

  const dispatch = useDispatch();
  const decodeData = useSelector((state: RootState) => state.decodeData);

  const sessionId = useSelector(
    (state: RootState) => state.sessionConfig.sessionId
  );

  useEffect(() => {
    const xValid = !isNaN(valueX);
    const yValid = !isNaN(valueY);
    setIsValid(xValid && yValid);
  }, [valueX, valueY]);

  const onChangeShow = () => {
    // dispatch action to change show status
    const idx = decodeData.findIndex((e) => e.key === props.record.key);
    let newDecodeData = [...decodeData];
    let newRecord: DecodeDataEntry = { ...props.record };
    newRecord.isShown = !newRecord.isShown;
    newDecodeData[idx] = newRecord;
    dispatch({
      type: "decodeData/set",
      payload: newDecodeData,
    });
  };

  const onEdit = () => {
    setIsEditing(true);
  };

  const onRemove = () => {
    // dispatch action to remove record
    const idx = decodeData.findIndex((e) => e.key === props.record.key);
    let newDecodeData = [...decodeData];
    newDecodeData.splice(idx, 1);
    dispatch({
      type: "decodeData/set",
      payload: newDecodeData,
    });
  };

  const onEditCancel = () => {
    setIsEditing(false);
    setIsDirty(false);
    setValueX(props.record.coordX);
    setValueY(props.record.coordY);
  };

  const onEditSave = async () => {
    if (isValid && isDirty) {
      // dispatch action to update record
      const idx = decodeData.findIndex((e) => e.key === props.record.key);
      let newDecodeData = [...decodeData];
      let newRecord: DecodeDataEntry = {
        ...props.record,
      };
      newRecord.coordX = valueX;
      newRecord.coordY = valueY;

      const res = await axios
        .post("/session/decode", {
          session_id: sessionId,
          coords: [
            {
              coord_x: valueX,
              coord_y: valueY,
            },
          ],
        })
        .then((res) => res.data);

      if (res.status !== "success") {
        return;
      }

      const sequence = res.data[0];
      newRecord.randomRegion = sequence;

      newDecodeData[idx] = newRecord;
      dispatch({
        type: "decodeData/set",
        payload: newDecodeData,
      });
      setIsEditing(false);
    }
  };

  const onChangeX = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValueX(parseFloat(e.target.value));
    setIsDirty(true);
  };
  const onChangeY = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValueY(parseFloat(e.target.value));
    setIsDirty(true);
  };

  if (isEditing) {
    return (
      <tr key={props.record.key}>
        <td>
          <Form.Control
            type="number"
            value={valueX}
            onChange={onChangeX}
            step={0.1}
          />
        </td>
        <td>
          <Form.Control
            type="number"
            value={valueY}
            onChange={onChangeY}
            step={0.1}
          />
        </td>
        <td>{props.record.randomRegion}</td>
        <td>
          <ButtonGroup>
            <Button
              variant="success"
              onClick={onEditSave}
              disabled={!isValid || !isDirty}
            >
              <Check2 />
            </Button>
            <Button
              variant="danger"
              className="px-2 py-1"
              onClick={onEditCancel}
            >
              <X />
            </Button>
          </ButtonGroup>
        </td>
      </tr>
    );
  } else {
    return (
      <tr key={props.record.key}>
        <td>{props.record.coordX}</td>
        <td>{props.record.coordY}</td>
        <td>{props.record.randomRegion}</td>
        <td>
          <ButtonGroup>
            {props.record.isShown ? (
              <Button
                variant="primary"
                className="px-1 py-0"
                onClick={onChangeShow}
              >
                <Eye />
              </Button>
            ) : (
              <Button
                variant="outline-primary"
                className="px-1 py-0"
                onClick={onChangeShow}
              >
                <EyeSlash />
              </Button>
            )}
            <Button variant="success" className="px-1 py-0" onClick={onEdit}>
              <PencilSquare />
            </Button>
            <Button variant="danger" className="px-1 py-0" onClick={onRemove}>
              <Eraser />
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
    <table className="table table-striped table-hover">
      <thead>
        <tr>
          <th>X</th>
          <th>Y</th>
          <th>Sequence</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {decodeData.slice(1).map((record) => (
          <Record key={record.key} record={record} />
        ))}
      </tbody>
    </table>
  );
});

export default Table;
