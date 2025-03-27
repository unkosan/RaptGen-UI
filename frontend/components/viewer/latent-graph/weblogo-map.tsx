import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { apiClient } from "~/services/api-client";
import { Card, Image } from "react-bootstrap";
import LoadingPane from "~/components/common/loading-pane";

const WeblogoMap: React.FC = () => {
  const sessionId = useSelector(
    (state: RootState) => state.sessionConfig.sessionId
  );
  const [weblogoBase64, setWeblogoBase64] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!sessionId) {
      setWeblogoBase64("");
    }

    setIsLoading(true);

    (async () => {
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
    })();
  }, [sessionId]);

  return (
    <Card className="mb-3">
      <Card.Body>
        {isLoading ? (
          <div className="w-100" style={{ aspectRatio: "16/9" }}>
            <LoadingPane label="Loading WebLogo map..." />
          </div>
        ) : (
          <Image
            src={`data:image/png;base64,${weblogoBase64}`}
            fluid
            alt="Weblogo Map"
          />
        )}
      </Card.Body>
    </Card>
  );
};

export default WeblogoMap;
