import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Form, InputGroup } from "react-bootstrap";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { apiClient } from "~/services/api-client";
import { setTrainConfig } from "../redux/train-config";
import { Button } from "react-bootstrap";
import { useAsyncMemo, useStateWithPredicate } from "~/hooks/common";

const SideBar: React.FC = () => {
  const preprocessConfig = useSelector(
    (state: RootState) => state.preprocessingConfig
  );
  const trainConfig = useSelector((state: RootState) => state.trainConfig);

  const [reiteration, setReiteration, isValidReiteration] =
    useStateWithPredicate(
      trainConfig.reiteration,
      (value: number) => value > 0
    );
  const [device, setDevice] = useState<string>("cpu");
  const [modelLength, setModelLength, isValidModelLength] =
    useStateWithPredicate(
      trainConfig.modelLength,
      (value: number) => value > 0
    );
  const [epochs, setEpochs, isValidEpochs] = useStateWithPredicate(
    trainConfig.epochs,
    (value: number) => value > 0
  );
  const [
    matchForcingDuration,
    setMatchForcingDuration,
    isValidMatchForcingDuration,
  ] = useStateWithPredicate(
    trainConfig.forceMatchEpochs,
    (value: number) => value > 0
  );
  const [betaDuration, setBetaDuration, isValidBetaDuration] =
    useStateWithPredicate(
      trainConfig.betaScheduleEpochs,
      (value: number) => value > 0
    );
  const [earlyStopping, setEarlyStopping, isValidEarlyStopping] =
    useStateWithPredicate(
      trainConfig.earlyStoppingEpochs,
      (value: number) => value > 0
    );
  const [seedValue, setSeedValue, isValidSeedValue] = useStateWithPredicate(
    trainConfig.seed,
    (value: number) => value >= 0
  );
  const [matchCost, setMatchCost, isValidMatchCost] = useStateWithPredicate(
    trainConfig.matchCost,
    (value: number) => value >= 0
  );

  const deviceList = useAsyncMemo(() => apiClient.getDevices(), [], ["cpu"]);

  const dispatch = useDispatch();

  useEffect(() => {
    if (preprocessConfig.isValidParams) {
      setModelLength(
        preprocessConfig.targetLength -
          preprocessConfig.forwardAdapter.length -
          preprocessConfig.reverseAdapter.length
      );
      dispatch(setTrainConfig({ ...trainConfig, modelLength: modelLength }));
    }
  }, [preprocessConfig]);

  return (
    <div>
      <legend>Training Parameters</legend>

      <Form.Group className="mb-3">
        <Form.Label>Device</Form.Label>
        <Form.Select
          value={device}
          onChange={(e) => {
            setDevice(e.target.value);
            dispatch(
              setTrainConfig({ ...trainConfig, device: e.target.value })
            );
          }}
        >
          {deviceList.map((device) => (
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
          value={reiteration}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            setReiteration(value);
            dispatch(setTrainConfig({ ...trainConfig, reiteration: value }));
          }}
          isInvalid={!isValidReiteration}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Seed Value</Form.Label>
        <InputGroup>
          <Form.Control
            type="number"
            placeholder="An integer value for random seed"
            value={seedValue}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              setSeedValue(value);
              dispatch(setTrainConfig({ ...trainConfig, seed: value }));
            }}
            isInvalid={!isValidSeedValue}
          />
          <Button
            variant="outline-primary"
            onClick={() => {
              const value = Math.floor(Math.random() * 1000000);
              setSeedValue(value);
              dispatch(setTrainConfig({ ...trainConfig, seed: value }));
            }}
          >
            Random
          </Button>
        </InputGroup>
        <Form.Text className="text-muted">
          The seed value is used to initialize the random number generator. If
          you want to reproduce the same result, set the seed.
        </Form.Text>
      </Form.Group>

      <hr />

      <Form.Group className="mb-3">
        <Form.Label>Maximum Number of Epochs</Form.Label>
        <Form.Control
          type="number"
          placeholder="The maxium number of epochs to train for"
          value={epochs}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            setEpochs(value);
            dispatch(setTrainConfig({ ...trainConfig, epochs: value }));
          }}
          isInvalid={!isValidEpochs}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Early Stopping Patience</Form.Label>
        <Form.Control
          type="number"
          placeholder="The number of epochs to wait before early stopping"
          value={earlyStopping}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            setEarlyStopping(value);
            dispatch(
              setTrainConfig({ ...trainConfig, earlyStoppingEpochs: value })
            );
          }}
          isInvalid={!isValidEarlyStopping}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Beta Weighting Epochs</Form.Label>
        <Form.Control
          type="number"
          placeholder="The number of epochs under beta weighting"
          value={betaDuration}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            setBetaDuration(value);
            dispatch(
              setTrainConfig({ ...trainConfig, betaScheduleEpochs: value })
            );
          }}
          isInvalid={!isValidBetaDuration}
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
          value={matchForcingDuration}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            setMatchForcingDuration(value);
            dispatch(
              setTrainConfig({ ...trainConfig, forceMatchEpochs: value })
            );
          }}
          isInvalid={!isValidMatchForcingDuration}
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
          value={matchCost}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            setMatchCost(value);
            dispatch(setTrainConfig({ ...trainConfig, matchCost: value }));
          }}
          isInvalid={!isValidMatchCost}
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
          value={modelLength}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            setModelLength(value);
            dispatch(setTrainConfig({ ...trainConfig, modelLength: value }));
          }}
          isInvalid={!isValidModelLength}
        />
        <Form.Text className="text-muted">
          This value is the length of the matching states on the pHMM model.
          Default value equals to the random region length.
        </Form.Text>
      </Form.Group>
    </div>
  );
};

export default SideBar;
