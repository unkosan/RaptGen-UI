import React, { isValidElement, useEffect, useState } from "react";
import { EncodeDataEntry } from "../redux/encode-data";
import { Button, ButtonGroup, Form, InputGroup } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { RootState } from "../redux/store";
import { useSelector } from "react-redux";
import axios from "axios";

type RecordProps = {
  record: EncodeDataEntry;
};

const Record: React.FC<RecordProps> = React.memo<RecordProps>(function _Record(
  props
) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [seqValue, setSeqValue] = useState<string>(props.record.sequence);
  const [idValue, setIdValue] = useState<string>(props.record.id);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isValid, setIsValid] = useState<boolean>(true);

  const dispatch = useDispatch();

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
    let newRecord: EncodeDataEntry = { ...props.record };
    newRecord.isShown = !newRecord.isShown;
    dispatch({
      type: "encodeData/update",
      payload: newRecord,
    });
  };

  const onEdit = () => {
    setIsEditing(true);
  };

  const onRemove = () => {
    // dispatch action to remove record
    dispatch({
      type: "encodeData/remove",
      payload: props.record,
    });
  };

  const onEditCancel = () => {
    setSeqValue(props.record.sequence);
    setIdValue(props.record.id);
    setIsEditing(false);
  };

  const onEditSave = async () => {
    if (isValid && isDirty) {
      // dispatch action to update record
      let newRecord: EncodeDataEntry = { ...props.record };
      newRecord.id = idValue;
      newRecord.sequence = seqValue;
      if (seqValue !== props.record.sequence) {
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
      dispatch({
        type: "encodeData/update",
        payload: newRecord,
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
        <td>
          <Form.Control type="text" value={seqValue} onChange={onSeqChange} />
        </td>
        <td>
          <ButtonGroup>
            <Button variant="success" onClick={onEditSave}>
              <i className="bi bi-check2"></i>
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
        <td>{props.record.sequence}</td>
        <td>
          <ButtonGroup>
            <Button variant="primary" onClick={onChangeShow}>
              {props.record.isShown ? (
                <i className="bi bi-eye-slash"></i>
              ) : (
                <i className="bi bi-eye"></i>
              )}
            </Button>
            <Button variant="success" onClick={onEdit}>
              <i className="bi bi-pencil-square"></i>
            </Button>
            <Button variant="danger" onClick={onRemove}>
              <i className="bi bi-eraser-fill"></i>
            </Button>
          </ButtonGroup>
        </td>
      </tr>
    );
  }
});

const Table: React.FC = React.memo(function _Table() {
  const encodeData = useSelector((state: RootState) => state.encodeData);
  return (
    <table className="table table-striped table-hover">
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
    </table>
  );
});

const ManualEncodeForm: React.FC = React.memo(function _ManualEncodeForm() {
  const dispatch = useDispatch();
  const sessionConfig = useSelector((state: RootState) => state.sessionConfig);
  const [seqValue, setSeqValue] = useState<string>("");
  const [isValid, setIsValid] = useState<boolean>(false);

  useEffect(() => {
    const seqValid = /^[ACGTUacgtu]+$/.test(seqValue);
    setIsValid(seqValid);
  }, [seqValue]);

  const onSeqChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSeqValue(e.target.value.toUpperCase().replace(/T/g, "U"));
  };

  const onAdd = async () => {
    if (isValid) {
      const res = await axios
        .post("/session/encode", {
          session_id: sessionConfig.sessionId,
          sequences: [seqValue],
        })
        .then((res) => res.data);
      const { coord_x, coord_y } = res.data[0];
      dispatch({
        type: "encodeData/add",
        payload: {
          key: 0,
          id: `seq ${sessionConfig.manualEncodeCount + 1}`,
          sequence: seqValue,
          coordX: coord_x,
          coordY: coord_y,
          isShown: true,
        },
      });
      dispatch({
        type: "sessionConfig/incrementManualEncodeCount",
        payload: null,
      });
    }
  };

  return (
    <Form.Group className="mb-3">
      <InputGroup hasValidation>
        <Form.Control
          onChange={onSeqChange}
          value={seqValue}
          type="text"
          placeholder="AUCG+ only"
        />
        <Button disabled={!isValid} onClick={onAdd}>
          <i className="bi bi-plus"></i>
        </Button>
      </InputGroup>
    </Form.Group>
  );
});

const FastaUploader = React.memo(function _FastaUploader() {
  const dispatch = useDispatch();
  const sessionConfig = useSelector((state: RootState) => state.sessionConfig);

  const [fastaSequences, setFastaSequences] = useState<EncodeDataEntry[]>([]);
  const [fastaFeedback, setFastaFeedback] = useState<string>("");
  const [isFastaValid, setIsFastaValid] = useState<boolean>(true);

  type FastaParserResult = {
    fasta: {
      ids: string[];
      seqs: string[];
    } | null;
    invalidCount: number;
  };

  const fastaParser = (text: string): FastaParserResult => {
    const allCount = text.match(/^>/gm)?.length ?? 0;
    const fastaRegex = /^>\s*(\S+)[\n\r]+([ACGTUacgtu\n\r]+)$/gm;
    let match: RegExpExecArray | null;
    let matchCount = 0;
    let entriesId = [];
    let entriesSeq = [];
    while ((match = fastaRegex.exec(text))) {
      matchCount += 1;
      const id = match[1];
      const seq = match[2]
        .replace(/[\n\r]/g, "")
        .toUpperCase()
        .replace(/T/g, "U");
      entriesId.push(id);
      entriesSeq.push(seq);
    }
    if (matchCount === 0) {
      return {
        fasta: null,
        invalidCount: 0,
      };
    } else {
      return {
        fasta: {
          ids: entriesId,
          seqs: entriesSeq,
        },
        invalidCount: allCount - matchCount,
      };
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.item(0);
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const { fasta, invalidCount } = fastaParser(text);
        if (fasta) {
          const resEncode = await axios
            .post("/session/encode", {
              session_id: sessionConfig.sessionId,
              sequences: fasta.seqs,
            })
            .then((res) => res.data);
          const coords: { coord_x: number; coord_y: number }[] = resEncode.data;
          const fastaData: EncodeDataEntry[] = coords.map(
            ({ coord_x, coord_y }, index) => {
              return {
                key: 0,
                id: fasta.ids[index],
                sequence: fasta.seqs[index],
                randomRegion: fasta.seqs[index],
                coordX: coord_x,
                coordY: coord_y,
                isSelected: false,
                isShown: true,
                category: "fasta",
                seriesName: file.name,
              };
            }
          );
          if (invalidCount > 0) {
            setFastaFeedback(
              `Fasta file is valid. ${invalidCount} invalid sequences were ignored.`
            );
          } else {
            setFastaFeedback("Fasta file is valid.");
          }
          setIsFastaValid(true);
          setFastaSequences(fastaData);
          dispatch({
            type: "encodeData/add",
            payload: fastaData,
          });
        } else {
          setFastaFeedback("Please upload a valid fasta file.");
          setIsFastaValid(false);
          setFastaSequences([]);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <Form.Group className="mb-3">
      <Form.Control
        id="newSeqFile"
        type="file"
        onChange={onFileChange}
        isInvalid={!isFastaValid}
        isValid={isFastaValid && fastaSequences.length > 0}
      />
      <Form.Control.Feedback type="invalid">
        {fastaFeedback}
      </Form.Control.Feedback>
      <Form.Control.Feedback type="valid">
        {fastaFeedback}
      </Form.Control.Feedback>
    </Form.Group>
  );
});

const EncodePanel: React.FC = () => {
  return (
    <div className="encode-panel">
      <Form.Label>Encode Sequence</Form.Label>
      <ManualEncodeForm />
      <Form.Label>Encode FastaFile</Form.Label>
      <FastaUploader />
      <Form.Label>Sequence List</Form.Label>
      <Table />
    </div>
  );
};

export default EncodePanel;
