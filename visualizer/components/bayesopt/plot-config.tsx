import { useState } from "react";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { RootState } from "./redux/store";
import { Card, Form } from "react-bootstrap";

export const PlotConfig: React.FC = () => {
  const [minCount, setMinCount] = useState(1);
  const [showSelex, setShowSelex] = useState(true);

  const dispatch = useDispatch();
  const graphConfig = useSelector((state: RootState) => state.graphConfig);

  const setDirty = () => {
    dispatch({
      type: "isDirty/set",
      payload: true,
    });
  };

  const onMinCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDirty();
    setMinCount(parseInt(e.currentTarget.value));

    if (isNaN(parseInt(e.currentTarget.value))) {
      return;
    }

    try {
      dispatch({
        type: "graphConfig/set",
        payload: {
          ...graphConfig,
          minCount: parseInt(e.currentTarget.value),
        },
      });
    } catch (e) {
      console.error(e);
      return;
    }
  };

  const onShowSelexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDirty();
    setShowSelex(e.currentTarget.checked);

    try {
      dispatch({
        type: "graphConfig/set",
        payload: {
          ...graphConfig,
          showSelex: e.currentTarget.checked,
        },
      });
    } catch (e) {
      console.error(e);
      return;
    }
  };

  const onChangeShowContour = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDirty();
    dispatch({
      type: "graphConfig/set",
      payload: {
        ...graphConfig,
        showAcquisition: e.target.checked,
      },
    });
  };

  return (
    <>
      <Card className="mb-3">
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>Minimum count</Form.Label>
            <Form.Control
              type="number"
              value={minCount}
              onChange={onMinCountChange}
            />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Switch
              label="Show SELEX dataset"
              checked={showSelex}
              onChange={onShowSelexChange}
            />
          </Form.Group>
          <Form.Group>
            <Form.Switch
              onChange={onChangeShowContour}
              checked={graphConfig.showAcquisition}
              label="Show contour plot"
            />
          </Form.Group>
        </Card.Body>
      </Card>
    </>
  );
};

export default PlotConfig;
