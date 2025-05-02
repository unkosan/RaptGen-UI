import _ from "lodash";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { apiClient } from "~/services/api-client";
import { responseGetItem, responseGetItemChild } from "~/services/route/train";

type ChildItem = z.infer<typeof responseGetItemChild>;
type ParentItem = z.infer<typeof responseGetItem>;

const calculateDefaultChildModelId = (item: ParentItem): number => {
  const summary = item.summary;
  switch (item.status) {
    case "progress":
    case "suspend":
    case "failure":
    case "pending":
      const firstOccurrence = summary.statuses.indexOf(item.status);
      if (firstOccurrence === -1) {
        return 0;
      } else {
        return summary.indices[firstOccurrence];
      }
    case "success":
      const nlls = summary.minimum_NLLs.map((value, index) => {
        return value === null || isNaN(value) ? Infinity : value;
      });
      const optimal = nlls.indexOf(_.min(nlls) as number);

      if (optimal === -1) {
        return 0;
      } else {
        return summary.indices[optimal];
      }
    default:
      return 0;
  }
};

export const useJobItem = () => {
  const { isReady, query } = useRouter();
  const { experiment: pid, job: cid } = query;
  const [refreshFlag, setRefreshFlag] = useState<boolean>(false);
  const [pItem, setPItem] = useState<ParentItem | null>(null);
  const [cItem, setCItem] = useState<ChildItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchParent = async () => {
      if (!isReady || !pid) {
        return;
      }

      setIsLoading(true);
      try {
        const pItem = await apiClient.getItem({
          params: { parent_uuid: pid as string },
        });
        setPItem(pItem);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchParent();
  }, [isReady, pid, refreshFlag]);

  useEffect(() => {
    const fetchChild = async () => {
      if (!isReady || !pid || pid !== pItem?.uuid) {
        return;
      }

      setIsLoading(true);
      try {
        const defaultCid = calculateDefaultChildModelId(pItem);
        const cItem = await apiClient.getChildItem({
          params: {
            parent_uuid: pid as string,
            child_id: cid ? parseInt(cid as string) : defaultCid,
          },
        });
        setCItem(cItem);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchChild();
  }, [isReady, pid, cid, pItem, refreshFlag]);

  return {
    isLoading,
    pid: pid?.toString(),
    cid: cid?.toString(),
    pItem,
    cItem,
    refresh: () => setRefreshFlag((prev) => !prev),
  };
};
