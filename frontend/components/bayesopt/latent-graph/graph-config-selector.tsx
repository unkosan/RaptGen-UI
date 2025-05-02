import React from "react";
import { Card, Form } from "react-bootstrap";
import { useGraphConfig } from "./hooks/use-graph-config";

const GraphConfigSelector: React.FC = () => {
  const {
    minCount,
    showSelex,
    showContour,
    showTitle,
    isValidMinCount,
    handleMinCountChange,
    handleChangeShowSelex,
    handleChangeShowContour,
    handleChangeShowTitle,
  } = useGraphConfig();

  return (
    <>
      <Card className="mb-3">
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>Minimum count</Form.Label>
            <Form.Control
              type="number"
              value={minCount}
              onChange={handleMinCountChange}
              isInvalid={!isValidMinCount}
            />
            {!isValidMinCount && (
              <Form.Control.Feedback type="invalid">
                Please enter a valid positive number
              </Form.Control.Feedback>
            )}
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Switch
              label="Show SELEX dataset"
              checked={showSelex}
              onChange={handleChangeShowSelex}
            />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Switch
              label="Show contour plot"
              checked={showContour}
              onChange={handleChangeShowContour}
            />
          </Form.Group>
          <Form.Group className="">
            <Form.Switch
            label="Show title"
            checked={showTitle}
            onChange={handleChangeShowTitle}
            />
          </Form.Group>
        </Card.Body>
      </Card>
    </>
  );
};

export default GraphConfigSelector;
