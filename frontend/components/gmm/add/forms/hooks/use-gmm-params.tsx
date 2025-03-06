import { useState, useEffect, ChangeEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { setParams } from "../../redux/params";
import { setParamsValid } from "../../redux/paramsValid";
import { apiClient } from "~/services/api-client";

// Type for a VAE model
export interface VaeModel {
  uuid: string;
  name: string;
}

// Type for a numeric parameter with validation
export interface NumericParameter {
  value: number;
  setValue: (value: number) => void;
  isValid: boolean;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

// Type for a text parameter with validation
export interface TextParameter {
  value: string;
  setValue: (value: string) => void;
  isValid: boolean;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

// Type for all GMM parameters
export interface GmmParameters {
  vaeModel: {
    value: string;
    options: VaeModel[];
    handleChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  };
  gmmName: TextParameter;
  minNumComponents: NumericParameter;
  maxNumComponents: NumericParameter;
  stepSize: NumericParameter;
  numTrials: NumericParameter;
  isFormValid: boolean;
}

/**
 * Hook for managing a text parameter with validation and Redux dispatch
 */
const useTextParameter = (
  initialValue: string,
  validationFn: (value: string) => boolean,
  fieldName: string,
  params: any,
  paramsValid: any,
  dispatch: any
): TextParameter => {
  const [value, setValue] = useState<string>(initialValue);
  const isValid = validationFn(value);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.trim();
    setValue(newValue);

    const isValidNewValue = validationFn(newValue);

    dispatch(
      setParamsValid({
        ...paramsValid,
        [fieldName]: isValidNewValue,
      })
    );

    if (isValidNewValue) {
      dispatch(
        setParams({
          ...params,
          [fieldName]: newValue,
        })
      );
    }
  };

  return {
    value,
    setValue,
    isValid,
    handleChange,
  };
};

/**
 * Hook for managing a numeric parameter with validation and Redux dispatch
 */
const useNumericParameter = (
  initialValue: number,
  validationFn: (value: number, params: any) => boolean,
  fieldName: string,
  params: any,
  paramsValid: any,
  dispatch: any
): NumericParameter => {
  const [value, setValue] = useState<number>(initialValue);
  const isValid = validationFn(value, params);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    setValue(newValue);

    const isValidNewValue = validationFn(newValue, params);

    dispatch(
      setParamsValid({
        ...paramsValid,
        [fieldName]: isValidNewValue,
      })
    );

    if (isValidNewValue) {
      dispatch(
        setParams({
          ...params,
          [fieldName]: newValue,
        })
      );
    }
  };

  return {
    value,
    setValue,
    isValid,
    handleChange,
  };
};

/**
 * Main hook for all GMM parameters
 */
export const useGmmParams = (): GmmParameters => {
  const params = useSelector((state: RootState) => state.params);
  const paramsValid = useSelector((state: RootState) => state.paramsValid);
  const dispatch = useDispatch();

  // VAE models
  const [vaeModels, setVaeModels] = useState<VaeModel[]>([]);

  // Fetch VAE models
  useEffect(() => {
    const fetchVaeModels = async () => {
      try {
        const res = await apiClient.getVAEModelNames();
        setVaeModels(res.entries);

        if (res.entries.length > 0) {
          dispatch(
            setParams({
              ...params,
              vaeId: res.entries[0].uuid,
            })
          );
          dispatch(
            setParamsValid({
              ...paramsValid,
              vaeId: true,
            })
          );
        }
      } catch (error) {
        console.error("Failed to fetch VAE models:", error);
      }
    };

    fetchVaeModels();
  }, []);

  // VAE model selection
  const vaeModel = {
    value: params.vaeId,
    options: vaeModels,
    handleChange: (e: ChangeEvent<HTMLSelectElement>) => {
      const uuid = e.target.value;
      try {
        dispatch(
          setParams({
            ...params,
            vaeId: uuid,
          })
        );
        dispatch(
          setParamsValid({
            ...paramsValid,
            vaeId: true,
          })
        );
      } catch (error) {
        console.error("Failed to set VAE model:", error);
      }
    },
  };

  // GMM name
  const gmmName = useTextParameter(
    params.gmmName,
    (value: string) => value.length > 0,
    "gmmName",
    params,
    paramsValid,
    dispatch
  );

  // Minimum number of components
  const minNumComponents = useNumericParameter(
    params.minNumComponents,
    (value: number, params: any) =>
      !isNaN(value) && value >= 1 && value <= params.maxNumComponents,
    "minNumComponents",
    params,
    paramsValid,
    dispatch
  );

  // Maximum number of components
  const maxNumComponents = useNumericParameter(
    params.maxNumComponents,
    (value: number, params: any) =>
      !isNaN(value) && value >= params.minNumComponents,
    "maxNumComponents",
    params,
    paramsValid,
    dispatch
  );

  // Validate min and max components together
  useEffect(() => {
    if (!paramsValid.minNumComponents || !paramsValid.maxNumComponents) {
      if (
        params.minNumComponents <= params.maxNumComponents &&
        params.minNumComponents >= 1 &&
        params.maxNumComponents >= 1
      ) {
        dispatch(
          setParamsValid({
            ...paramsValid,
            minNumComponents: true,
            maxNumComponents: true,
          })
        );
      }
    }
  }, [params.minNumComponents, params.maxNumComponents]);

  // Step size
  const stepSize = useNumericParameter(
    params.stepSize,
    (value: number) => !isNaN(value) && value >= 1,
    "stepSize",
    params,
    paramsValid,
    dispatch
  );

  // Number of trials
  const numTrials = useNumericParameter(
    params.numTrials,
    (value: number) => !isNaN(value) && value >= 1,
    "numTrials",
    params,
    paramsValid,
    dispatch
  );

  // Check if the entire form is valid
  const isFormValid =
    paramsValid.vaeId &&
    paramsValid.gmmName &&
    paramsValid.minNumComponents &&
    paramsValid.maxNumComponents &&
    paramsValid.stepSize &&
    paramsValid.numTrials;

  return {
    vaeModel,
    gmmName,
    minNumComponents,
    maxNumComponents,
    stepSize,
    numTrials,
    isFormValid,
  };
};
