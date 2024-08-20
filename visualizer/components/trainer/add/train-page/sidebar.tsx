import React, { useEffect } from "react";
import IntegerForm from "~/components/uploader/sidebar-vae/optional-params/integer-form";
import { useDispatch } from "react-redux";
import { Button, Form } from "react-bootstrap";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { apiClient } from "~/services/api-client";

const SideBar: React.FC = () => {
  const preprocessConfig = useSelector(
    (state: RootState) => state.preprocessingConfig
  );
  const [reiteration, setReiteration] = React.useState<number | undefined>(1);
  const [modelLength, setModelLength] = React.useState<number | undefined>(
    undefined
  );
  const [epochs, setEpochs] = React.useState<number | undefined>(1000);
  const [matchForcingDuration, setMatchForcingDuration] = React.useState<
    number | undefined
  >(50);
  const [betaDuration, setBetaDuration] = React.useState<number | undefined>(
    50
  );
  const [earlyStopping, setEarlyStopping] = React.useState<number | undefined>(
    50
  );
  const [seedValue, setSeedValue] = React.useState<number | undefined>(
    undefined
  );
  const [matchCost, setMatchCost] = React.useState<number | undefined>(4);

  const [isValidReiteration, setIsValidReiteration] =
    React.useState<boolean>(true);
  const [isValidModelLength, setIsValidModelLength] =
    React.useState<boolean>(true);
  const [isValidEpochs, setIsValidEpochs] = React.useState<boolean>(true);
  const [isValidMatchForcingDuration, setIsValidMatchForcingDuration] =
    React.useState<boolean>(true);
  const [isValidBetaDuration, setIsValidBetaDuration] =
    React.useState<boolean>(true);
  const [isValidEarlyStopping, setIsValidEarlyStopping] =
    React.useState<boolean>(true);
  const [isValidSeedValue, setIsValidSeedValue] = React.useState<boolean>(true);
  const [isValidMatchCost, setIsValidMatchCost] = React.useState<boolean>(true);

  const [deviceList, setDeviceList] = React.useState<string[]>(["cpu"]);
  const [device, setDevice] = React.useState<string>("cpu");

  const dispatch = useDispatch();
  const trainConfig = useSelector((state: RootState) => state.trainConfig);

  useEffect(() => {
    if (
      preprocessConfig.forwardAdapter !== undefined &&
      preprocessConfig.targetLength !== undefined &&
      preprocessConfig.reverseAdapter !== undefined
    ) {
      setModelLength(
        preprocessConfig.targetLength -
          preprocessConfig.forwardAdapter.length -
          preprocessConfig.reverseAdapter.length
      );
    }
  }, [preprocessConfig]);

  useEffect(() => {
    // const response = ["cpu", "cuda:0", "cuda:1"];
    (async () => {
      const data = await apiClient.getDevices();
      console.log("getDevices", data);
      const devices = data ?? "cpu";
      setDeviceList(devices);
    })();
  }, []);

  useEffect(() => {
    setDevice(deviceList[0] ?? "cpu");
  }, [deviceList]);

  useEffect(() => {
    const isAllValid = [
      isValidReiteration,
      isValidModelLength,
      isValidEpochs,
      isValidMatchForcingDuration,
      isValidBetaDuration,
      isValidEarlyStopping,
      isValidSeedValue,
      isValidMatchCost,
      reiteration !== undefined,
      modelLength !== undefined,
      epochs !== undefined,
      matchForcingDuration !== undefined,
      betaDuration !== undefined,
      earlyStopping !== undefined,
      seedValue !== undefined,
      matchCost !== undefined,
    ].every((isValid) => isValid);

    if (isAllValid) {
      dispatch({
        type: "trainConfig/set",
        payload: {
          ...trainConfig,
          isValidParams: true,
          reiteration: reiteration,
          modelLength: modelLength,
          epochs: epochs,
          forceMatchEpochs: matchForcingDuration,
          betaScheduleEpochs: betaDuration,
          earlyStoppingEpochs: earlyStopping,
          seed: seedValue,
          matchCost: matchCost,
          device: device,
        },
      });
    } else {
      dispatch({
        type: "trainConfig/set",
        payload: {
          ...trainConfig,
          isValidParams: false,
        },
      });
    }
  }, [
    isValidReiteration,
    isValidModelLength,
    isValidEpochs,
    isValidMatchForcingDuration,
    isValidBetaDuration,
    isValidEarlyStopping,
    isValidSeedValue,
    isValidMatchCost,
    reiteration,
    modelLength,
    epochs,
    matchForcingDuration,
    betaDuration,
    earlyStopping,
    seedValue,
    matchCost,
    device,
  ]);

  return (
    <div>
      <legend>Training Parameters</legend>
      <IntegerForm
        label="Reiteration of Training"
        placeholder="The number of reiteration of training"
        predicate={(value: number) => value > 0}
        value={reiteration}
        setValue={setReiteration}
        isValid={isValidReiteration}
        setIsValid={setIsValidReiteration}
      />
      <Form.Group className="mb-3">
        <Form.Label>Device</Form.Label>
        <Form.Select
          value={device}
          onChange={(e) => {
            setDevice(e.target.value);
          }}
        >
          {deviceList.map((device) => (
            <option key={device} value={device}>
              {device}
            </option>
          ))}
        </Form.Select>
      </Form.Group>
      <IntegerForm
        label="Seed Value"
        placeholder="An integer value for random seed"
        predicate={(value: number) => value > 0}
        value={seedValue}
        setValue={setSeedValue}
        isValid={isValidSeedValue}
        setIsValid={setIsValidSeedValue}
      />
      <hr />
      <IntegerForm
        label="Maximum Number of Epochs"
        placeholder="The maxium number of epochs to train for"
        predicate={(value: number) => value > 0}
        value={epochs}
        setValue={setEpochs}
        isValid={isValidEpochs}
        setIsValid={setIsValidEpochs}
      />
      <IntegerForm
        label="Early Stopping Patience"
        placeholder="The number of epochs to wait before early stopping"
        predicate={(value: number) => value > 0}
        value={earlyStopping}
        setValue={setEarlyStopping}
        isValid={isValidEarlyStopping}
        setIsValid={setIsValidEarlyStopping}
      />
      <IntegerForm
        label="Beta Weighting Epochs"
        placeholder="The number of epochs under beta weighting"
        predicate={(value: number) => value > 0}
        value={betaDuration}
        setValue={setBetaDuration}
        isValid={isValidBetaDuration}
        setIsValid={setIsValidBetaDuration}
      />
      <div className="mb-3 text-muted">
        Reconstruction terms are weighted by beta, which is linearly increased
        from 0 to 1, in the first beta epochs.
      </div>
      <IntegerForm
        label="Force Matching Epochs"
        placeholder="The number of epochs under match forcing"
        predicate={(value: number) => value > 0}
        value={matchForcingDuration}
        setValue={setMatchForcingDuration}
        isValid={isValidMatchForcingDuration}
        setIsValid={setIsValidMatchForcingDuration}
      />
      <div className="mb-3 text-muted">
        The match forcing term is added to the loss function during the first n
        epochs specified by this parameter. In these epochs, objective function
        includes the sum of transitional probabilities of &apos;match&apos; to
        &apos;match&apos; states throughout the pHMM model, then tries to
        maximize the value.
      </div>
      <IntegerForm
        label="Match Cost"
        placeholder="The cost of match forcing"
        predicate={(value: number) => value > 0}
        value={matchCost}
        setValue={setMatchCost}
        isValid={isValidMatchCost}
        setIsValid={setIsValidMatchCost}
      />
      <div className="mb-3 text-muted">
        The match cost is the cost of the match forcing term. The higher the
        value, the more the model tries to maximize the sum of transitional
        probabilities of &apos;match&apos; to &apos;match&apos; states.
      </div>
      <IntegerForm
        label="pHMM Model Length"
        placeholder="The length of matching states on the pHMM model"
        predicate={(value: number) => value > 0}
        value={modelLength}
        setValue={setModelLength}
        isValid={isValidModelLength}
        setIsValid={setIsValidModelLength}
      />
      <div className="mb-3 text-muted">
        This value is the length of the matching states on the pHMM model.
        Default value equals to the random region length.
      </div>
    </div>
  );
};

export default SideBar;
