import { Card, Image } from "react-bootstrap";
import LoadingPane from "~/components/common/loading-pane";
import { useWeblogoMap } from "./hooks/use-weblogo-map";

const WeblogoMap: React.FC = () => {
  const { isLoading, weblogoBase64 } = useWeblogoMap();

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
