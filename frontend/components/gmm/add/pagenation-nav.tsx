import { useSelector } from "react-redux";
import { RootState } from "./redux/store";
import { useEffect, useState } from "react";
import { apiClient } from "~/services/api-client";
import { Button, Spinner } from "react-bootstrap";
import { useRouter } from "next/router";

const PagenationNav: React.FC = () => {
  const router = useRouter();
  const params = useSelector((state: RootState) => state.params);
  const paramsValid = useSelector((state: RootState) => state.paramsValid);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      return;
    }

    (async () => {
      const res = await apiClient.submitGMMJobs({
        params: {
          minimum_n_components: params.minNumComponents,
          maximum_n_components: params.maxNumComponents,
          step_size: params.stepSize,
          n_trials_per_component: params.numTrials,
        },
        target: params.vaeId,
        name: params.gmmName,
      });
      setIsLoading(false);
      router.push(`/gmm?experiment=${res.uuid}`);
    })();
  }, [isLoading]);

  return (
    <div className="d-flex justify-content-between my-3">
      <Button
        variant="primary"
        onClick={() => {
          router.push("/gmm");
        }}
      >
        Cancel
      </Button>

      <Button
        onClick={() => {
          setIsLoading(true);
        }}
        disabled={
          !(
            paramsValid.vaeId &&
            paramsValid.gmmName &&
            paramsValid.minNumComponents &&
            paramsValid.maxNumComponents &&
            paramsValid.stepSize &&
            paramsValid.numTrials
          )
        }
      >
        {isLoading ? <Spinner animation="border" size="sm" /> : "Train"}
      </Button>
    </div>
  );
};

export default PagenationNav;
