import React from "react";
import { Form } from "react-bootstrap";
import SelectVAE from "./select-VAE";
import SelectGMM from "./select-GMM";

const ModelSelector: React.FC = () => {
  return (
    <Form>
      <Form.Group className="mb-3">
        <Form.Label>Selected VAE Model</Form.Label>
        <SelectVAE />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Uploaded GMM Model</Form.Label>
        <SelectGMM />
      </Form.Group>
    </Form>
  );
};

export default ModelSelector;
