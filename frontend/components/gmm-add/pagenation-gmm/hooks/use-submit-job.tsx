import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useCallback, useState } from "react";
import { useRouter } from "next/router";
import { apiClient } from "~/services/api-client";

export const useSubmitJob = () => {
  const {
    vaeId,
    gmmName,
    minNumComponents,
    maxNumComponents,
    stepSize,
    numTrials,
  } = useSelector((state: RootState) => state.params);
  const paramsValid = useSelector((state: RootState) => state.paramsValid);

  const [isLoading, setIsLoading] = useState(false);

  const { push } = useRouter();

  const handleClickTrain = useCallback(async () => {
    setIsLoading(true);
    try {
      const { uuid } = await apiClient.submitGMMJobs({
        params: {
          minimum_n_components: minNumComponents,
          maximum_n_components: maxNumComponents,
          step_size: stepSize,
          n_trials_per_component: numTrials,
        },
        target: vaeId,
        name: gmmName,
      });
      push(`/gmm?experiment=${uuid}`);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [
    vaeId,
    gmmName,
    minNumComponents,
    maxNumComponents,
    stepSize,
    numTrials,
    push,
    setIsLoading,
  ]);

  const handleClickBack = useCallback(() => {
    push("/gmm");
  }, [push]);

  // every item of paramsValid are true
  const canTrain = Object.values(paramsValid).every((value) => value);

  return { isLoading, canTrain, handleClickTrain, handleClickBack };
};
