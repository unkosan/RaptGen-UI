import React from "react";
import {
  Form,
  InputGroup,
  Button,
  Spinner,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { usePreprocessingParams } from "./hooks/use-preprocessing-params";

const PreprocessingForms: React.FC = () => {
  const params = usePreprocessingParams();

  return (
    <>
      <legend>Model Type</legend>

      <Form.Group className="mb-3">
        <Form.Select
          value={params.modelType.value}
          isInvalid={false}
          onChange={params.modelType.handleChange}
        >
          {params.modelType.options.map((modelType) => (
            <option key={modelType}>{modelType}</option>
          ))}
        </Form.Select>
      </Form.Group>

      <legend>Experiment Name</legend>

      <Form.Group className="mb-3">
        <Form.Control
          type="text"
          placeholder="Please enter the name of the experiment."
          value={params.experimentName.value}
          onChange={params.experimentName.handleChange}
          isInvalid={
            !params.experimentName.isValid && !!params.experimentName.value
          }
        />
      </Form.Group>

      <legend>Preprocessing Parameters</legend>

      <Form.Group className="mb-3">
        <Form.Label>Target Length</Form.Label>
        <InputGroup>
          <Form.Control
            type="number"
            placeholder="Positive integers only"
            value={params.targetLength.value}
            isInvalid={
              !params.targetLength.isValid && !!params.targetLength.value
            }
            onChange={params.targetLength.handleChange}
          />
          <Button
            variant="outline-primary"
            disabled={
              params.targetLength.isEstimating ||
              params.fullSequences.length === 0
            }
            onClick={params.targetLength.estimate}
          >
            {params.targetLength.isEstimating ? (
              <Spinner animation="border" size="sm" />
            ) : (
              "Estimate"
            )}
          </Button>
        </InputGroup>
        <Form.Text className="text-muted">
          This value is used to filter out sequences which lengths are not
          within the target. Adapters are included in the length calculation.
        </Form.Text>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Adapters</Form.Label>
        <InputGroup>
          <Form.Control
            type="text"
            placeholder="Forward adapter"
            value={params.adapters.forwardAdapter.value}
            isInvalid={!params.adapters.forwardAdapter.isValid}
            onChange={params.adapters.forwardAdapter.handleChange}
          />
          <Form.Control
            type="text"
            placeholder="Reverse adapter"
            value={params.adapters.reverseAdapter.value}
            isInvalid={!params.adapters.reverseAdapter.isValid}
            onChange={params.adapters.reverseAdapter.handleChange}
          />
          <OverlayTrigger
            placement="top"
            overlay={
              <Tooltip id="tooltip-estimate-adapters">
                You need to fill in the target length first to estimate
                adapters.
              </Tooltip>
            }
            show={!params.targetLength.isValid ? undefined : false}
          >
            <Button
              variant="outline-primary"
              onClick={params.adapters.estimate}
              disabled={params.adapters.isEstimateDisabled}
            >
              {params.adapters.isEstimating ? (
                <Spinner animation="border" size="sm" />
              ) : (
                "Estimate"
              )}
            </Button>
          </OverlayTrigger>
        </InputGroup>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Filtering Tolerance</Form.Label>
        <Form.Control
          type="number"
          placeholder="Allows a not-negative integer"
          value={params.tolerance.value}
          isInvalid={!params.tolerance.isValid}
          onChange={params.tolerance.handleChange}
        />
        <Form.Text className="text-muted">
          Tolerance means the allowed maximum difference between the target
          length and that of the sequences.
        </Form.Text>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Minimum Count</Form.Label>
        <Form.Control
          type="number"
          placeholder="Allows a positive integer"
          value={params.minCount.value}
          isInvalid={!params.minCount.isValid}
          onChange={params.minCount.handleChange}
        />
        <Form.Text className="text-muted">
          Minimum count is the minimum number of duplicates that are required to
          pass the filtering.
        </Form.Text>
      </Form.Group>
    </>
  );
};

export default PreprocessingForms;
