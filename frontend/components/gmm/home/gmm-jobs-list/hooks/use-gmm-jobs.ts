import { useEffect, useState } from "react";
import { apiClient } from "~/services/api-client";
import { responsePostGMMJobsSearch } from "~/services/route/gmm";
import { z } from "zod";

export type Jobs = z.infer<typeof responsePostGMMJobsSearch>;
export type Job = Jobs[number];

export interface UseGmmJobsReturn {
  runningJobs: Jobs;
  finishedJobs: Jobs;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

/**
 * Custom hook for managing GMM jobs data and related operations.
 * Handles fetching, sorting, and processing of job data.
 */
export function useGmmJobs(): UseGmmJobsReturn {
  const [jobs, setJobs] = useState<Jobs>([]);
  const [runningJobs, setRunningJobs] = useState<Jobs>([]);
  const [finishedJobs, setFinishedJobs] = useState<Jobs>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch jobs data and set up interval for periodic updates
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

  return {
    runningJobs,
    finishedJobs,
    searchQuery,
    setSearchQuery,
  };
}
