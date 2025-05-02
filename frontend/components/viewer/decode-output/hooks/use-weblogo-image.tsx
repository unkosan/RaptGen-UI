import { useEffect, useState } from "react";
import { apiClient } from "~/services/api-client";

interface GridPoint {
  coordX: number;
  coordY: number;
}

/**
 * Hook to fetch and handle weblogo image with toggle functionality
 * @param sessionId - The session ID
 * @param gridPoint - The grid point data
 * @param lock - Whether the fetch is locked
 * @returns weblogo image as base64 string and toggle controls
 */
export const useWeblogoImage = (
  sessionId: string | null,
  gridPoint: GridPoint,
  lock: boolean
) => {
  const [weblogoBase64, setWeblogoBase64] = useState<string>("");
  const [showWeblogo, setShowWeblogo] = useState<boolean>(false);

  useEffect(() => {
    const fetchWeblogoImage = async () => {
      if (lock || !showWeblogo || !sessionId) {
        return;
      }

      try {
        const res = await apiClient.getWeblogo(
          {
            session_uuid: sessionId,
            coords_x: [gridPoint.coordX],
            coords_y: [gridPoint.coordY],
          },
          {
            responseType: "arraybuffer",
          }
        );

        const base64 = Buffer.from(res, "binary").toString("base64");
        setWeblogoBase64(base64);
      } catch (error) {
        console.error("Error fetching weblogo image:", error);
      }
    };

    fetchWeblogoImage();
  }, [sessionId, gridPoint, showWeblogo, lock]);

  /**
   * Toggle the weblogo visibility
   */
  const toggleWeblogo = () => {
    setShowWeblogo(!showWeblogo);
  };

  return { weblogoBase64, showWeblogo, toggleWeblogo };
};
