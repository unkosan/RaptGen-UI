import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { Button, Card, Form, Spinner } from "react-bootstrap";
import { ALL_CLUSTERS, useDownloader } from "./hooks/use-downloader";

const Downloader: React.FC = () => {
  const [cluster, setCluster] = useState<number>(ALL_CLUSTERS);

  const { vaeId, vaeName, gmmId } = useSelector(
    (state: RootState) => state.sessionConfig
  );

  const {
    isSavingCSV,
    isSavingFASTA,
    numComponents,
    onDownloadCSV,
    onDownloadFASTA,
  } = useDownloader(gmmId, vaeId, vaeName);

  return (
    <Card className="mb-3">
      <Card.Body>
        <Form.Group>
          <Form.Label>Target Cluster</Form.Label>
          <Form.Select
            className="mb-3"
            onChange={(e) => setCluster(parseInt(e.target.value))}
          >
            <option value={ALL_CLUSTERS}>All Clusters</option>
            {Array.from({ length: numComponents }, (_, i) => i).map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </Form.Select>
          <Button
            className="me-2"
            onClick={() => onDownloadCSV(cluster)}
            disabled={isSavingCSV || isSavingFASTA}
          >
            {isSavingCSV ? (
              <Spinner animation="border" size="sm" />
            ) : (
              "Download as CSV"
            )}
          </Button>
          <Button
            onClick={() => onDownloadFASTA(cluster)}
            disabled={isSavingCSV || isSavingFASTA}
          >
            {isSavingFASTA ? (
              <Spinner animation="border" size="sm" />
            ) : (
              "Download as FASTA"
            )}
          </Button>
        </Form.Group>
      </Card.Body>
    </Card>
  );
};

export default Downloader;
