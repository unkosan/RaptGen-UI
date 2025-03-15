import React from "react";
import { Form } from "react-bootstrap";
import { useGmmParams } from "./hooks/use-gmm-params";

const Forms: React.FC = () => {
  const params = useGmmParams();

  return (
    <>
      <legend>Target VAE model</legend>
      <Form.Group className="mb-3">
        <Form.Label>Model type</Form.Label>
        <Form.Select
          value={params.vaeModel.value}
          onChange={params.vaeModel.handleChange}
        >
          {params.vaeModel.options.map((model, index) => (
            <option key={index} value={model.uuid}>
              {model.name}
            </option>
          ))}
        </Form.Select>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Model name</Form.Label>
        <Form.Control
          type="text"
          placeholder="Please enter the name of the VAE model."
          value={params.gmmName.value}
          onChange={params.gmmName.handleChange}
          isInvalid={!params.gmmName.isValid && !!params.gmmName.value}
        />
      </Form.Group>

      <legend>Parameters</legend>
      <Form.Group className="mb-3">
        <Form.Label>Minimum number of GMM components</Form.Label>
        <Form.Control
          type="number"
          placeholder="Need to be a positive integer"
          value={params.minNumComponents.value}
          onChange={params.minNumComponents.handleChange}
          isInvalid={!params.minNumComponents.isValid}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Maximum number of GMM components</Form.Label>
        <Form.Control
          type="number"
          placeholder="Need to be a positive integer"
          value={params.maxNumComponents.value}
          onChange={params.maxNumComponents.handleChange}
          isInvalid={!params.maxNumComponents.isValid}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Step size of the search</Form.Label>
        <Form.Control
          type="number"
          placeholder="Need to be a positive integer"
          value={params.stepSize.value}
          onChange={params.stepSize.handleChange}
          isInvalid={!params.stepSize.isValid}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Number of trials on each number of components</Form.Label>
        <Form.Control
          type="number"
          placeholder="Need to be a positive integer"
          value={params.numTrials.value}
          onChange={params.numTrials.handleChange}
          isInvalid={!params.numTrials.isValid}
        />
      </Form.Group>
    </>
  );
};

export default Forms;
