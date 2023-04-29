import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { Form } from "react-bootstrap";

const FormMinCount: React.FC = () => {
  const [value, setValue] = useState<number>(5);
  const [isValid, setIsValid] = useState<boolean>(true);

  const dispatch = useDispatch();
  const graphConfig = useSelector((state: RootState) => state.graphConfig);

  useEffect(() => {
    if (isValid) {
      dispatch({
        type: "graphConfig/set",
        payload: {
          ...graphConfig,
          minCount: value,
        },
      });
    }
  }, [isValid, value]);

  return (
    <Form.Group className="mb-3">
      <Form.Label>Minimum Count</Form.Label>
      <Form.Control
        type="number"
        value={value}
        onChange={(e) => {
          const value = parseInt(e.target.value);
          setIsValid(!isNaN(value) && value >= 1);
          setValue(value);
        }}
        isInvalid={!isValid}
      />
    </Form.Group>
  );
};

export default FormMinCount;
