import { useEffect, useState } from "react";
import { apiClient } from "~/services/api-client";

interface GridPoint {
  coordX: number;
  coordY: number;
}

/**
 * Hook to fetch decoded sequences
 * @param gridPoint - The grid point data
 * @param sessionId - The session ID
 * @param lock - Whether the fetch is locked
 * @returns decoded sequence and loading state
 */
export const useSequenceDecoder = (
  gridPoint: GridPoint,
  sessionId: string,
  lock: boolean
) => {
  const [sequence, setSequence] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchDecodedSequence = async () => {
      if (lock || !sessionId) {
        return;
      }

      setIsLoading(true);
      try {
        const resDecode = await apiClient.decode({
          session_uuid: sessionId,
          coords_x: [gridPoint.coordX],
          coords_y: [gridPoint.coordY],
        });
        const decoded = resDecode.sequences[0];
        setSequence(decoded);
      } catch (error) {
        console.error("Error decoding sequence:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDecodedSequence();
  }, [lock, sessionId, gridPoint]);

  return { sequence, isLoading };
};
