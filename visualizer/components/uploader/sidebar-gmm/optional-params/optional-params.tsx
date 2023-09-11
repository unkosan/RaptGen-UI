import React, { useEffect, useState } from "react";
import TextForm from "../../sidebar-vae/optional-params/text-form";
import IntegerForm from "../../sidebar-vae/optional-params/integer-form";
import { isInteger } from "lodash";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useDispatch } from "react-redux";

type Props = {
  setParamsIsValid: React.Dispatch<React.SetStateAction<boolean>>;
};

const OptionalParams: React.FC<Props> = (props) => {
  const [numComponents, setNumComponents] = useState<number | undefined>(
    undefined
  );
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [modelType, setModelType] = useState<string | undefined>(undefined);

  const [isValidNumComponents, setIsValidNumComponents] =
    useState<boolean>(true);
  const [isValidSeed, setIsValidSeed] = useState<boolean>(true);
  const [isValidModelType, setIsValidModelType] = useState<boolean>(true);

  const weights = useSelector(
    (state: RootState) => state.gmmConfig.gmmData.weights
  );

  const dispatch = useDispatch();

  useEffect(() => {
    setNumComponents(weights.length);
  }, [weights]);

  useEffect(() => {
    (async () => {
      if (isValidNumComponents && isValidSeed && isValidModelType) {
        dispatch({
          type: "gmmConfig/setOptionalParams",
          payload: {
            numComponents,
            seed,
            modelType,
          },
        });
        props.setParamsIsValid(true);
      } else {
        props.setParamsIsValid(false);
      }
    })();
  }, [
    numComponents,
    seed,
    modelType,
    isValidNumComponents,
    isValidSeed,
    isValidModelType,
  ]);

  return (
    <>
      <IntegerForm
        label="Number of Components"
        placeholder="Enter the number of Gaussian distribution"
        predicate={(value: number) => value > 1}
        value={numComponents}
        setValue={setNumComponents}
        isValid={isValidNumComponents}
        setIsValid={setIsValidNumComponents}
      />
      <IntegerForm
        label="Seed"
        placeholder="Enter the seed value"
        predicate={(value: number) => isInteger(value)}
        value={seed}
        setValue={setSeed}
        isValid={isValidSeed}
        setIsValid={setIsValidSeed}
      />
      <TextForm
        label="Model Type"
        placeholder="Enter the model type"
        predicate={(value: string) => value.length > 0}
        value={modelType}
        setValue={setModelType}
        isValid={isValidModelType}
        setIsValid={setIsValidModelType}
      />
    </>
  );
};

export default OptionalParams;
