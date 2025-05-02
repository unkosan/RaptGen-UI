import { useRouter } from "next/router";
import { useCallback } from "react";
import { apiClient } from "~/services/api-client";

export const useActions = (uuid: string, refreshFunc: () => void) => {
  const { push } = useRouter();

  const handleRename = useCallback(
    async (newName: string) => {
      try {
        await apiClient.updateGMMJobs(
          {
            target: "name",
            value: newName,
          },
          {
            params: {
              uuid: uuid,
            },
          }
        );
        await refreshFunc();
      } catch (error) {
        console.error(error);
      }
    },
    [uuid, refreshFunc]
  );

  const handleDelete = useCallback(async () => {
    try {
      await apiClient.deleteGMMJobs(undefined, {
        params: {
          uuid: uuid,
        },
      });
    } catch (error) {
      console.error(error);
    }
    push("/gmm");
  }, [uuid, push]);

  const handleStop = useCallback(async () => {
    try {
      await apiClient.suspendGMMJobs({ uuid });
      await refreshFunc();
    } catch (error) {
      console.error(error);
    }
  }, [uuid, refreshFunc]);

  const handleResume = useCallback(async () => {
    try {
      await apiClient.resumeGMMJobs({
        uuid: uuid,
      });
      await refreshFunc();
    } catch (error) {
      console.error(error);
    }
  }, [uuid, refreshFunc]);

  return {
    handleRename,
    handleDelete,
    handleStop,
    handleResume,
  };
};
