import { Button, Spinner } from "react-bootstrap";
import { ChevronLeft } from "react-bootstrap-icons";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { useRouter } from "next/router";
import { apiClient } from "~/services/api-client";
import { useIsLoading } from "~/hooks/common";

const Pagenation: React.FC = () => {
  const trainConfig = useSelector((state: RootState) => state.trainConfig);
  const preprocessingConfig = useSelector(
    (state: RootState) => state.preprocessingConfig
  );
  const selexData = useSelector((state: RootState) => state.selexData);
  const pageConfig = useSelector((state: RootState) => state.pageConfig);

  const [isLoading, lock, unlock] = useIsLoading();
  const router = useRouter();

  const onClickTrain = async () => {
    lock();
    try {
      const res = await apiClient.postSubmitJob({
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
      unlock();
      router.push(`/trainer?experiment=${res.uuid}`);
      return;
    } catch (e) {
      console.error(e);
      unlock();
      return;
    }
  };

  const onClickBack = () => {
    router.push("");
  };

  return (
    <div className="d-flex justify-content-between my-3">
      <Button onClick={onClickBack} variant="primary">
        <ChevronLeft />
        Back
      </Button>
      <Button
        onClick={onClickTrain}
        variant="primary"
        disabled={!trainConfig.isValidParams}
      >
        {isLoading ? <Spinner animation="border" size="sm" /> : "Train"}
      </Button>
    </div>
  );
};

export default Pagenation;
