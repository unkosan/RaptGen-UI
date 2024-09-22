import { formatDuration, intervalToDuration } from "date-fns";

import { range } from "lodash";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Badge, Button, Form, InputGroup } from "react-bootstrap";
import { z } from "zod";
import { apiClient } from "~/services/api-client";
import { responseGetGMMJobsItems } from "~/services/route/gmm";
import ParamsTable from "./params-table";
import BicGraph from "./bic-graph";
import LatentGraph from "./latent-graph";

type JobItem = z.infer<typeof responseGetGMMJobsItems>;

const Main: React.FC = () => {
  const router = useRouter();
  const currentUUID = router.query.experiment as string | undefined;
  const currentNumComponents = router.query.n_components as string | undefined;
  const [jobItem, setJobItem] = useState<JobItem | null>(null);

  useEffect(() => {
    (async () => {
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
    })();
  }, [currentUUID, currentNumComponents]);

  if (!currentUUID) {
    return <div>Please select items listed left.</div>;
  }

  if (!jobItem) {
    return <div>Loading...</div>;
  }

  const numComponents = range(
    jobItem.params.minimum_n_components,
    jobItem.params.maximum_n_components + 1,
    jobItem.params.step_size
  );

  console.log(jobItem.status);
  return (
    <div>
      <h3>Experiment: {jobItem.name}</h3>
      <p>
        <div>Start time: {new Date(jobItem.start * 1000).toLocaleString()}</div>
        <div>
          Running duration:{" "}
          {formatDuration(
            intervalToDuration({ start: 0, end: jobItem.duration })
          )}
        </div>
      </p>
      <p className="d-flex align-items-center">
        Actions:
        {jobItem.status === "progress" && (
          <Badge pill bg="primary" className="align-self-center mx-1">
            Stop
          </Badge>
        )}
        {jobItem.status === "suspend" && (
          <Badge pill bg="primary" className="align-self-center mx-1">
            Resume
          </Badge>
        )}
        <Badge pill bg="primary" className="align-self-center mx-1">
          Rename
        </Badge>
        <Badge pill bg="danger" className="align-self-center mx-1">
          Delete
        </Badge>
      </p>
      {jobItem.status !== "failure" &&
        jobItem.status !== "pending" &&
        jobItem.status !== "success" && (
          <>
            <legend>Currently Running</legend>
            <p>
              <div>Target: {jobItem.target}</div>
              <div>
                The number of Gaussian distribution components:
                {jobItem.current_states.n_components}
              </div>
              <div>
                Trial:
                {jobItem.current_states.trial}
              </div>
            </p>
          </>
        )}
      {jobItem.status !== "failure" && jobItem.status !== "pending" && (
        <>
          <legend>Optimal GMM</legend>
          <InputGroup>
            <InputGroup.Text>Number of components</InputGroup.Text>
            <Form.Select
              onChange={(e) => {
                const n = parseInt(e.currentTarget.value);
                router.push(
                  `?experiment=${currentUUID}&n_components=${n}`,
                  undefined,
                  {
                    scroll: false,
                  }
                );
              }}
            >
              {numComponents.map((n) => (
                <option
                  key={n}
                  value={n}
                  selected={jobItem.gmm.current_n_components === n}
                >
                  {n}
                  {n === jobItem.gmm.optimal_n_components ? "(optimal)" : null}
                </option>
              ))}
            </Form.Select>
            {jobItem.status === "success" && (
              <Button variant="primary">Add to viewer dataset</Button>
            )}
          </InputGroup>
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
          <legend>BIC distribution</legend>
          <BicGraph n_components={jobItem.bic.hue} values={jobItem.bic.bic} />
        </>
      )}
      <legend>Parameters</legend>
      <ParamsTable params={jobItem.params} />
    </div>
  );
};

export default Main;
