import React from "react";
import { Card, Form } from "react-bootstrap";
import { useGraphConfig } from "./hooks/use-graph-config";

/**
 * GraphConfigSelector component for configuring graph display options
 * Allows users to set minimum count for data points
 */
const GraphConfigSelector: React.FC = () => {
  const { minCount, isValidMinCount, onMinCountChange } = useGraphConfig();

  return (
    <Card className="mb-3">
      <Card.Body>
        <Form.Group className="">
          <Form.Label>Minimum count</Form.Label>
          <Form.Control
            type="number"
            value={minCount}
            onChange={onMinCountChange}
            isInvalid={!isValidMinCount}
          />
        </Form.Group>
      </Card.Body>
    </Card>
  );
};

export default GraphConfigSelector;
