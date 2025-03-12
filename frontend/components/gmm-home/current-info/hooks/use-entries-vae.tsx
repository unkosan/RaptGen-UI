import { useEffect, useState } from "react";
import { apiClient } from "~/services/api-client";

export const useEntriesVAE = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [entries, setEntries] = useState<
    {
      uuid: string;
      name: string;
    }[]
  >([]);

  useEffect(() => {
    const fetchEntries = async () => {
      setIsLoading(true);
      try {
        const { entries } = await apiClient.getVAEModelNames();
        setEntries(entries);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEntries();
  }, []);

  return {
    entries,
  };
};
