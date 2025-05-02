import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { apiClient } from "~/services/api-client";
import { usePickGMM, usePickVAE } from "./use-dispatchers";

/**
 * Retrieves VAE model entries from the backend.
 * If not specified in the URL, sets the default VAE model to the first entry.
 * @returns {
 *  entries: {
 *    uuid: string,
 *    name: string,
 *  }[],
 *  isLoading: boolean,
 *  refresh: () => void,
 * }
 */
export const useEntriesVAE = () => {
  const router = useRouter();
  const isReady = router.isReady;
  const queryId = router.query.uuid;
  const [refreshFlag, setRefreshFlag] = useState(false);

  const [entries, setEntries] = useState<
    {
      uuid: string;
      name: string;
    }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  const { setModelId } = usePickVAE();

  useEffect(() => {
    (async () => {
      if (!router.isReady) {
        setEntries([]);
        return;
      }

      setIsLoading(true);
      try {
        const { entries } = await apiClient.getVAEModelNames();
        const name = entries.find((entry) => entry.uuid === queryId)?.name;
        if (queryId && name) {
          setModelId(queryId.toString(), name);
        } else if (entries.length) {
          router.push(`?uuid=${entries[0].uuid}`, undefined, {
            shallow: true,
          });
        } else {
          setModelId("", "");
        }
        setEntries(entries);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [isReady, queryId, refreshFlag]);

  return {
    entries,
    isLoading,
    refresh: () => setRefreshFlag((prev) => !prev),
  };
};

/**
 * Retrieves GMM model entries from the backend.
 * The default GMM model is the first entry.
 * @param vaeId
 * @returns {
 *  entries: {
 *    name: string,
 *    uuid: string,
 *  }[],
 *  isLoading: boolean,
 * }
 */
export const useEntriesGMM = (vaeId: string) => {
  const [entries, setEntries] = useState(
    [] as { name: string; uuid: string }[]
  );
  const [isLoading, setIsLoading] = useState(false);

  const { setModelId } = usePickGMM();

  useEffect(() => {
    (async () => {
      if (!vaeId) {
        setEntries([]);
        return;
      }

      setIsLoading(true);
      try {
        const { entries } = await apiClient.getGMMModelNames({
          queries: {
            vae_uuid: vaeId,
          },
        });
        setModelId(entries.length ? entries[0].uuid : "");
        setEntries(entries);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [vaeId]);

  return { entries, isLoading };
};

/**
 * This hook retrieves the parameters of a VAE model.
 * @param vaeId
 * @returns {
 *  records: {
 *    [key: string]: string,
 *  },
 *  isLoading: boolean,
 * }
 */
export const useParamsVAE = (vaeId: string) => {
  const [records, setRecords] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!vaeId) {
        return;
      }
      setIsLoading(true);
      try {
        const rawRecords: Object = await apiClient.getVAEModelParameters({
          queries: {
            vae_uuid: vaeId,
          },
        });
        const records = Object.fromEntries(
          Object.entries(rawRecords).map(([key, value]) => [key, String(value)])
        );
        setRecords(records);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [vaeId]);

  return {
    records,
    isLoading,
  };
};

/**
 * This hook retrieves the parameters of a GMM model.
 * @param gmmId
 * @returns {
 *  records: {
 *    [key: string]: string,
 *  },
 *  isLoading: boolean,
 * }
 */
export const useParamsGMM = (gmmId: string) => {
  const [records, setRecords] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!gmmId) {
        return;
      }
      setIsLoading(true);
      try {
        const rawRecords: Object = await apiClient.getGMMModelParameters({
          queries: {
            gmm_uuid: gmmId,
          },
        });
        const records = Object.fromEntries(
          Object.entries(rawRecords).map(([key, value]) => [key, String(value)])
        );
        setRecords(records);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [gmmId]);

  return {
    records,
    isLoading,
  };
};
