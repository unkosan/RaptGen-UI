import { useState, useEffect, ChangeEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { setTrainConfig } from "../../redux/train-config";
import { apiClient } from "~/services/api-client";

// Type for a numeric parameter with validation
export interface NumericParameter {
  value: number;
  setValue: (value: number) => void;
  isValid: boolean;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

// Type for all train parameters
export interface TrainParameters {
  device: {
    value: string;
    options: string[];
    handleChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  };
  reiteration: NumericParameter;
  seedValue: NumericParameter & {
    generateRandom: () => void;
  };
  epochs: NumericParameter;
  earlyStopping: NumericParameter;
  betaDuration: NumericParameter;
  matchForcingDuration: NumericParameter;
  matchCost: NumericParameter;
  modelLength: NumericParameter;
}

/**
 * Hook for managing a numeric parameter with validation and Redux dispatch
 */
const useNumericParameter = (
  initialValue: number,
  validationFn: (value: number) => boolean,
  fieldName: string,
  trainConfig: any,
  dispatch: any
): NumericParameter => {
  const [value, setValue] = useState<number>(initialValue);
  const isValid = validationFn(value);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    setValue(newValue);
    dispatch(setTrainConfig({ ...trainConfig, [fieldName]: newValue }));
  };

  return {
    value,
    setValue: (newValue: number) => {
      setValue(newValue);
    },
    isValid,
    handleChange,
  };
};

/**
 * Hook for handling the device selection
 */
export const useDeviceSelection = () => {
  const trainConfig = useSelector((state: RootState) => state.trainConfig);
  const dispatch = useDispatch();
  const [device, setDevice] = useState<string>(trainConfig.device || "cpu");
  const [deviceList, setDeviceList] = useState(["cpu"]);

  useEffect(() => {
    apiClient.getDevices().then(setDeviceList);
  }, []);

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    setDevice(newValue);
    dispatch(setTrainConfig({ ...trainConfig, device: newValue }));
  };

  return {
    value: device,
    options: deviceList,
    handleChange,
  };
};

/**
 * Hook for handling the model length calculation based on preprocessing config
 */
export const useModelLengthEffect = (modelLength: NumericParameter) => {
  const preprocessConfig = useSelector(
    (state: RootState) => state.preprocessingConfig
  );
  const trainConfig = useSelector((state: RootState) => state.trainConfig);
  const dispatch = useDispatch();

  useEffect(() => {
    if (preprocessConfig.isValidParams) {
      const calculatedLength =
        preprocessConfig.targetLength -
        preprocessConfig.forwardAdapter.length -
        preprocessConfig.reverseAdapter.length;

      modelLength.setValue(calculatedLength);
      dispatch(
        setTrainConfig({ ...trainConfig, modelLength: calculatedLength })
      );
    }
  }, [preprocessConfig]);
};

/**
 * Main hook for all train parameters
 */
export const useTrainParameters = (): TrainParameters => {
  const trainConfig = useSelector((state: RootState) => state.trainConfig);
  const dispatch = useDispatch();

  // Device selection
  const device = useDeviceSelection();

  // Numeric parameters with validation
  const reiteration = useNumericParameter(
    trainConfig.reiteration,
    (value: number) => value > 0,
    "reiteration",
    trainConfig,
    dispatch
  );

  const seedValue = {
    ...useNumericParameter(
      trainConfig.seed,
      (value: number) => value >= 0,
      "seed",
      trainConfig,
      dispatch
    ),
    generateRandom: () => {
      const randomValue = Math.floor(Math.random() * 1000000);
      dispatch(setTrainConfig({ ...trainConfig, seed: randomValue }));
      seedValue.setValue(randomValue);
    },
  };

  const epochs = useNumericParameter(
    trainConfig.epochs,
    (value: number) => value > 0,
    "epochs",
    trainConfig,
    dispatch
  );

  const earlyStopping = useNumericParameter(
    trainConfig.earlyStoppingEpochs,
    (value: number) => value > 0,
    "earlyStoppingEpochs",
    trainConfig,
    dispatch
  );

  const betaDuration = useNumericParameter(
    trainConfig.betaScheduleEpochs,
    (value: number) => value > 0,
    "betaScheduleEpochs",
    trainConfig,
    dispatch
  );

  const matchForcingDuration = useNumericParameter(
    trainConfig.forceMatchEpochs,
    (value: number) => value > 0,
    "forceMatchEpochs",
    trainConfig,
    dispatch
  );

  const matchCost = useNumericParameter(
    trainConfig.matchCost,
    (value: number) => value >= 0,
    "matchCost",
    trainConfig,
    dispatch
  );

  const modelLength = useNumericParameter(
    trainConfig.modelLength,
    (value: number) => value > 0,
    "modelLength",
    trainConfig,
    dispatch
  );

  // Apply the effect for model length calculation
  useModelLengthEffect(modelLength);

  return {
    device,
    reiteration,
    seedValue,
    epochs,
    earlyStopping,
    betaDuration,
    matchForcingDuration,
    matchCost,
    modelLength,
  };
};
