import { Alert } from "react-bootstrap";
import JobCard from "./job-card";
import { z } from "zod";
import { responsePostGMMJobsSearch } from "~/services/route/gmm";
import { useEffect, useState } from "react";
import { apiClient } from "~/services/api-client";

type Jobs = z.infer<typeof responsePostGMMJobsSearch>;

const GmmJobsList: React.FC = () => {
  const [jobs, setJobs] = useState<Jobs>([]);
  const [runningJobs, setRunningJobs] = useState<Jobs>([]);
  const [finishedJobs, setFinishedJobs] = useState<Jobs>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Update jobs per 5 second
  useEffect(() => {
    const updateFunc = async () => {
      const res = await apiClient.searchGMMJobs({
        search_regex: searchQuery ? searchQuery : undefined,
      });
      setJobs(res);
    };
    updateFunc();
    const interval = setInterval(updateFunc, 5000);

    return () => clearInterval(interval);
  }, [searchQuery]);

  useEffect(() => {
    let fJobs: Jobs = [];
    let rJobs: Jobs = [];
    for (let job of jobs) {
      if (job.status === "success" || job.status === "failure") {
        fJobs.push(job);
      } else {
        rJobs.push(job);
      }
    }
    setFinishedJobs(fJobs);
    setRunningJobs(rJobs);
  }, [jobs]);

  return (
    <div>
      <div style={{ height: "1rem" }} />
      <legend>Running</legend>
      {runningJobs.length ? (
        runningJobs.map((job) => (
          <JobCard
            key={job.uuid}
            name={job.name}
            status={job.status}
            nCompleted={job.trials_current}
            nTotal={job.trials_total}
            duration={job.duration}
            uuid={job.uuid}
          />
        ))
      ) : (
        <Alert variant="info">No running jobs</Alert>
      )}
      <legend>Finished</legend>
      {finishedJobs.length ? (
        finishedJobs.map((job) => (
          <JobCard
            key={job.uuid}
            name={job.name}
            status={job.status}
            nCompleted={job.trials_current}
            nTotal={job.trials_total}
            duration={job.duration}
            uuid={job.uuid}
          />
        ))
      ) : (
        <Alert variant="info">No finished jobs</Alert>
      )}
    </div>
  );
};

export default GmmJobsList;
