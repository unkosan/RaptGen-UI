import { ButtonToolbar } from "react-bootstrap";
import { Button } from "react-bootstrap";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { apiClient } from "~/services/api-client";

type Props = {
  submitDisabled: boolean;
  vaeFile: File | null;
};

// TODO: implement submit button
const SubmitButtons: React.FC<Props> = (props) => {
  const dispatch = useDispatch();

  const vaeConfig = useSelector((state: RootState) => state.vaeConfig);
  const vaeData = useSelector((state: RootState) => state.vaeData);

  const handleBack = () => {
    dispatch({
      type: "uploadConfig/setRoute",
      payload: "/vae/encode",
    });
  };

  const handleSubmit = async () => {
    (async () => {
      if (!props.vaeFile) {
        return;
      }

      const required = {
        model: props.vaeFile,
        model_name: vaeConfig.requiredParams.modelName,
        forward_adapter: vaeConfig.requiredParams.forwardAdapter,
        reverse_adapter: vaeConfig.requiredParams.reverseAdapter,
        target_length: vaeConfig.requiredParams.targetLength,
        sequences: vaeData.map((value) => value.sequence),
        coord_x: vaeData.map((value) => value.coordX),
        coord_y: vaeData.map((value) => value.coordY),
        duplicates: vaeData.map((value) => value.duplicates),
      };

      const optional = {
        published_time: vaeConfig.optionalParams.uploadDate,
        tolerance: Number(vaeConfig.optionalParams.tolerance),
        minimum_count: Number(vaeConfig.optionalParams.minCount),
        epochs: Number(vaeConfig.optionalParams.epochs),
        beta_weighting_epochs: Number(vaeConfig.optionalParams.betaDuration),
        match_forcing_epochs: Number(
          vaeConfig.optionalParams.matchForcingDuration
        ),
        match_cost: Number(vaeConfig.optionalParams.matchCost),
        early_stopping_patience: Number(
          vaeConfig.optionalParams.earlyStopDuration
        ),
        CUDA_num_threads: Number(vaeConfig.optionalParams.numberWorkers),
        CUDA_pin_memory: Boolean(vaeConfig.optionalParams.pinned),
        seed: Number(vaeConfig.optionalParams.seedValue),
      };

      // remove empty optional params
      type Optional = keyof typeof optional;
      Object.keys(optional).forEach((key) => {
        const keyGuarded = key as Optional;
        if (
          optional[keyGuarded] === undefined ||
          isNaN(Number(optional[keyGuarded]))
        ) {
          delete optional[keyGuarded];
        }
      });

      const res = await apiClient.uploadVAE({
        ...required,
        ...optional,
      });

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
