import { useEffect, useState } from "react";
import { apiClient } from "~/services/api-client";
import { responsePostSearchJobs } from "~/services/route/train";
import { z } from "zod";
import { useRouter } from "next/router";

export type Jobs = z.infer<typeof responsePostSearchJobs>;
export type Job = Jobs[number];
export type ChildJob = Job["series"][number];

export interface SeriesItem {
  id: number;
  duration: number;
  status: "success" | "failure" | "pending" | "progress" | "suspend";
  epochsCurrent: number;
  epochsTotal: number;
}

export interface UseVaeJobsReturn {
  runningJobs: Jobs;
  finishedJobs: Jobs;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  experimentId: string | undefined;
  handleJobClick: (jobUuid: string) => void;
  handleChildJobClick: (jobUuid: string, childId: number) => void;
  calculateRunningSeriesItem: (childJob: ChildJob) => SeriesItem;
  calculateFinishedSeriesItem: (childJob: ChildJob) => SeriesItem;
}

/**
 * Custom hook for managing VAE jobs data and related operations.
 * Handles fetching, sorting, and processing of job data.
 */
export function useVaeJobs(): UseVaeJobsReturn {
  const router = useRouter();
  const experimentId = router.query.experiment as string | undefined;

  const [jobs, setJobs] = useState<Jobs>([]);
  const [runningJobs, setRunningJobs] = useState<Jobs>([]);
  const [finishedJobs, setFinishedJobs] = useState<Jobs>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch jobs data and set up interval for periodic updates
  useEffect(() => {
    const updateFunc = async () => {
      const res = await apiClient.postSearchJobs({
        search_regex: searchQuery ? searchQuery : undefined,
      });
      setJobs(res);
    };
    updateFunc();
    const interval = setInterval(updateFunc, 5000);

    return () => clearInterval(interval);
  }, [searchQuery]);

  // Sort jobs into running and finished categories
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

  // Navigation handlers
  const handleJobClick = (jobUuid: string) => {
    router.push(`?experiment=${jobUuid}`, undefined, {
      scroll: false,
    });
  };

  const handleChildJobClick = (jobUuid: string, childId: number) => {
    router.push(`?experiment=${jobUuid}&job=${childId}`, undefined, {
      scroll: false,
    });
  };

  // Helper functions for calculating series items
  const calculateRunningSeriesItem = (childJob: ChildJob): SeriesItem => {
    const net_duration =
      childJob.item_status === "progress"
        ? Date.now() -
          (childJob.item_datetime_start - childJob.item_duration_suspend) * 1000
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
  };

  const calculateFinishedSeriesItem = (childJob: ChildJob): SeriesItem => {
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
  };

  return {
    runningJobs,
    finishedJobs,
    searchQuery,
    setSearchQuery,
    experimentId,
    handleJobClick,
    handleChildJobClick,
    calculateRunningSeriesItem,
    calculateFinishedSeriesItem,
  };
}
