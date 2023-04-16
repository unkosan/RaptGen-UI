import { useEffect, useState } from "react";
import UploadFile from "./upload-file/upload-file";
import RequiredParams from "./required-params/required-params";
import OptionalParams from "./optional-params/optional-params";
import EncodeButtons from "./encode-buttons/encode-buttons";
import InfoTable from "./info-table/info-table";
import DataTable from "./data-table/data-table";
import NextButtons from "./next-buttons/next-buttons";
import SubmitButtons from "./submit-buttons/submit-buttons";
import ProcessInfo from "./process-info/process-info";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

const SideBarVAE: React.FC = () => {
  const dispatch = useDispatch();
  const pseudoRoute = useSelector(
    (state: RootState) => state.uploadConfig.pseudoRoute
  );

  // /vae/home
  const [vaeFile, setVaeFile] = useState<File | null>(null);
  const [selexFile, setSelexFile] = useState<File | null>(null);
  const [fileIsValid, setFileIsValid] = useState<boolean>(false);
  const [fileIsDirty, setFileIsDirty] = useState<boolean>(false);
  const [requiredIsValid, setRequiredIsValid] = useState<boolean>(false);
  const [requiredIsDirty, setRequiredIsDirty] = useState<boolean>(false);
  const [encodeValid, setEncodeValid] = useState<boolean>(false);

  useEffect(() => {
    setEncodeValid(requiredIsValid && fileIsValid);
  }, [requiredIsValid, fileIsValid]);

  // /vae/encode
  const [nextValid, setNextValid] = useState<boolean>(false);
  const [processFinished, setProcessFinished] = useState<boolean>(false);
  const [processIsValid, setProcessIsValid] = useState<boolean>(false);

  useEffect(() => {
    setNextValid(processFinished && processIsValid);
  }, [processFinished, processIsValid]);

  useEffect(() => {
    if (requiredIsDirty || fileIsDirty) {
      dispatch({
        type: "vaeConfig/setUUID",
        payload: "",
      });
      setProcessFinished(false);
      setProcessIsValid(false);
      console.log("set processFinished to false");
    }
  }, [requiredIsDirty, fileIsDirty]);

  // /vae/submit
  const [submitValid, setSubmitValid] = useState<boolean>(false);

  return (
    <div className="sidebar-vae">
      <div style={{ display: pseudoRoute === "/vae/home" ? "block" : "none" }}>
        <legend>Upload File</legend>
        <UploadFile
          setFileIsValid={setFileIsValid}
          setFileIsDirty={setFileIsDirty}
          setVaeFile={setVaeFile}
          setSelexFile={setSelexFile}
        />
        <legend>Setup SELEX Params</legend>
        <RequiredParams
          setParamsIsValid={setRequiredIsValid}
          setParamsIsDirty={setRequiredIsDirty}
        />
        <legend>Encode Buttons</legend>
        <EncodeButtons
          encodeDisabled={!encodeValid}
          isDirty={requiredIsDirty || fileIsDirty}
          setIsDirty={
            ((isDirty: boolean) => {
              setRequiredIsDirty(isDirty);
              setFileIsDirty(isDirty);
            }) as React.Dispatch<React.SetStateAction<boolean>>
          }
          vaeFile={vaeFile}
        />
      </div>
      <div
        style={{ display: pseudoRoute === "/vae/encode" ? "block" : "none" }}
      >
        <legend>Upload Data Info</legend>
        <InfoTable />
        <legend>Sequence Data</legend>
        <DataTable />
        <legend>Process Info</legend>
        <ProcessInfo
          finished={processFinished}
          isValid={processIsValid}
          setIsFinished={setProcessFinished}
          setIsValid={setProcessIsValid}
        />
        <legend>Next Buttons</legend>
        <NextButtons nextDisabled={!nextValid} />
      </div>
      <div
        style={{ display: pseudoRoute === "/vae/submit" ? "block" : "none" }}
      >
        <legend>Setup Training Params</legend>
        <OptionalParams setParamsIsValid={setSubmitValid} />
        <legend>Submit Buttons</legend>
        <SubmitButtons submitDisabled={!submitValid} />
      </div>
    </div>
  );
};

export default SideBarVAE;
