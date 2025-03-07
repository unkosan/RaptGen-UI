import React from "react";
import JobCard from "./job-card";
import { Alert } from "react-bootstrap";
import { useVaeJobs } from "./hooks/use-vae-jobs";

/**
 * VaeJobsList component displays a list of VAE jobs, separated into running and finished categories.
 * It uses the useVaeJobs hook for state management and data fetching.
 */
const VaeJobsList: React.FC = () => {
  const {
    runningJobs,
    finishedJobs,
    experimentId,
    handleJobClick,
    handleChildJobClick,
    calculateRunningSeriesItem,
    calculateFinishedSeriesItem,
  } = useVaeJobs();

  return (
    <>
      <div style={{ height: "1rem" }} />
      <legend>Running</legend>
      {runningJobs.length ? (
        runningJobs.map((job) => (
          <JobCard
            key={job.uuid}
            name={job.name}
            status={job.status}
            isSelected={job.uuid === experimentId}
            onClick={() => handleJobClick(job.uuid)}
            onChildClick={(id) => handleChildJobClick(job.uuid, id)}
            series={job.series.map(calculateRunningSeriesItem)}
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
            isSelected={job.uuid === experimentId}
            onClick={() => handleJobClick(job.uuid)}
            onChildClick={(id) => handleChildJobClick(job.uuid, id)}
            series={job.series.map(calculateFinishedSeriesItem)}
          />
        ))
      ) : (
        <Alert variant="info">No finished jobs</Alert>
      )}
    </>
  );
};

export default VaeJobsList;
