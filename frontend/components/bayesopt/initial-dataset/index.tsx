import React from "react";
import { Badge, InputGroup, Spinner, Tooltip } from "react-bootstrap";
import { Button, Form, OverlayTrigger } from "react-bootstrap";
import { useCsvDataset } from "./hooks/use-csv-dataset";
import { useGmmDataset } from "./hooks/use-gmm-dataset";

/**
 * InitialDataset component
 * Provides options to load initial dataset from CSV or GMM models
 * Uses separate hooks for CSV and GMM functionality
 */
const InitialDataset: React.FC = () => {
  // CSV dataset handling
  const {
    isLoading: csvLoading,
    isValid: csvValid,
    handleFileChange,
  } = useCsvDataset();

  // GMM dataset handling
  const {
    gmmModels,
    selectedModel,
    setSelectedModel,
    isLoading: gmmLoading,
    handleClickApplyGMM,
  } = useGmmDataset();

  return (
    <>
      {/* CSV Upload Section */}
      <Form.Group className="mb-3">
        <Form.Label>
          Upload manually curated csv dataset
          <OverlayTrigger
            overlay={
              <Tooltip>
                <div className="text-start">
                  Upload csv file with headers. The header must contain
                  <code>&apos;random_region&apos;</code> and{" "}
                  <code>&apos;seq_id&apos;</code>
                  field.
                  <br />
                  if <code>&apos;coord_x&apos;</code> or{" "}
                  <code>&apos;coord_y&apos;</code> field is included, it will be
                  removed from the uploaded file to avoid duplication.
                </div>
              </Tooltip>
            }
          >
            <span className="ms-1">
              <Badge pill bg="secondary">
                ?
              </Badge>
            </span>
          </OverlayTrigger>
        </Form.Label>
        {csvLoading ? (
          <InputGroup>
            <InputGroup.Text className="w-100">
              <div className="d-flex align-items-center">
                <Spinner animation="border" size="sm" className="me-2" />
                Loading...
              </div>
            </InputGroup.Text>
          </InputGroup>
        ) : (
          <Form.Control
            type="file"
            onChange={handleFileChange}
            isInvalid={!csvValid}
          />
        )}
      </Form.Group>

      {/* GMM Model Section */}
      <Form.Group className="mb-3">
        <Form.Label>
          Auto-generate from registered GMM centers
          <OverlayTrigger
            overlay={
              <Tooltip>
                <div className="text-start">
                  Decode sequences from GMM centers and reembed them for initial
                  dataset. If a decoded sequence has <code>&apos;N&apos;</code>{" "}
                  token, it will be removed and then reembedded.
                </div>
              </Tooltip>
            }
          >
            <span className="ms-1">
              <Badge pill bg="secondary">
                ?
              </Badge>
            </span>
          </OverlayTrigger>
        </Form.Label>
        <InputGroup>
          <Form.Control
            as="select"
            onChange={(e) => {
              setSelectedModel(e.target.value);
            }}
            value={selectedModel}
          >
            {gmmModels.map((model, i) => (
              <option key={i} value={model.uuid}>
                {model.name}
              </option>
            ))}
          </Form.Control>
          <Button
            variant="outline-primary"
            onClick={handleClickApplyGMM}
            disabled={gmmLoading}
          >
            {gmmLoading ? <Spinner animation="border" size="sm" /> : "Load"}
          </Button>
        </InputGroup>
      </Form.Group>
    </>
  );
};

export default InitialDataset;
