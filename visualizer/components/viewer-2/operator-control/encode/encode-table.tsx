import React, { useEffect, useState } from "react";
import { Button, ButtonGroup, Form, Table } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import axios from "axios";
import { EncodeDataEntry } from "../../redux/encode-data";
import { RootState } from "../../redux/store";
import {
  EyeSlash,
  Eye,
  PencilSquare,
  Check2,
  X,
  Eraser,
} from "react-bootstrap-icons";

type RecordProps = {
  record: EncodeDataEntry;
};

const Record: React.FC<RecordProps> = React.memo<RecordProps>(function _Record(
  props
) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [seqValue, setSeqValue] = useState<string>(props.record.randomRegion);
  const [idValue, setIdValue] = useState<string>(props.record.id);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isValid, setIsValid] = useState<boolean>(true);

  const dispatch = useDispatch();
  const encodeData = useSelector((state: RootState) => state.encodeData);

  const sessionId = useSelector(
    (state: RootState) => state.sessionConfig.sessionId
  );

  useEffect(() => {
    const idValid = idValue.length > 0;
    const seqValid = /^[ACGTUacgtu]+$/.test(seqValue);
    setIsValid(idValid && seqValid);
  }, [idValue, seqValue]);

  const onChangeShow = () => {
    // dispatch action to change show status
    const idx = encodeData.findIndex((e) => e.key === props.record.key);
    let newEncodeData = [...encodeData];
    let newRecord: EncodeDataEntry = { ...props.record };
    newRecord.isShown = !newRecord.isShown;
    newEncodeData[idx] = newRecord;
    dispatch({
      type: "encodeData/set",
      payload: newEncodeData,
    });
  };

  const onEdit = () => {
    setIsEditing(true);
  };

  const onRemove = () => {
    // dispatch action to remove record
    const idx = encodeData.findIndex((e) => e.key === props.record.key);
    let newEncodeData = [...encodeData];
    newEncodeData.splice(idx, 1);
    dispatch({
      type: "encodeData/set",
      payload: newEncodeData,
    });
  };

  const onEditCancel = () => {
    setSeqValue(props.record.randomRegion);
    setIdValue(props.record.id);
    setIsEditing(false);
  };

  const onEditSave = async () => {
    if (isValid && isDirty) {
      // dispatch action to update record
      const idx = encodeData.findIndex((e) => e.key === props.record.key);
      let newEncodeData = [...encodeData];
      let newRecord: EncodeDataEntry = { ...props.record };
      newRecord.id = idValue;
      newRecord.randomRegion = seqValue;
      if (seqValue !== props.record.randomRegion) {
        const res = await axios
          .post("/session/encode", {
            session_id: sessionId,
            sequences: [seqValue],
          })
          .then((res) => res.data);
        const { coord_x, coord_y } = res.data[0];
        newRecord.coordX = coord_x;
        newRecord.coordY = coord_y;
      }
      newEncodeData[idx] = newRecord;
      dispatch({
        type: "encodeData/set",
        payload: newEncodeData,
      });
      setIsEditing(false);
    }
  };

  const onIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIdValue(e.target.value);
    setIsDirty(true);
  };

  const onSeqChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSeqValue(e.target.value);
    setIsDirty(true);
  };

  if (isEditing) {
    return (
      <tr key={props.record.key}>
        <td>
          <Form.Control type="text" value={idValue} onChange={onIdChange} />
        </td>
        <td className="font-monospace text-break">
          <Form.Control type="text" value={seqValue} onChange={onSeqChange} />
        </td>
        <td>
          <ButtonGroup>
            <Button variant="success" onClick={onEditSave} disabled={!isDirty}>
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
        <td>{props.record.id}</td>
        <td className="font-monospace text-break">
          {props.record.randomRegion}
        </td>
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

const EncodeTable: React.FC = React.memo(function _Table() {
  const encodeData = useSelector((state: RootState) => state.encodeData);
  return (
    <div style={{ height: "200px", overflowY: "auto" }}>
      <Table striped bordered hover size="sm">
        <thead>
          <tr>
            <th>ID</th>
            <th>Sequence</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {encodeData.map((record) => (
            <Record record={record} key={record.key} />
          ))}
        </tbody>
      </Table>
    </div>
  );
});

export default EncodeTable;
