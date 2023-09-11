import React, { useState } from "react";
import OptionalParams from "./optional-params/optional-params";
import SubmitButtons from "./submit-buttons/submit-buttons";
import RequiredParams from "./optional-params/required-params";
import { Form } from "react-bootstrap";
import SelectGMM from "./select-model/select-GMM";
import SelectVAE from "./select-model/select-VAE";

const SideBarGMM: React.FC = () => {
  const [vaeName, setVaeName] = useState<string>("");
  const [gmmFile, setGmmFile] = useState<File | null>(null);

  const [vaeIsValid, setVaeIsValid] = useState<boolean>(false);
  const [fileIsValid, setFileIsValid] = useState<boolean>(false);
  const [requiredParamsIsValid, setRequiredParamsIsValid] =
    useState<boolean>(false);
  const [optionalParamsIsValid, setOptionalParamsIsValid] =
    useState<boolean>(true);

  return (
    <div className="sidebar-gmm">
      <legend>Select Models</legend>
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Selected VAE Model</Form.Label>
          <SelectVAE setVaeName={setVaeName} setVaeIsValid={setVaeIsValid} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Uploaded GMM Model</Form.Label>
          <SelectGMM setGmmFile={setGmmFile} setFileIsValid={setFileIsValid} />
        </Form.Group>
      </Form>
      <legend>Setup Config Params</legend>
      <RequiredParams setParamsIsValid={setRequiredParamsIsValid} />
      <OptionalParams setParamsIsValid={setOptionalParamsIsValid} />
      <SubmitButtons
        submitDisabled={
          !(
            requiredParamsIsValid &&
            optionalParamsIsValid &&
            fileIsValid &&
            vaeIsValid
          )
        }
        gmmFile={gmmFile}
        vaeName={vaeName}
      />
    </div>
  );
};

export default SideBarGMM;
