import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { apiClient } from "~/services/api-client";

export const useWeblogoMap = () => {
  const sessionId = useSelector(
    (state: RootState) => state.sessionConfig.sessionId
  );
  const [weblogoBase64, setWeblogoBase64] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchWeblogoMap = async () => {
      if (!sessionId) {
        setWeblogoBase64("");
      }

      setIsLoading(true);

      try {
        const res = await apiClient.getWeblogoMap(
          {
            session_uuid: sessionId,
          },
          {
            responseType: "arraybuffer",
          }
        );
        const base64 = Buffer.from(res, "binary").toString("base64");
        setWeblogoBase64(base64);
      } catch (error) {
        console.error("Error fetching weblogo map:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeblogoMap();
  }, [sessionId]);

  return {
    isLoading,
    weblogoBase64,
  };
};
