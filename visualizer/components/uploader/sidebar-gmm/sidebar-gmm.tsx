import React from "react";
import OptionalParams from "./optional-params/optional-params";
import SubmitButtons from "./submit-buttons/submit-buttons";
import ModelSelector from "./select-model/select-model";

const SideBarGMM: React.FC = () => {
  return (
    <div className="sidebar-gmm">
      <legend>Select Models</legend>
      <ModelSelector />
      <legend>Setup Config Params</legend>
      <OptionalParams />
      <SubmitButtons submitDisabled={true} />
    </div>
  );
};

export default SideBarGMM;
