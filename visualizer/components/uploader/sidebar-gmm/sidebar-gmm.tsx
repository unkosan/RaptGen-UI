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
        <Form.Group className="mb-3">
          <Form.Text className="text-muted">
            Please select a VAE model first. Then upload a{" "}
            <code>GuassianMixture</code> model defined in{" "}
            <code>sklearn.mixture</code>. The model needed to be pickle dumped
            with <code>pickle</code> in Python standard library.
          </Form.Text>
        </Form.Group>
      </Form>
      <legend>Setup Config Params</legend>
      <RequiredParams setParamsIsValid={setRequiredParamsIsValid} />
      <OptionalParams setParamsIsValid={setOptionalParamsIsValid} />
      <Form.Group className="mb-3">
        <Form.Text className="text-muted">
          You need to fill in <code>Model Name</code>. The others are optional.
          The number of distribution components will be inferred from the GMM
          model.
        </Form.Text>
      </Form.Group>
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
