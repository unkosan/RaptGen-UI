import { ButtonToolbar } from "react-bootstrap";
import { Button } from "react-bootstrap";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { apiClient } from "~/services/api-client";
import { useRouter } from "next/router";

type Props = {
  submitDisabled: boolean;
  gmmFile: File | null;
  vaeName: string;
};

const SubmitButtons: React.FC<Props> = (props) => {
  const router = useRouter();

  const gmmConfig = useSelector((state: RootState) => state.gmmConfig);

  const handleSubmit = async () => {
    (async () => {
      if (!props.gmmFile) {
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

      const res = await apiClient.uploadGMM({
        ...required,
        ...optional,
      });
    })();
  };

  return (
    <>
      <ButtonToolbar className="justify-content-between">
        <Button className="col-3" onClick={() => router.push("/uploader")}>
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
