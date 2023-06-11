import React from "react";
import ModelTypeSelect from "./model-type-select";
import TextForm from "../../../../uploader/sidebar-vae/optional-params/text-form";
import IntegerForm from "../../../../uploader/sidebar-vae/optional-params/integer-form";

const SideBar: React.FC = () => {
  const [experimentName, setExperimentName] = React.useState<
    string | undefined
  >(undefined);
  const [forwardAdapter, setForwardAdapter] = React.useState<
    string | undefined
  >(undefined);
  const [reverseAdapter, setReverseAdapter] = React.useState<
    string | undefined
  >(undefined);
  const [targetLength, setTargetLength] = React.useState<number | undefined>(
    undefined
  );
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
    React.useState<boolean>(true);
  const [isValidTolerance, setIsValidTolerance] = React.useState<boolean>(true);
  const [isValidMinCount, setIsValidMinCount] = React.useState<boolean>(true);

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
      <TextForm
        label="Forward Adapter"
        placeholder="Allows a string of A, U, G, C"
        value={forwardAdapter}
        setValue={(str) => {
          if (str !== undefined) {
            str = String(str).toUpperCase().replace(/T/g, "U");
          }
          setForwardAdapter(str);
        }}
        isValid={isValidForwardAdapter}
        setIsValid={setIsValidForwardAdapter}
        predicate={(value) => /^[ATUGCatcgu]*$/.test(value)}
      />
      <TextForm
        label="Reverse Adapter"
        placeholder="Allows a string of A, U, G, C"
        value={reverseAdapter}
        setValue={(str) => {
          if (str !== undefined) {
            str = String(str).toUpperCase().replace(/T/g, "U");
          }
          setReverseAdapter(str);
        }}
        isValid={isValidReverseAdapter}
        setIsValid={setIsValidReverseAdapter}
        predicate={(value) => /^[ATUGCatcgu]*$/.test(value)}
      />
      <IntegerForm
        label="Target Length"
        placeholder="Allows a positive integer"
        value={targetLength}
        setValue={setTargetLength}
        isValid={isValidTargetLength}
        setIsValid={setIsValidTargetLength}
        predicate={(value) => value > 0}
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
