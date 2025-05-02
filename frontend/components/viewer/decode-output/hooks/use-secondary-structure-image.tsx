import { useEffect, useState } from "react";
import { apiClient } from "~/services/api-client";

interface GridPoint {
  coordX: number;
  coordY: number;
}

/**
 * Hook to fetch and handle secondary structure image with toggle functionality
 * @param gridPoint - The grid point data
 * @param forward - The forward adapter
 * @param reverse - The reverse adapter
 * @param sequence - The decoded sequence
 * @param lock - Whether the fetch is locked
 * @returns secondary structure image as base64 string and toggle controls
 */
export const useSecondaryStructureImage = (
  gridPoint: GridPoint,
  forward: string,
  reverse: string,
  sequence: string,
  lock: boolean
) => {
  const [secondaryStructureBase64, setSecondaryStructureBase64] =
    useState<string>("");
  const [showSecondaryStructure, setShowSecondaryStructure] =
    useState<boolean>(false);

  useEffect(() => {
    const fetchSecondaryStructureImage = async () => {
      if (lock || !showSecondaryStructure) {
        return;
      }

      try {
        const res = await apiClient.getSecondaryStructureImage({
          queries: {
            sequence: forward + sequence.replace(/\_/g, "") + reverse,
          },
          responseType: "arraybuffer",
        });

        const base64 = Buffer.from(res, "binary").toString("base64");
        setSecondaryStructureBase64(base64);
      } catch (error) {
        console.error("Error fetching secondary structure image:", error);
      }
    };

    fetchSecondaryStructureImage();
  }, [gridPoint, forward, reverse, sequence, showSecondaryStructure, lock]);

  /**
   * Toggle the secondary structure visibility
   */
  const toggleSecondaryStructure = () => {
    setShowSecondaryStructure(!showSecondaryStructure);
  };

  return {
    secondaryStructureBase64,
    showSecondaryStructure,
    toggleSecondaryStructure,
  };
};
