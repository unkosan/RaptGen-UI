import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Alert, Button } from "react-bootstrap";
import { z } from "zod";
import { apiClient } from "~/services/api-client";
import { responseGetGMMJobsItems } from "~/services/route/gmm";
import ParamsTable from "./params-table";
import BicGraph from "./bic-graph";
import LatentGraph from "./latent-graph";
import { ArrowClockwise } from "react-bootstrap-icons";
import { ActionButtons } from "./action-buttons";
import { GmmNumComponentSelector } from "./gmm-job-handler";
import TimeDescription from "./time-description";
import { CurrentInfo } from "./current-info";

type JobItem = z.infer<typeof responseGetGMMJobsItems>;

const Main: React.FC = () => {
  const router = useRouter();
  const currentUUID = router.query.experiment as string | undefined;
  const currentNumComponents = router.query.n_components as string | undefined;
  const [jobItem, setJobItem] = useState<JobItem | null>(null);

  const reflesh = async () => {
    if (!currentUUID) {
      return;
    }

    const res = await apiClient.getGMMJobs({
      queries: {
        n_components:
          currentNumComponents === undefined
            ? undefined
            : parseInt(currentNumComponents),
      },
      params: { uuid: currentUUID },
    });
    setJobItem(res);
  };

  useEffect(() => {
    reflesh();
  }, [currentUUID, currentNumComponents]);

  if (!currentUUID) {
    return <div>Please select items listed left.</div>;
  }

  if (!jobItem) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="justify-content-between d-flex">
        <h3>Experiment: {jobItem.name}</h3>
        <div>
          <Button variant="primary" onClick={reflesh}>
            <div className="align-items-center d-flex">
              <ArrowClockwise />
              <span className="ms-2">Refresh</span>
            </div>
          </Button>
        </div>
      </div>
      <TimeDescription
        startTimeSecond={jobItem.start}
        durationTimeSecond={jobItem.duration}
      />
      <ActionButtons
        uuid={currentUUID}
        refleshFunc={reflesh}
        jobName={jobItem.name}
        jobStatus={jobItem.status}
      />
      <ParamsTable params={jobItem.params} />
      {(jobItem.status === "progress" || jobItem.status === "suspend") && (
        <>
          <legend>Running Job info</legend>
          <CurrentInfo jobItem={jobItem} />
        </>
      )}
      {(jobItem.status === "success" ||
        jobItem.status === "progress" ||
        jobItem.status === "suspend") && (
        <>
          <legend>Optimal GMM</legend>
          <GmmNumComponentSelector uuid={currentUUID} jobItem={jobItem} />
          <LatentGraph
            title="Latent Space"
            vaeData={{
              coordsX: jobItem.latent.coords_x,
              coordsY: jobItem.latent.coords_y,
              randomRegions: jobItem.latent.random_regions,
              duplicates: jobItem.latent.duplicates,
              minCount: 1,
            }}
            gmmData={{
              means: jobItem.gmm.means,
              covariances: jobItem.gmm.covs,
            }}
          />
          <BicGraph
            n_components={jobItem.bic.n_components}
            values={jobItem.bic.bics}
            step_size={jobItem.params.step_size}
          />
        </>
      )}
      {jobItem.status === "failure" && (
        <Alert variant="danger">
          <Alert.Heading>Runtime Error</Alert.Heading>
          <div style={{ fontFamily: "monospace" }}>{jobItem.error_msg}</div>
        </Alert>
      )}
    </div>
  );
};

export default Main;
