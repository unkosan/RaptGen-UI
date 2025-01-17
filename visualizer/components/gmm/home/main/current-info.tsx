import { Alert } from "react-bootstrap";
import { z } from "zod";
import { useAsyncMemo } from "~/hooks/common";
import { apiClient } from "~/services/api-client";
import { responseGetGMMJobsItems } from "~/services/route/gmm";

export const CurrentInfo: React.FC<{
  jobItem: z.infer<typeof responseGetGMMJobsItems>;
}> = ({ jobItem }) => {
  const vaeEntries = useAsyncMemo(
    async () => {
      const res = await apiClient.getVAEModelNames();
      return res.entries;
    },
    [],
    []
  );

  if (
    jobItem.status === "success" ||
    jobItem.status === "pending" ||
    jobItem.status === "failure"
  ) {
    return <Alert variant="info">Job already finished or not started.</Alert>;
  }

  return (
    <p>
      <span className="fw-semibold">Target: </span>
      {vaeEntries.find((entry) => entry.uuid === jobItem.target)?.name}
      <br />
      <span className="fw-semibold">
        The number of Gaussian distribution components:{" "}
      </span>
      {jobItem.current_states.n_components}
      <br />
      <span className="fw-semibold">Trial: </span>
      {jobItem.current_states.trial}
    </p>
  );
};
