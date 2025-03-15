import React from "react";
import { Card, Form } from "react-bootstrap";
import { useGraphConfig } from "./hooks/use-graph-config";

/**
 * ConfigSelector component for configuring graph display options
 * Allows users to set minimum count for SELEX data points and toggle GMM visibility
 */
const GraphConfigSelector: React.FC = () => {
  const {
    showGMM,
    minCount,
    isValidMinCount,
    handleMinCountChange,
    handleShowGMMChange,
  } = useGraphConfig();

  return (
    <Card className="mb-3">
      <Card.Body>
        <Form.Group className="mb-3">
          <Form.Label>Minimum Count</Form.Label>
          <Form.Control
            type="number"
            value={minCount}
            onChange={handleMinCountChange}
            isInvalid={!isValidMinCount}
          />
        </Form.Group>
        <Form.Group className="">
          <Form.Switch
            label="Show GMM"
            checked={showGMM}
            onChange={handleShowGMMChange}
          />
        </Form.Group>
      </Card.Body>
    </Card>
  );
};

export default GraphConfigSelector;
