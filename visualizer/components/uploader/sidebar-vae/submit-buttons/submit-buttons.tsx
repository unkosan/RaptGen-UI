import { ButtonToolbar } from "react-bootstrap";
import { Button } from "react-bootstrap";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import axios from "axios";

type Props = {
  submitDisabled: boolean;
  vaeFile: File | null;
};

// TODO: implement submit button
const SubmitButtons: React.FC<Props> = (props) => {
  const dispatch = useDispatch();

  const vaeConfig = useSelector((state: RootState) => state.vaeConfig);
  const vaeData = useSelector((staete: RootState) => staete.vaeData);

  const handleBack = () => {
    dispatch({
      type: "uploadConfig/setRoute",
      payload: "/vae/encode",
    });
  };

  const handleSubmit = async () => {
    (async () => {
      const formData = new FormData();

      if (!props.vaeFile) {
        return;
      }
      formData.append("model", props.vaeFile);

      // required params
      formData.append("model_name", vaeConfig.requiredParams.modelName);
      formData.append(
        "forward_adapter",
        vaeConfig.requiredParams.forwardAdapter
      );
      formData.append(
        "reverse_adapter",
        vaeConfig.requiredParams.reverseAdapter
      );
      formData.append(
        "target_length",
        vaeConfig.requiredParams.targetLength.toString()
      );
      formData.append(
        "sequences",
        vaeData.map((value) => value.sequence).join(",")
      );
      formData.append(
        "coord_x",
        vaeData.map((value) => value.coordX.toString()).join(",")
      );
      formData.append(
        "coord_y",
        vaeData.map((value) => value.coordY.toString()).join(",")
      );
      formData.append(
        "duplicates",
        vaeData.map((value) => value.duplicates.toString()).join(",")
      );

      // optional params
      if (vaeConfig.optionalParams.uploadDate) {
        formData.append("published_time", vaeConfig.optionalParams.uploadDate);
      }
      if (vaeConfig.optionalParams.tolerance) {
        formData.append("tolerance", vaeConfig.optionalParams.tolerance);
      }
      if (vaeConfig.optionalParams.minCount) {
        formData.append("minimum_count", vaeConfig.optionalParams.minCount);
      }
      if (vaeConfig.optionalParams.epochs) {
        formData.append("epochs", vaeConfig.optionalParams.epochs);
      }
      if (vaeConfig.optionalParams.betaDuration) {
        formData.append(
          "beta_weighting_epochs",
          vaeConfig.optionalParams.betaDuration
        );
      }
      if (vaeConfig.optionalParams.matchForcingDuration) {
        formData.append(
          "match_forcing_epochs",
          vaeConfig.optionalParams.matchForcingDuration
        );
      }
      if (vaeConfig.optionalParams.matchCost) {
        formData.append("match_cost", vaeConfig.optionalParams.matchCost);
      }
      if (vaeConfig.optionalParams.earlyStopDuration) {
        formData.append(
          "early_stopping_patience",
          vaeConfig.optionalParams.earlyStopDuration
        );
      }
      if (vaeConfig.optionalParams.numberWorkers) {
        formData.append(
          "CUDA_num_threads",
          vaeConfig.optionalParams.numberWorkers
        );
      }
      if (vaeConfig.optionalParams.pinned) {
        formData.append("CUDA_pin_memory", vaeConfig.optionalParams.pinned);
      }
      if (vaeConfig.optionalParams.seedValue) {
        formData.append("seed", vaeConfig.optionalParams.seedValue);
      }

      // send data and params to backend
      const res = await axios
        .post("/upload/upload-vae", formData, {
          // .post("/test-form", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        .then((res) => res.data);

      console.log(res);
    })();
  };

  return (
    <>
      <ButtonToolbar className="justify-content-between">
        <Button className="col-3" onClick={handleBack}>
          Back
        </Button>
        <Button
          className="col-3"
          disabled={props.submitDisabled}
          onClick={handleSubmit}
        >
          Submit
        </Button>
      </ButtonToolbar>
    </>
  );
};

export default SubmitButtons;
