import { Form } from "react-bootstrap";
import FormModelName from "./form-model-name";
import FormTargetLength from "./form-target-length";
import { useEffect, useState } from "react";
import FormForward from "./form-forward";
import FormReverse from "./form-reverse";
import { useDispatch } from "react-redux";

type Props = {
  setParamsIsValid: React.Dispatch<React.SetStateAction<boolean>>;
  setParamsIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
};

const RequiredParams: React.FC<Props> = (props) => {
  const [modelName, setModelName] = useState<string>("");
  const [isModelNameValid, setIsModelNameValid] = useState<boolean>(false);
  const [targetLength, setTargetLength] = useState<number>(0);
  const [isTargetLengthValid, setIsTargetLengthValid] =
    useState<boolean>(false);
  const [forwardAdapter, setForwardAdapter] = useState<string>("");
  const [isForwardAdapterValid, setIsForwardAdapterValid] =
    useState<boolean>(false);
  const [reverseAdapter, setReverseAdapter] = useState<string>("");
  const [isReverseAdapterValid, setIsReverseAdapterValid] =
    useState<boolean>(false);

  const dispatch = useDispatch();

  useEffect(() => {
    if (
      isModelNameValid &&
      isTargetLengthValid &&
      isForwardAdapterValid &&
      isReverseAdapterValid
    ) {
      dispatch({
        type: "vaeConfig/setRequiredParams",
        payload: {
          modelName: modelName,
          targetLength: targetLength,
          forwardAdapter: forwardAdapter,
          reverseAdapter: reverseAdapter,
        },
      });
      props.setParamsIsValid(true);
      console.log("required params are valid");
    } else {
      console.log("required params are invalid");
      props.setParamsIsValid(false);
    }
  }, [
    isModelNameValid,
    isTargetLengthValid,
    isForwardAdapterValid,
    isReverseAdapterValid,
    modelName,
    targetLength,
    forwardAdapter,
    reverseAdapter,
  ]);

  useEffect(() => {
    props.setParamsIsDirty(true);
  }, [forwardAdapter, reverseAdapter]);

  return (
    <>
      <Form.Group className="mb-3">
        <Form.Label>Model Name</Form.Label>
        <FormModelName
          value={modelName}
          isValid={isModelNameValid}
          setValue={setModelName}
          setIsValid={setIsModelNameValid}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Target Length</Form.Label>
        <FormTargetLength
          value={targetLength}
          isValid={isTargetLengthValid}
          setValue={setTargetLength}
          setIsValid={setIsTargetLengthValid}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Forward Adapter</Form.Label>
        <FormForward
          value={forwardAdapter}
          isValid={isForwardAdapterValid}
          setValue={setForwardAdapter}
          setIsValid={setIsForwardAdapterValid}
          targetLength={targetLength}
          targetLengthIsValid={isTargetLengthValid}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Reverse Adapter</Form.Label>
        <FormReverse
          value={reverseAdapter}
          isValid={isReverseAdapterValid}
          setValue={setReverseAdapter}
          setIsValid={setIsReverseAdapterValid}
          targetLength={targetLength}
          targetLengthIsValid={isTargetLengthValid}
        />
      </Form.Group>
    </>
  );
};

export default RequiredParams;
