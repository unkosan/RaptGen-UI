import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { apiClient } from "~/services/api-client";
import { responseGetGMMJobsItems } from "~/services/route/gmm";

type JobItem = z.infer<typeof responseGetGMMJobsItems>;

export const useJobItem = () => {
  const { isReady, query } = useRouter();
  const { experiment: uuid, n_components } = query;
  const [jobItem, setJobItem] = useState<JobItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [refreshFlag, setRefreshFlag] = useState<boolean>(false);

  useEffect(() => {
    const fetchJob = async () => {
      if (!isReady || !uuid) {
        return;
      }

      setIsLoading(true);
      try {
        const jobInfo = await apiClient.getGMMJobs({
          params: { uuid: uuid as string },
          queries: {
            n_components: n_components
              ? parseInt(n_components as string)
              : undefined,
          },
        });
        setJobItem(jobInfo);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchJob();
  }, [isReady, uuid, n_components, refreshFlag]);

  return {
    uuid: uuid?.toString(),
    isLoading,
    jobItem,
    refresh: () => setRefreshFlag((prev) => !prev),
  };
};
