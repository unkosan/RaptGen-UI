import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { RootState } from "./redux/store";
import { Card, Form } from "react-bootstrap";
import { setGraphConfig } from "./redux/graph-config";

const ConfigSelector: React.FC = () => {
  const [showGMM, setShowGMM] = useState<boolean>(true);
  const [minCount, setMinCount] = useState<number>(5);
  const [isValid, setIsValid] = useState<boolean>(true);

  const dispatch = useDispatch();
  const graphConfig = useSelector((state: RootState) => state.graphConfig);

  useEffect(() => {
    if (isValid) {
      dispatch(
        setGraphConfig({
          ...graphConfig,
          minCount,
        })
      );
    }
  }, [isValid, minCount]);

  useEffect(() => {
    dispatch(
      setGraphConfig({
        ...graphConfig,
        showGMM,
      })
    );
  }, [showGMM]);

  return (
    <Card className="mb-3">
      <Card.Body>
        <Form.Group className="mb-3">
          <Form.Label>Minimum Count</Form.Label>
          <Form.Control
            type="number"
            value={minCount}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              setIsValid(!isNaN(value) && value >= 1);
              setMinCount(value);
            }}
            isInvalid={!isValid}
          />
        </Form.Group>
        <Form.Group className="">
          <Form.Switch
            label="Show GMM"
            checked={showGMM}
            onChange={(e) => setShowGMM(e.target.checked)}
          />
        </Form.Group>
      </Card.Body>
    </Card>
  );
};

export default ConfigSelector;
