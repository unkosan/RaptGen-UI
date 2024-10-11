import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Button, Form, InputGroup } from "react-bootstrap";
import { Plus } from "react-bootstrap-icons";
import { apiClient } from "~/services/api-client";

const ManualEncodeForm: React.FC = () => {
  const [value, setValue] = useState<string>("");
  const [isValid, setIsValid] = useState<boolean>(false);

  const dispatch = useDispatch();
  const sessionId = useSelector(
    (state: RootState) => state.sessionConfig.sessionId
  );
  const manualEncodeCount = useSelector(
    (state: RootState) => state.sessionConfig.manualEncodeCount
  );
  const encodeData = useSelector((state: RootState) => state.encodeData);

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

    const res = await apiClient.encode({
      session_uuid: sessionId,
      sequences: [value],
    });

    const coord_x = res.coords_x[0];
    const coord_y = res.coords_y[0];
    let newEncodeData = [...encodeData];
    newEncodeData.push({
      key: manualEncodeCount,
      id: `manual-${manualEncodeCount}`,
      sequence: "",
      randomRegion: value,
      coordX: coord_x,
      coordY: coord_y,
      isSelected: false,
      isShown: true,
      category: "manual",
      seriesName: "manual",
    });
    dispatch({
      type: "encodeData/set",
      payload: newEncodeData,
    });
    dispatch({
      type: "sessionConfig/incrementEncodeCount",
      payload: null,
    });
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
