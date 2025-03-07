import React from "react";
import { Alert } from "react-bootstrap";
import JobCard from "./job-card";
import { useGmmJobs } from "./hooks/use-gmm-jobs";

/**
 * GmmJobsList component displays a list of GMM jobs, separated into running and finished categories.
 * It uses the useGmmJobs hook for state management and data fetching.
 */
const GmmJobsList: React.FC = () => {
  const { runningJobs, finishedJobs } = useGmmJobs();

  /**
   * Render job cards for a list of jobs
   */
  const renderJobCards = (jobs: typeof runningJobs) => {
    return jobs.map((job) => (
      <JobCard
        key={job.uuid}
        name={job.name}
        status={job.status}
        nCompleted={job.trials_current}
        nTotal={job.trials_total}
        duration={job.duration}
        uuid={job.uuid}
      />
    ));
  };

  return (
    <div>
      <div style={{ height: "1rem" }} />
      <legend>Running</legend>
      {runningJobs.length ? (
        renderJobCards(runningJobs)
      ) : (
        <Alert variant="info">No running jobs</Alert>
      )}
      <legend>Finished</legend>
      {finishedJobs.length ? (
        renderJobCards(finishedJobs)
      ) : (
        <Alert variant="info">No finished jobs</Alert>
      )}
    </div>
  );
};

export default GmmJobsList;
