import { range } from "lodash";
import { useCallback } from "react";
import { useRouter } from "next/router";
import { z } from "zod";
import { apiClient } from "~/services/api-client";
import { responseGetGMMJobsItems } from "~/services/route/gmm";

export type Job = z.infer<typeof responseGetGMMJobsItems>;

export const useNumComponents = (item: Job) => {
  const { push } = useRouter();
  const { status, uuid, params } = item;

  if (status === "failure" || status === "pending") {
    return {
      value: NaN,
      optimalValue: NaN,
      range: [],
      handleSelect: () => {},
      handleSubmit: async () => {
        throw new Error("Invalid job submitted");
      },
    };
  }

  const numComponents = range(
    params.minimum_n_components,
    params.maximum_n_components + 1,
    params.step_size
  );

  const handleSelect = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      try {
        const n = parseInt(e.currentTarget.value);
        if (!numComponents.includes(n)) {
          throw new Error("Invalid number of components");
        }
        push(`?experiment=${item.uuid}&n_components=${n}`, undefined, {
          scroll: false,
        });
      } catch (error) {
        console.error(error);
      }
    },
    [numComponents, push, item.uuid]
  );

  const handleSubmit = useCallback(
    async (name: string) => {
      if (item.status !== "success") {
        return;
      }
      try {
        await apiClient.publishGMMJobs({
          name: name,
          uuid: uuid,
          n_components: item.gmm.current_n_components,
        });
      } catch (error) {
        console.error(error);
      }
    },
    [item.status, uuid, item.gmm?.current_n_components]
  );

  return {
    value: item.gmm.current_n_components,
    optimalValue: item.gmm.current_n_components,
    range: numComponents,
    handleSelect,
    handleSubmit,
  };
};
