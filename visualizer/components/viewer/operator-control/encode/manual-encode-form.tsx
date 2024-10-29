import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Button, Form, InputGroup } from "react-bootstrap";
import { Plus } from "react-bootstrap-icons";
import { apiClient } from "~/services/api-client";
import { setEncoded } from "../../redux/interaction-data";

const ManualEncodeForm: React.FC = () => {
  const [value, setValue] = useState<string>("");
  const [isValid, setIsValid] = useState<boolean>(false);

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
  };

  return (
    <Form.Group className="mb-3">
      <InputGroup hasValidation>
        <Form.Control
          id="newSeqInput"
          onChange={onSeqChange}
          value={value}
          isInvalid={!(isValid || value === "")}
        />
        <Button id="addSeqButton" disabled={!isValid} onClick={onAdd}>
          <Plus size={25} />
        </Button>
        <Form.Control.Feedback type="invalid">
          Please enter a valid sequence.
        </Form.Control.Feedback>
      </InputGroup>
    </Form.Group>
  );
};

export default ManualEncodeForm;
