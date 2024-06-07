import React, { useEffect, useState } from "react";
import TextForm from "./text-form";
import IntegerForm from "./integer-form";
import BooleanForm from "./boolean-form";
import { useDispatch } from "react-redux";

type Props = {
  setParamsIsValid: React.Dispatch<React.SetStateAction<boolean>>;
};

const OptionalParams: React.FC<Props> = (props) => {
  const [uploadDate, setUploadDate] = useState<string | undefined>(undefined);
  const [tolerance, setTolerance] = useState<number | undefined>(undefined);
  const [minCount, setMinCount] = useState<number | undefined>(undefined);
  const [epochs, setEpochs] = useState<number | undefined>(undefined);
  const [betaDuration, setBetaDuration] = useState<number | undefined>(
    undefined
  );
  const [matchForcingDuration, setMatchForcingDuration] = useState<
    number | undefined
  >(undefined);
  const [matchCost, setMatchCost] = useState<number | undefined>(undefined);
  const [earlyStopDuration, setEarlyStopDuration] = useState<
    number | undefined
  >(undefined);
  const [seedValue, setSeedValue] = useState<number | undefined>(undefined);
  const [numberWorkers, setNumberWorkers] = useState<number | undefined>(
    undefined
  );
  const [pinned, setPinned] = useState<boolean | undefined>(undefined);

  const [isValidDate, setIsValidDate] = useState<boolean>(true);
  const [isValidTolerance, setIsValidTolerance] = useState<boolean>(true);
  const [isValidMinCount, setIsValidMinCount] = useState<boolean>(true);
  const [isValidEpochs, setIsValidEpochs] = useState<boolean>(true);
  const [isValidBetaDuration, setIsValidBetaDuration] = useState<boolean>(true);
  const [isValidMatchForcingDuration, setIsValidMatchForcingDuration] =
    useState<boolean>(true);
  const [isValidMatchCost, setIsValidMatchCost] = useState<boolean>(true);
  const [isValidEarlyStopDuration, setIsValidEarlyStopDuration] =
    useState<boolean>(true);
  const [isValidSeedValue, setIsValidSeedValue] = useState<boolean>(true);
  const [isValidNumberWorkers, setIsValidNumberWorkers] =
    useState<boolean>(true);

  const dispatch = useDispatch();

  useEffect(() => {
    (async () => {
      if (
        isValidDate &&
        isValidTolerance &&
        isValidMinCount &&
        isValidEpochs &&
        isValidBetaDuration &&
        isValidMatchForcingDuration &&
        isValidMatchCost &&
        isValidEarlyStopDuration &&
        isValidSeedValue &&
        isValidNumberWorkers
      ) {
        dispatch({
          type: "vaeConfig/setOptionalParams",
          payload: {
            uploadDate,
            tolerance,
            minCount,
            epochs,
            betaDuration,
            matchForcingDuration,
            matchCost,
            earlyStopDuration,
            seedValue,
            numberWorkers,
            pinned,
          },
        });
        props.setParamsIsValid(true);
      } else {
        props.setParamsIsValid(false);
      }
    })();
  }, [
    isValidDate,
    isValidTolerance,
    isValidMinCount,
    isValidEpochs,
    isValidBetaDuration,
    isValidMatchForcingDuration,
    isValidMatchCost,
    isValidEarlyStopDuration,
    isValidSeedValue,
    isValidNumberWorkers,
    uploadDate,
    tolerance,
    minCount,
    epochs,
    betaDuration,
    matchForcingDuration,
    matchCost,
    earlyStopDuration,
    seedValue,
    numberWorkers,
    pinned,
  ]);

  return (
    <>
      <TextForm
        label="Date of Upload"
        placeholder="YYYY/MM/DD"
        predicate={(value: string) => /^\d{4}\/\d{2}\/\d{2}$/.test(value)}
        value={uploadDate}
        setValue={setUploadDate}
        isValid={isValidDate}
        setIsValid={setIsValidDate}
      />
      <IntegerForm
        label="Filtering Tolerance"
        placeholder="Acceptable margini of length when filtering"
        predicate={(value: number) => value > 0}
        value={tolerance}
        setValue={setTolerance}
        isValid={isValidTolerance}
        setIsValid={setIsValidTolerance}
      />
      <IntegerForm
        label="Minimum Count"
        placeholder="Allowable minimum count of sequences"
        predicate={(value: number) => value > 0}
        value={minCount}
        setValue={setMinCount}
        isValid={isValidMinCount}
        setIsValid={setIsValidMinCount}
      />
      <IntegerForm
        label="Epochs"
        placeholder="Maximum epochs when training"
        predicate={(value: number) => value > 0}
        value={epochs}
        setValue={setEpochs}
        isValid={isValidEpochs}
        setIsValid={setIsValidEpochs}
      />
      <IntegerForm
        label="Beta Weighting Duration"
        placeholder="Duration of epochs with beta weighting"
        predicate={(value: number) => value > 0}
        value={betaDuration}
        setValue={setBetaDuration}
        isValid={isValidBetaDuration}
        setIsValid={setIsValidBetaDuration}
      />
      <IntegerForm
        label="Match Forcing Duration"
        placeholder="Duration of epochs with beta match-forcing"
        predicate={(value: number) => value > 0}
        value={matchForcingDuration}
        setValue={setMatchForcingDuration}
        isValid={isValidMatchForcingDuration}
        setIsValid={setIsValidMatchForcingDuration}
      />
      <IntegerForm
        label="Match Cost"
        placeholder="Cost (or strength) of match-forcing"
        predicate={(value: number) => value > 0}
        value={matchCost}
        setValue={setMatchCost}
        isValid={isValidMatchCost}
        setIsValid={setIsValidMatchCost}
      />
      <IntegerForm
        label="Early Stopping Patience"
        placeholder="Epochs to wait before early stopping"
        predicate={(value: number) => value > 0}
        value={earlyStopDuration}
        setValue={setEarlyStopDuration}
        isValid={isValidEarlyStopDuration}
        setIsValid={setIsValidEarlyStopDuration}
      />
      <IntegerForm
        label="Seed Value"
        placeholder="Random seed value"
        predicate={(value: number) => true}
        value={seedValue}
        setValue={setSeedValue}
        isValid={isValidSeedValue}
        setIsValid={setIsValidSeedValue}
      />
      <IntegerForm
        label="CUDA Number of Workers"
        placeholder="The number of workers to use for pytorch"
        predicate={(value: number) => value > 0}
        value={numberWorkers}
        setValue={setNumberWorkers}
        isValid={isValidNumberWorkers}
        setIsValid={setIsValidNumberWorkers}
      />
      <BooleanForm
        label="CUDA Memory Pinned"
        value={pinned}
        setValue={setPinned}
      />
    </>
  );
};

export default OptionalParams;
