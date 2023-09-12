import { Alert, ButtonToolbar, Spinner } from "react-bootstrap";
import { Button } from "react-bootstrap";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { apiClient } from "~/services/api-client";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

type Props = {
  submitDisabled: boolean;
  gmmFile: File | null;
  vaeName: string;
};

const SubmitButtons: React.FC<Props> = (props) => {
  const router = useRouter();

  const gmmConfig = useSelector((state: RootState) => state.gmmConfig);

  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    (async () => {
      if (!props.gmmFile) {
        setIsLoading(false);
        setIsFinished(false);
        return;
      }

      const required = {
        VAE_model_name: props.vaeName,
        GMM_model_name: gmmConfig.requiredParams.modelName,
        model: props.gmmFile,
      };
      const optional = {
        num_components: Number(gmmConfig.optionalParams.numComponents),
        seed: Number(gmmConfig.optionalParams.seed),
        model_type: gmmConfig.optionalParams.modelType,
      };

      // remove empty optional params
      type Optional = keyof typeof optional;
      Object.keys(optional).forEach((key) => {
        const keyGuarded = key as Optional;
        if (typeof optional[keyGuarded] === "number") {
          const value = Number(optional[keyGuarded]);
          if (isNaN(value)) {
            delete optional[keyGuarded];
          }
        } else if (optional[keyGuarded] === undefined) {
          delete optional[keyGuarded];
        }
      });

      await new Promise((resolve) => setTimeout(resolve, 5000));
      const res = await apiClient.uploadGMM({
        ...required,
        ...optional,
      });

      setIsLoading(false);
      if (res.status === "success") {
        setIsFinished(true);
      } else {
        alert("Upload failed");
      }
    })();
  }, [isLoading]);

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
          <Button className="col-3" onClick={() => router.push("/uploader")}>
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
