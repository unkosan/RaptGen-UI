import { useSelector, useDispatch } from "react-redux";
import { RootState } from "./redux/store";
import { useState, useEffect } from "react";
import { apiClient } from "~/services/api-client";
import { setEncoded } from "./redux/interaction-data";
import { Button, Card, Form, InputGroup, Spinner } from "react-bootstrap";
import { PlusLg } from "react-bootstrap-icons";
import { useIsLoading } from "~/hooks/common";
// import ManualEncodeForm from "./manual-encode-form";
// import FastaUploader from "./fasta-uploader";

const parser = (text: string) => {
  const regex = /^>\s*([^\n\r]+)[\n\r]+([ACGTUacgtu\n\r]+)$/gm;
  let ids: string[] = [];
  let seqs: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text))) {
    ids.push(match[1]);
    seqs.push(
      match[2]
        .replace(/[\n\r]/g, "")
        .toUpperCase()
        .replace(/T/g, "U")
    );
  }

  return { ids, seqs };
};

const FastaUploader: React.FC = () => {
  const dispatch = useDispatch();
  const sessionId = useSelector(
    (state: RootState) => state.sessionConfig.sessionId
  );

  const encodedData2 = useSelector(
    (state: RootState) => state.interactionData.encoded
  );

  // const [feedback, setFeedback] = useState<string>("");
  const [isValid, setIsValid] = useState<boolean>(true);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const { ids, seqs } = parser(text);
      if (ids.length === 0 || seqs.length === 0) {
        setIsValid(false);
        return;
      }

      const res = await apiClient.encode({
        session_uuid: sessionId,
        sequences: seqs,
      });

      dispatch(
        setEncoded({
          ids: encodedData2.ids.concat(ids),
          randomRegions: encodedData2.randomRegions.concat(seqs),
          coordsX: encodedData2.coordsX.concat(res.coords_x),
          coordsY: encodedData2.coordsY.concat(res.coords_y),
          shown: encodedData2.shown.concat(Array(ids.length).fill(true)),
        })
      );

      setIsValid(true);
    };
    reader.readAsText(file);
  };

  return (
    <Form.Group className="">
      <Form.Control type="file" onChange={handleFile} isInvalid={!isValid} />
      <Form.Control.Feedback type="invalid">
        Invalid FASTA file
      </Form.Control.Feedback>
    </Form.Group>
  );
};

const ManualEncodeForm: React.FC = () => {
  const [value, setValue] = useState<string>("");
  const [isValid, setIsValid] = useState<boolean>(false);
  const [isLoading, lock, unlock] = useIsLoading();

  const dispatch = useDispatch();
  const sessionId = useSelector(
    (state: RootState) => state.sessionConfig.sessionId
  );
  const encodedData2 = useSelector(
    (state: RootState) => state.interactionData.encoded
  );

  useEffect(() => {
    setIsValid(/^[ACGTUacgtu]+$/.test(value));
  }, [value]);

  const onSeqChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value.toUpperCase().replace(/T/g, "U"));
  };

  const onAdd = async () => {
    if (!isValid) {
      return;
    }

    if (sessionId === "") {
      return;
    }

    lock();

    const encodeRes = await apiClient.encode({
      session_uuid: sessionId,
      sequences: [value],
    });

    dispatch(
      setEncoded({
        ids: encodedData2.ids.concat(`manual-${encodedData2.ids.length}`),
        randomRegions: encodedData2.randomRegions.concat(value),
        coordsX: encodedData2.coordsX.concat(encodeRes.coords_x[0]),
        coordsY: encodedData2.coordsY.concat(encodeRes.coords_y[0]),
        shown: encodedData2.shown.concat(true),
      })
    );
    setValue("");
    unlock();
  };

  return (
    <InputGroup hasValidation className="mb-2">
      <Form.Control
        id="newSeqInput"
        onChange={onSeqChange}
        value={value}
        isInvalid={!(isValid || value === "")}
      />
      <Button
        id="addSeqButton"
        disabled={!isValid || isLoading}
        onClick={onAdd}
      >
        {isLoading ? (
          <Spinner animation="border" size="sm" />
        ) : (
          <div className="d-flex align-items-center">
            <PlusLg />
          </div>
        )}
      </Button>
      <Form.Control.Feedback type="invalid">
        Please enter a valid sequence.
      </Form.Control.Feedback>
    </InputGroup>
  );
};

const Encode: React.FC = () => {
  return (
    <Card className="mb-3">
      <Card.Header>Encoder Input</Card.Header>
      <Card.Body>
        <ManualEncodeForm />
        <Form.Text>From fasta file</Form.Text>
        <FastaUploader />
      </Card.Body>
    </Card>
  );
};

export default Encode;
