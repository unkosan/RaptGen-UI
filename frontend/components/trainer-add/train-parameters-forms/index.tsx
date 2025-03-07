import React from "react";
import { Form, InputGroup, Button } from "react-bootstrap";
import { useTrainParameters } from "./hooks/use-train-parameters";

const TrainParametersForms: React.FC = () => {
  const params = useTrainParameters();

  return (
    <div>
      <legend>Training Parameters</legend>

      <Form.Group className="mb-3">
        <Form.Label>Device</Form.Label>
        <Form.Select
          value={params.device.value}
          onChange={params.device.handleChange}
        >
          {params.device.options.map((device) => (
            <option key={device} value={device}>
              {device}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Reiteration of Training</Form.Label>
        <Form.Control
          type="number"
          placeholder="The number of reiteration of training"
          value={params.reiteration.value}
          onChange={params.reiteration.handleChange}
          isInvalid={!params.reiteration.isValid}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Seed Value</Form.Label>
        <InputGroup>
          <Form.Control
            type="number"
            placeholder="An integer value for random seed"
            value={params.seedValue.value}
            onChange={params.seedValue.handleChange}
            isInvalid={!params.seedValue.isValid}
          />
          <Button
            variant="outline-primary"
            onClick={params.seedValue.generateRandom}
          >
            Generate Random Value
          </Button>
        </InputGroup>
        <Form.Text className="text-muted">
          This is used to initialize the random number generator. If you want to
          reproduce the same result, set the same seed.
        </Form.Text>
      </Form.Group>

      <hr />

      <Form.Group className="mb-3">
        <Form.Label>Maximum Number of Epochs</Form.Label>
        <Form.Control
          type="number"
          placeholder="The maxium number of epochs to train for"
          value={params.epochs.value}
          onChange={params.epochs.handleChange}
          isInvalid={!params.epochs.isValid}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Early Stopping Patience</Form.Label>
        <Form.Control
          type="number"
          placeholder="The number of epochs to wait before early stopping"
          value={params.earlyStopping.value}
          onChange={params.earlyStopping.handleChange}
          isInvalid={!params.earlyStopping.isValid}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Beta Weighting Epochs</Form.Label>
        <Form.Control
          type="number"
          placeholder="The number of epochs under beta weighting"
          value={params.betaDuration.value}
          onChange={params.betaDuration.handleChange}
          isInvalid={!params.betaDuration.isValid}
        />
        <Form.Text className="text-muted">
          Reconstruction terms are weighted by beta, which is linearly increased
          from 0 to 1, in the first beta epochs.
        </Form.Text>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Force Matching Epochs</Form.Label>
        <Form.Control
          type="number"
          placeholder="The number of epochs under match forcing"
          value={params.matchForcingDuration.value}
          onChange={params.matchForcingDuration.handleChange}
          isInvalid={!params.matchForcingDuration.isValid}
        />
        <Form.Text className="text-muted">
          The match forcing term is added to the loss function during the first
          n epochs specified by this parameter. In these epochs, objective
          function includes the sum of transitional probabilities of
          &apos;match&apos; to &apos;match&apos; states throughout the pHMM
          model, then tries to maximize the value.
        </Form.Text>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Match Cost</Form.Label>
        <Form.Control
          type="number"
          placeholder="The cost of match forcing"
          value={params.matchCost.value}
          onChange={params.matchCost.handleChange}
          isInvalid={!params.matchCost.isValid}
        />
        <Form.Text className="text-muted">
          The match cost is the cost of the match forcing term. The higher the
          value, the more the model tries to maximize the sum of transitional
          probabilities of &apos;match&apos; to &apos;match&apos; states.
        </Form.Text>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>pHMM Model Length</Form.Label>
        <Form.Control
          type="number"
          placeholder="The length of matching states on the pHMM model"
          value={params.modelLength.value}
          onChange={params.modelLength.handleChange}
          isInvalid={!params.modelLength.isValid}
        />
        <Form.Text className="text-muted">
          This value is the length of the matching states on the pHMM model.
          Default value equals to the random region length.
        </Form.Text>
      </Form.Group>
    </div>
  );
};

export default TrainParametersForms;
