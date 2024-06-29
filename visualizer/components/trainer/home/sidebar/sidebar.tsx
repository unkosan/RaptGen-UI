import { useEffect, useState } from "react";
import AddJobButton from "./add-job-button";
import JobCard from "./job-card/job-card";
import { apiClient } from "~/services/api-client";
import { responsePostSearchJobs } from "~/services/route/train";
import { z } from "zod";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
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
    const updateFunc = () => {
      apiClient
        .postSearchJobs({
          search_regex: searchQuery ? searchQuery : undefined,
        })
        .then((newJobs) => {
          // if (isEqual(newJobs, jobs)) return;
          setJobs(newJobs);
        });
    };
    updateFunc();
    const interval = setInterval(updateFunc, 5000);

    return () => clearInterval(interval);
  }, [searchQuery]);

  // useSWR may be good for automatical update, but does not reflect current epochs
  // const fetcher = (url: string) =>
  //   apiClient.postSearchJobs({
  //     search_regex: searchQuery ? searchQuery : undefined,
  //   });
  // const { jobs: data, error, isLoading } = useSWR("/api/train/jobs/search", fetcher);

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
              const net_duration =
                childJob.item_status === "progress"
                  ? Date.now() -
                    (childJob.item_datetime_start -
                      childJob.item_duration_suspend) *
                      1000
                  : childJob.item_status === "pending"
                  ? 0
                  : ((childJob.item_datetime_laststop as number) -
                      childJob.item_datetime_start -
                      childJob.item_duration_suspend) *
                    1000;
              return {
                id: childJob.item_id,
                duration: net_duration,
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
                duration: childJob.item_datetime_laststop
                  ? childJob.item_datetime_laststop
                  : Date.now() -
                    childJob.item_datetime_start -
                    childJob.item_duration_suspend,
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
