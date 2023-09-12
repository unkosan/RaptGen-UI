import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import TextForm from "../../sidebar-vae/optional-params/text-form";
import FormModelName from "./form-model-name";
import { Form } from "react-bootstrap";

type Props = {
  setParamsIsValid: React.Dispatch<React.SetStateAction<boolean>>;
};

const RequiredParams: React.FC<Props> = (props) => {
  const [modelName, setModelName] = useState<string>("");
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
    <>
      <Form.Label>Model Name</Form.Label>
      <FormModelName
        value={modelName}
        isValid={isModelNameValid}
        setValue={setModelName}
        setIsValid={setIsModelNameValid}
      />
    </>
  );
};

export default RequiredParams;
