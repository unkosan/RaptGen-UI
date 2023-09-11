import { ButtonToolbar } from "react-bootstrap";
import { Button } from "react-bootstrap";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { apiClient } from "~/services/api-client";

type Props = {
  submitDisabled: boolean;
};

// TODO: implement submit button
const SubmitButtons: React.FC<Props> = (props) => {
  const dispatch = useDispatch();

  //   const vaeConfig = useSelector((state: RootState) => state.vaeConfig);

  const handleBack = () => {
    dispatch({
      type: "uploadConfig/setRoute",
      payload: "/",
    });
  };

  const handleSubmit = async () => {
    (async () => {
      //   const optional = {
      //     published_time: vaeConfig.optionalParams.uploadDate,
      //     tolerance: Number(vaeConfig.optionalParams.tolerance),
      //     minimum_count: Number(vaeConfig.optionalParams.minCount),
      //     epochs: Number(vaeConfig.optionalParams.epochs),
      //     beta_weighting_epochs: Number(vaeConfig.optionalParams.betaDuration),
      //     match_forcing_epochs: Number(
      //       vaeConfig.optionalParams.matchForcingDuration
      //     ),
      //     match_cost: Number(vaeConfig.optionalParams.matchCost),
      //     early_stopping_patience: Number(
      //       vaeConfig.optionalParams.earlyStopDuration
      //     ),
      //     CUDA_num_threads: Number(vaeConfig.optionalParams.numberWorkers),
      //     CUDA_pin_memory: Boolean(vaeConfig.optionalParams.pinned),
      //     seed: Number(vaeConfig.optionalParams.seedValue),
      //   };
      //   // remove empty optional params
      //   type Optional = keyof typeof optional;
      //   Object.keys(optional).forEach((key) => {
      //     const keyGuarded = key as Optional;
      //     if (
      //       optional[keyGuarded] === undefined ||
      //       isNaN(Number(optional[keyGuarded]))
      //     ) {
      //       delete optional[keyGuarded];
      //     }
      //   });
      //   const res = await apiClient.uploadVAE({
      //     ...optional,
      //   });
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
