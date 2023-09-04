import { useEffect, useState } from "react";
import AddJobButton from "./add-job-button";
import JobCard from "./job-card/job-card";
import { apiClient } from "../../../../services/api-client";
import { responsePostSearchJobs } from "../../../../services/api-client";
import { z } from "zod";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { isEqual } from "lodash";
import { setPageConfig } from "../redux/page-config";
import { useDispatch } from "react-redux";
import { Alert } from "react-bootstrap";

type Jobs = z.infer<typeof responsePostSearchJobs>;

const SideBar: React.FC = () => {
  const selectedJobId = useSelector(
    (state: RootState) => state.pageConfig.parentId
  );
  const selectedChildJobId = useSelector(
    (state: RootState) => state.pageConfig.childId
  );
  const [jobs, setJobs] = useState<Jobs>([]);
  const [runningJobs, setRunningJobs] = useState<Jobs>([]);
  const [finishedJobs, setFinishedJobs] = useState<Jobs>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const dispatch = useDispatch();

  // Update jobs per second
  useEffect(() => {
    const interval = setInterval(() => {
      apiClient
        .postSearchJobs({
          search_regex: searchQuery ? searchQuery : undefined,
        })
        .then((newJobs) => {
          // if (isEqual(newJobs, jobs)) return;
          setJobs(newJobs);
        });
    }, 10000);

    return () => clearInterval(interval);
  }, [searchQuery]);

  // Sort jobs
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
    <>
      <AddJobButton />
      <div style={{ height: "1rem" }} />
      <legend>Running</legend>
      {runningJobs.length ? (
        runningJobs.map((job) => (
          <JobCard
            key={job.uuid}
            name={job.name}
            status={job.status}
            isSelected={job.uuid === selectedJobId}
            duration={job.duration}
            onClick={() => {
              dispatch({
                type: "pageConfig/set",
                payload: {
                  parentId: job.uuid,
                  childId: null,
                },
              });
            }}
            onChildClick={(id) => {
              dispatch({
                type: "pageConfig/set",
                payload: {
                  parentId: job.uuid,
                  childId: id,
                },
              });
            }}
            series={job.series.map((childJob) => {
              return {
                id: childJob.item_id,
                duration: childJob.item_duration,
                status: childJob.item_status,
                epochsCurrent: childJob.item_epochs_current,
                epochsTotal: childJob.item_epochs_total,
              };
            })}
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
            isSelected={job.uuid === selectedJobId}
            duration={job.duration}
            onClick={() => {
              dispatch({
                type: "pageConfig/set",
                payload: {
                  parentId: job.uuid,
                  childId: null,
                },
              });
            }}
            onChildClick={(id) => {
              dispatch({
                type: "pageConfig/set",
                payload: {
                  parentId: job.uuid,
                  childId: id,
                },
              });
            }}
            series={job.series.map((childJob) => {
              return {
                id: childJob.item_id,
                duration: childJob.item_duration,
                status: childJob.item_status,
                epochsCurrent: childJob.item_epochs_current,
                epochsTotal: childJob.item_epochs_total,
              };
            })}
          />
        ))
      ) : (
        <Alert variant="info">No finished jobs</Alert>
      )}
    </>
  );
};

export default SideBar;
