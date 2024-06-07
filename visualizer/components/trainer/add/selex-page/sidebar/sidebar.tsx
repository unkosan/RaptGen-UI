import React, { useEffect } from "react";
import ModelTypeSelect from "./model-type-select";
import TextForm from "~/components/uploader/sidebar-vae/optional-params/text-form";
import IntegerForm from "~/components/uploader/sidebar-vae/optional-params/integer-form";
import FormForward from "./form-forward";
import FormReverse from "./form-reverse";
import FormTargetLength from "./form-target-length";
import { useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { useSelector } from "react-redux";

const SideBar: React.FC = () => {
  const [experimentName, setExperimentName] = React.useState<
    string | undefined
  >(undefined);
  const [forwardAdapter, setForwardAdapter] = React.useState<string>("");
  const [reverseAdapter, setReverseAdapter] = React.useState<string>("");
  const [targetLength, setTargetLength] = React.useState<number>(NaN);
  const [tolerance, setTolerance] = React.useState<number | undefined>(
    undefined
  );
  const [minCount, setMinCount] = React.useState<number | undefined>(undefined);

  const [isValidExperimentName, setIsValidExperimentName] =
    React.useState<boolean>(false);
  const [isValidForwardAdapter, setIsValidForwardAdapter] =
    React.useState<boolean>(true);
  const [isValidReverseAdapter, setIsValidReverseAdapter] =
    React.useState<boolean>(true);
  const [isValidTargetLength, setIsValidTargetLength] =
    React.useState<boolean>(false);
  const [isValidTolerance, setIsValidTolerance] = React.useState<boolean>(true);
  const [isValidMinCount, setIsValidMinCount] = React.useState<boolean>(true);

  const dispatch = useDispatch();
  const preprocessingConfig = useSelector(
    (state: RootState) => state.preprocessingConfig
  );

  useEffect(() => {
    const isAllValid = [
      isValidExperimentName,
      isValidForwardAdapter,
      isValidReverseAdapter,
      isValidTargetLength,
      isValidTolerance,
      isValidMinCount,
      experimentName !== undefined,
      tolerance !== undefined,
      minCount !== undefined,
    ].every((isValid) => isValid);

    if (isValidExperimentName) {
      dispatch({
        type: "pageConfig/setExperimentName",
        payload: experimentName,
      });
    }

    if (isAllValid) {
      dispatch({
        type: "preprocessingConfig/set",
        payload: {
          ...preprocessingConfig,
          isValidParams: true,
          isDirty: true,
          forwardAdapter: forwardAdapter,
          reverseAdapter: reverseAdapter,
          targetLength: targetLength,
          tolerance: tolerance,
          minCount: minCount,
        },
      });
    } else {
      dispatch({
        type: "preprocessingConfig/set",
        payload: {
          ...preprocessingConfig,
          isValidParams: false,
          isDirty: true,
        },
      });
    }
  }, [
    experimentName,
    forwardAdapter,
    reverseAdapter,
    targetLength,
    tolerance,
    minCount,
    isValidExperimentName,
    isValidForwardAdapter,
    isValidReverseAdapter,
    isValidTargetLength,
    isValidTolerance,
    isValidMinCount,
  ]);

  return (
    <>
      <legend>Model Type</legend>
      <ModelTypeSelect />

      <legend>Experiment Name</legend>
      <TextForm
        placeholder="Please enter the name of the experiment."
        value={experimentName}
        setValue={setExperimentName}
        isValid={isValidExperimentName}
        setIsValid={setIsValidExperimentName}
        predicate={(value) => value.length > 0}
      />

      <legend>Preprocessing Parameters</legend>
      <FormForward
        value={forwardAdapter}
        isValid={isValidForwardAdapter}
        setValue={setForwardAdapter}
        setIsValid={setIsValidForwardAdapter}
        targetLength={targetLength}
        targetLengthIsValid={isValidTargetLength}
      />
      <FormReverse
        value={reverseAdapter}
        isValid={isValidReverseAdapter}
        setValue={setReverseAdapter}
        setIsValid={setIsValidReverseAdapter}
        targetLength={targetLength}
        targetLengthIsValid={isValidTargetLength}
      />
      <FormTargetLength
        value={targetLength}
        isValid={isValidTargetLength}
        setValue={setTargetLength}
        setIsValid={setIsValidTargetLength}
      />
      <IntegerForm
        label="Filtering Tolerance"
        placeholder="Allows a not-negative integer"
        value={tolerance}
        setValue={setTolerance}
        isValid={isValidTolerance}
        setIsValid={setIsValidTolerance}
        predicate={(value) => value >= 0}
      />
      <IntegerForm
        label="Minimum Count"
        placeholder="Allows a positive integer"
        value={minCount}
        setValue={setMinCount}
        isValid={isValidMinCount}
        setIsValid={setIsValidMinCount}
        predicate={(value) => value > 0}
      />
    </>
  );
};

export default SideBar;
