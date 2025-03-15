import { useState, ChangeEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { setPreprocessingConfig } from "../../redux/preprocessing-config";
import { setPageConfig } from "../../redux/page-config";
import { apiClient } from "~/services/api-client";

// Available model types
export const availableModelTypes = [
  "RaptGen",
  // "RaptGen-freq",
  // "RaptGen-logfreq",
  // "RfamGen"
];

// Type for a text parameter with validation
export interface TextParameter {
  value: string;
  setValue: (value: string) => void;
  isValid: boolean;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

// Type for a numeric parameter with validation
export interface NumericParameter {
  value: number;
  setValue: (value: number) => void;
  isValid: boolean;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

// Type for all preprocessing parameters
export interface PreprocessingParameters {
  modelType: {
    value: string;
    options: string[];
    handleChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  };
  experimentName: TextParameter;
  targetLength: NumericParameter & {
    estimate: () => Promise<void>;
    isEstimating: boolean;
  };
  adapters: {
    forwardAdapter: TextParameter;
    reverseAdapter: TextParameter;
    estimate: () => Promise<void>;
    isEstimating: boolean;
    isEstimateDisabled: boolean;
  };
  tolerance: NumericParameter;
  minCount: NumericParameter;
  fullSequences: any[];
}

/**
 * Hook for managing a text parameter with validation and Redux dispatch
 */
const useTextParameter = (
  initialValue: string,
  validationFn: (value: string) => boolean,
  fieldName: string,
  config: any,
  dispatch: any,
  actionCreator: any
): TextParameter => {
  const [value, setValue] = useState<string>(initialValue);
  const isValid = validationFn(value);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    dispatch(actionCreator({ ...config, [fieldName]: newValue }));
  };

  return {
    value,
    setValue: (newValue: string) => {
      setValue(newValue);
    },
    isValid,
    handleChange,
  };
};

/**
 * Hook for managing a sequence adapter parameter with validation and Redux dispatch
 * Handles special formatting (uppercase and T to U conversion)
 */
const useAdapterParameter = (
  initialValue: string,
  fieldName: string,
  config: any,
  dispatch: any
): TextParameter => {
  const [value, setValue] = useState<string>(initialValue);
  const isValid = /^[AUGC]*$/.test(value);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase().replace(/T/g, "U");
    setValue(newValue);
    dispatch(setPreprocessingConfig({ ...config, [fieldName]: newValue }));
  };

  return {
    value,
    setValue: (newValue: string) => {
      setValue(newValue);
    },
    isValid,
    handleChange,
  };
};

/**
 * Hook for managing a numeric parameter with validation and Redux dispatch
 */
const useNumericParameter = (
  initialValue: number,
  validationFn: (value: number) => boolean,
  fieldName: string,
  config: any,
  dispatch: any,
  actionCreator: any
): NumericParameter => {
  const [value, setValue] = useState<number>(initialValue);
  const isValid = validationFn(value);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    setValue(newValue);
    dispatch(actionCreator({ ...config, [fieldName]: newValue }));
  };

  return {
    value,
    setValue: (newValue: number) => {
      setValue(newValue);
    },
    isValid,
    handleChange,
  };
};

/**
 * Hook for handling the model type selection
 */
export const useModelTypeSelection = () => {
  const pageConfig = useSelector((state: RootState) => state.pageConfig);
  const dispatch = useDispatch();
  const [modelType, setModelType] = useState<string>(
    pageConfig.modelType || "RaptGen"
  );

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    setModelType(newValue);
    if (newValue === "RaptGen") {
      dispatch(
        setPageConfig({
          ...pageConfig,
          modelType: newValue,
        })
      );
    }
  };

  return {
    value: modelType,
    options: availableModelTypes,
    handleChange,
  };
};

/**
 * Main hook for all preprocessing parameters
 */
export const usePreprocessingParams = (): PreprocessingParameters => {
  const pageConfig = useSelector((state: RootState) => state.pageConfig);
  const preprocessingConfig = useSelector(
    (state: RootState) => state.preprocessingConfig
  );
  const fullSequences = useSelector(
    (state: RootState) => state.selexData.sequences
  );
  const dispatch = useDispatch();

  // Model type selection
  const modelType = useModelTypeSelection();

  // Experiment name
  const experimentName = useTextParameter(
    pageConfig.experimentName,
    (value) => value.length > 0,
    "experimentName",
    pageConfig,
    dispatch,
    setPageConfig
  );

  // Target length with estimation
  const [isLoadingTargetlen, setIsLoadingTargetlen] = useState(false);
  const targetLength = {
    ...useNumericParameter(
      preprocessingConfig.targetLength,
      (value) => !isNaN(value) && value > 0,
      "targetLength",
      preprocessingConfig,
      dispatch,
      setPreprocessingConfig
    ),
    estimate: async () => {
      setIsLoadingTargetlen(true);
      try {
        const res = await apiClient.estimateTargetLength({
          sequences: fullSequences,
        });

        if (res.status === "success") {
          const estimatedLength = res.data["target_length"];
          targetLength.setValue(estimatedLength);
          dispatch(
            setPreprocessingConfig({
              ...preprocessingConfig,
              targetLength: estimatedLength,
            })
          );
        }
      } finally {
        setIsLoadingTargetlen(false);
      }
    },
    isEstimating: isLoadingTargetlen,
  };

  // Adapters with estimation
  const [isLoadingAdapters, setIsLoadingAdapters] = useState(false);
  const forwardAdapter = useAdapterParameter(
    preprocessingConfig.forwardAdapter,
    "forwardAdapter",
    preprocessingConfig,
    dispatch
  );

  const reverseAdapter = useAdapterParameter(
    preprocessingConfig.reverseAdapter,
    "reverseAdapter",
    preprocessingConfig,
    dispatch
  );

  const adapters = {
    forwardAdapter,
    reverseAdapter,
    estimate: async () => {
      setIsLoadingAdapters(true);
      try {
        const res = await apiClient.estimateAdapters({
          target_length: targetLength.value,
          sequences: fullSequences,
        });

        if (res.status === "success") {
          const fwd = res.data["forward_adapter"]
            .toUpperCase()
            .replace(/T/g, "U");
          const rev = res.data["reverse_adapter"]
            .toUpperCase()
            .replace(/T/g, "U");

          forwardAdapter.setValue(fwd);
          reverseAdapter.setValue(rev);
          dispatch(
            setPreprocessingConfig({
              ...preprocessingConfig,
              forwardAdapter: fwd,
              reverseAdapter: rev,
            })
          );
        }
      } finally {
        setIsLoadingAdapters(false);
      }
    },
    isEstimating: isLoadingAdapters,
    isEstimateDisabled:
      !targetLength.isValid || fullSequences.length === 0 || isLoadingAdapters,
  };

  // Tolerance
  const tolerance = useNumericParameter(
    preprocessingConfig.tolerance,
    (value) => value >= 0,
    "tolerance",
    preprocessingConfig,
    dispatch,
    setPreprocessingConfig
  );

  // Minimum count
  const minCount = useNumericParameter(
    preprocessingConfig.minCount,
    (value) => value > 0,
    "minCount",
    preprocessingConfig,
    dispatch,
    setPreprocessingConfig
  );

  return {
    modelType,
    experimentName,
    targetLength,
    adapters,
    tolerance,
    minCount,
    fullSequences,
  };
};
