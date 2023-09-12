import { Alert, ButtonToolbar, Spinner } from "react-bootstrap";
import { Button } from "react-bootstrap";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { apiClient } from "~/services/api-client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

type Props = {
  submitDisabled: boolean;
  vaeFile: File | null;
};

// TODO: implement submit button
const SubmitButtons: React.FC<Props> = (props) => {
  const dispatch = useDispatch();

  const router = useRouter();

  const vaeConfig = useSelector((state: RootState) => state.vaeConfig);
  const vaeData = useSelector((state: RootState) => state.vaeData);

  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    (async () => {
      if (!props.vaeFile) {
        setIsLoading(false);
        setIsFinished(false);
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

      await new Promise((resolve) => setTimeout(resolve, 5000));
      const res = await apiClient.uploadVAE({
        ...required,
        ...optional,
      });

      console.log(res);

      setIsLoading(false);
      if (res.status === "success") {
        setIsFinished(true);
      } else {
        alert("Upload failed");
      }
    })();
  }, [isLoading]);

  const handleBack = () => {
    dispatch({
      type: "uploadConfig/setRoute",
      payload: "/vae/encode",
    });
  };

  if (isFinished) {
    return (
      <Alert variant="success">
        <Alert.Heading>Upload successful!</Alert.Heading>
        <p>
          Your model is now being uploaded. You can check the model in viewer
          page.
        </p>
        <hr />
        <div className="d-flex justify-content-end">
          <Button
            onClick={() => router.push("/viewer")}
            variant="outline-success"
          >
            Go to viewer
          </Button>
        </div>
      </Alert>
    );
  } else {
    return (
      <>
        <ButtonToolbar className="justify-content-between">
          <Button className="col-3" onClick={handleBack}>
            Back
          </Button>
          <Button
            className={isLoading ? "" : "col-3"}
            disabled={props.submitDisabled || isLoading}
            onClick={() => setIsLoading(true)}
          >
            {isLoading ? <Spinner animation="border" size="sm" /> : <>Submit</>}
          </Button>
        </ButtonToolbar>
      </>
    );
  }
};

export default SubmitButtons;
