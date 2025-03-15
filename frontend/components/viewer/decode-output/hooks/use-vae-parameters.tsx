import { useEffect, useState } from "react";
import { apiClient } from "~/services/api-client";

/**
 * Hook to fetch VAE model parameters
 * @param vaeId - The ID of the VAE model
 * @returns forward and reverse adapter values
 */
export const useVaeParameters = (vaeId: string | null) => {
  const [forward, setForward] = useState<string>("");
  const [reverse, setReverse] = useState<string>("");

  useEffect(() => {
    const fetchVaeParameters = async () => {
      if (!vaeId) {
        return;
      }

      try {
        const res = await apiClient.getVAEModelParameters({
          queries: {
            vae_uuid: vaeId,
          },
        });

        setForward(res.forward_adapter || "");
        setReverse(res.reverse_adapter || "");
      } catch (error) {
        console.error("Error fetching VAE parameters:", error);
      }
    };

    fetchVaeParameters();
  }, [vaeId]);

  return { forward, reverse };
};
