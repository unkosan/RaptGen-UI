import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import TextForm from "../../sidebar-vae/optional-params/text-form";

type Props = {
  setParamsIsValid: React.Dispatch<React.SetStateAction<boolean>>;
};

const RequiredParams: React.FC<Props> = (props) => {
  const [modelName, setModelName] = useState<string | undefined>("");
  const [isModelNameValid, setIsModelNameValid] = useState<boolean>(false);

  const dispatch = useDispatch();

  useEffect(() => {
    if (isModelNameValid) {
      dispatch({
        type: "gmmConfig/setRequiredParams",
        payload: {
          modelName: modelName,
        },
      });
      props.setParamsIsValid(true);
    } else {
      props.setParamsIsValid(false);
    }
  }, [isModelNameValid, modelName]);

  return (
    <TextForm
      label="Model Name"
      placeholder="Enter the model name"
      predicate={(value: string) => value.length > 0}
      value={modelName}
      isValid={isModelNameValid}
      setValue={setModelName}
      setIsValid={setIsModelNameValid}
    />
  );
};

export default RequiredParams;
