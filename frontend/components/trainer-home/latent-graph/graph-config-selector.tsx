import React from "react";
import { Card, Form, Button } from "react-bootstrap";
import { useGraphConfig } from "./hooks/use-graph-config";
import { useDownloadCsv } from "./hooks/use-latent-space-plots";
import { VaeData } from "./hooks/use-latent-space-plots";

/**
 * ConfigSelector component for configuring graph display options
 * Allows users to set minimum count for data points and download data
 */
type Props = {
  vaeData: VaeData;
};

const GraphConfigSelector: React.FC<Props> = ({ vaeData }) => {
  const { minCount, isValidMinCount, handleMinCountChange } = useGraphConfig();
  const { handleClickSave } = useDownloadCsv(vaeData);

  return (
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
        </Form.Group>
        <Button
          variant="success"
          className="mx-1"
          style={{ cursor: "pointer" }}
          onClick={handleClickSave}
        >
          Download Latent Points
        </Button>
      </Card.Body>
    </Card>
  );
};

export default GraphConfigSelector;
