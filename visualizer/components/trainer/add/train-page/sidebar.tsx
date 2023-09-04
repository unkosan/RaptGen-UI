import React, { useEffect } from "react";
import IntegerForm from "../../../uploader/sidebar-vae/optional-params/integer-form";
import { useDispatch } from "react-redux";
import { Button, Form } from "react-bootstrap";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { apiClient } from "../../../../services/api-client";

const SideBar: React.FC = () => {
  const [reiteration, setReiteration] = React.useState<number | undefined>(
    undefined
  );
  const [modelLength, setModelLength] = React.useState<number | undefined>(
    undefined
  );
  const [epochs, setEpochs] = React.useState<number | undefined>(undefined);
  const [matchForcingDuration, setMatchForcingDuration] = React.useState<
    number | undefined
  >(undefined);
  const [betaDuration, setBetaDuration] = React.useState<number | undefined>(
    undefined
  );
  const [earlyStopping, setEarlyStopping] = React.useState<number | undefined>(
    undefined
  );
  const [seedValue, setSeedValue] = React.useState<number | undefined>(
    undefined
  );
  const [matchCost, setMatchCost] = React.useState<number | undefined>(
    undefined
  );

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
    // const response = ["cpu", "cuda:0", "cuda:1"];
    (async () => {
      const data = await apiClient.getDevices();
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
          matchForcingDuration: matchForcingDuration,
          betaDuration: betaDuration,
          earlyStopping: earlyStopping,
          seedValue: seedValue,
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
        placeholder="The model with lowest ELBO is selected"
        predicate={(value: number) => value > 0}
        value={reiteration}
        setValue={setReiteration}
        isValid={isValidReiteration}
        setIsValid={setIsValidReiteration}
      />
      <IntegerForm
        label="pHMM Model Length"
        placeholder="The length of matching states on the pHMM model"
        predicate={(value: number) => value > 0}
        value={modelLength}
        setValue={setModelLength}
        isValid={isValidModelLength}
        setIsValid={setIsValidModelLength}
      />
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
        label="Beta Weighting Epochs"
        placeholder="The number of epochs under beta weighting"
        predicate={(value: number) => value > 0}
        value={betaDuration}
        setValue={setBetaDuration}
        isValid={isValidBetaDuration}
        setIsValid={setIsValidBetaDuration}
      />
      <IntegerForm
        label="Force Matching Epochs"
        placeholder="The number of epochs under match forcing"
        predicate={(value: number) => value > 0}
        value={matchForcingDuration}
        setValue={setMatchForcingDuration}
        isValid={isValidMatchForcingDuration}
        setIsValid={setIsValidMatchForcingDuration}
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
        label="Seed Value"
        placeholder="An integer value for random seed"
        predicate={(value: number) => value > 0}
        value={seedValue}
        setValue={setSeedValue}
        isValid={isValidSeedValue}
        setIsValid={setIsValidSeedValue}
      />
      <IntegerForm
        label="Match Cost"
        placeholder="The cost of match forcing"
        predicate={(value: number) => value > 0}
        value={matchCost}
        setValue={setMatchCost}
        isValid={isValidMatchCost}
        setIsValid={setIsValidMatchCost}
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
    </div>
  );
};

export default SideBar;
