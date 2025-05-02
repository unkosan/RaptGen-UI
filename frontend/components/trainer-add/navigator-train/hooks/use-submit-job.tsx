import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useCallback, useState } from "react";
import { useRouter } from "next/router";
import { apiClient } from "~/services/api-client";

export const useSubmitJob = () => {
  const trainConfig = useSelector((state: RootState) => state.trainConfig);
  const preprocessingConfig = useSelector(
    (state: RootState) => state.preprocessingConfig
  );
  const selexData = useSelector((state: RootState) => state.selexData);
  const pageConfig = useSelector((state: RootState) => state.pageConfig);

  const [isLoading, setIsLoading] = useState(false);

  const { push } = useRouter();

  const handleClickTrain = useCallback(async () => {
    setIsLoading(true);
    try {
      const { uuid } = await apiClient.postSubmitJob({
        type: pageConfig.modelType,
        name: pageConfig.experimentName,
        params_preprocessing: {
          forward: preprocessingConfig.forwardAdapter,
          reverse: preprocessingConfig.reverseAdapter,
          random_region_length:
            (preprocessingConfig.targetLength ?? 0) -
            (preprocessingConfig.forwardAdapter?.length ?? 0) -
            (preprocessingConfig.reverseAdapter?.length ?? 0),
          tolerance: preprocessingConfig.tolerance,
          minimum_count: preprocessingConfig.minCount,
        },
        random_regions: selexData.filteredRandomRegions,
        duplicates: selexData.filteredDuplicates,
        reiteration: trainConfig.reiteration,
        params_training: {
          model_length: trainConfig.modelLength,
          epochs: trainConfig.epochs,
          match_forcing_duration: trainConfig.forceMatchEpochs,
          beta_duration: trainConfig.betaScheduleEpochs,
          early_stopping: trainConfig.earlyStoppingEpochs,
          seed_value: trainConfig.seed,
          match_cost: trainConfig.matchCost,
          device: trainConfig.device,
        },
      });
      push(`/trainer?experiment=${uuid}`);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [pageConfig, preprocessingConfig, selexData, trainConfig, push]);

  const handleClickBack = useCallback(() => {
    push("");
  }, [push]);

  const canTrain = trainConfig.isValidParams;

  return { isLoading, canTrain, handleClickTrain, handleClickBack };
};
