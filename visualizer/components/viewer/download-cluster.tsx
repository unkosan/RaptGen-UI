import { useState } from "react";
import { Alert, Card, Form, InputGroup } from "react-bootstrap";
import { useSelector } from "react-redux";
import { RootState } from "./redux/store";
import { cloneDeep } from "lodash";
import { det, inv, matrix, multiply, subtract, transpose } from "mathjs";
import { Button } from "react-bootstrap";
import { apiClient } from "~/services/api-client";

const calcProb = (
  weight: number,
  mean: number[],
  covariance: number[][],
  coords: number[]
) => {
  const coval = matrix(cloneDeep(covariance));
  const coef = 1 / (2 * Math.PI * Math.sqrt(det(coval)));
  const invcov = inv(coval);

  const diff = matrix(subtract(coords, mean));
  const expMat = multiply(
    transpose(diff),
    multiply(invcov, diff)
  ) as unknown as number;
  const exp = -0.5 * expMat;

  const prob = weight * coef * Math.exp(exp);
  return prob;
};

const downloadText = (text: string, filename: string) => {
  const link = document.createElement("a");
  link.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(text)
  );
  link.setAttribute("download", filename);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const DownloadCluster: React.FC = () => {
  // -1 means all clusters
  const [cluster, setCluster] = useState<number>(-1);

  const [asProbs, setAsProbs] = useState<boolean>(false);
  const [asFasta, setAsFasta] = useState<boolean>(false);

  const sessionConfig = useSelector((state: RootState) => state.sessionConfig);

  if (!sessionConfig.gmmId) {
    return <Alert variant="warning">No GMM selected</Alert>;
  }

  const onDownload = async () => {
    const selex = await apiClient.getSelexData({
      queries: {
        vae_uuid: sessionConfig.vaeId,
      },
    });
    const gmm = await apiClient.getGMMModel({
      queries: {
        gmm_uuid: sessionConfig.gmmId,
      },
    });

    // column: cluster
    // row: coord
    let probsTable: number[][] = Array(selex.random_regions.length).fill(
      Array(length)
    );
    probsTable = probsTable.map((row, i) => {
      const coords = [selex.coord_x[i], selex.coord_y[i]];
      const probs = gmm.weights.map((w, j) => {
        return calcProb(w, gmm.means[j], gmm.covariances[j], coords);
      });
      return probs;
    });

    if (asProbs) {
      if (cluster === -1) {
        // download all clusters as probabilities
        const header =
          "seq,coordX,coordY,duplicates," +
          gmm.means.map((_, i) => "cluster" + i).join(",");
        const body = selex.random_regions.map((s, i) => {
          return [
            s,
            selex.coord_x[i],
            selex.coord_y[i],
            selex.duplicates[i],
            ...probsTable[i],
          ].join(",");
        });
        const csv = header + "\n" + body.join("\n");
        downloadText(csv, "all_probs.csv");
      } else {
        // download selected cluster as probabilities
        const header = "seq,coordX,coordY,duplicates,prob";
        const body = selex.random_regions.map((s, i) => {
          return [
            s,
            selex.coord_x[i],
            selex.coord_y[i],
            selex.duplicates[i],
            probsTable[i][cluster],
          ].join(",");
        });
        const csv = header + "\n" + body.join("\n");
        downloadText(csv, "cluster_" + cluster + "_probs.csv");
      }
    } else {
      if (asFasta) {
        // download as fasta format
        // pick the cluster with the highest probability
        let records = selex.random_regions.map((s, i) => {
          const maxProb = Math.max(...probsTable[i]);
          const maxCluster = probsTable[i].indexOf(maxProb);
          return [s, maxCluster];
        });
        if (cluster !== -1) {
          // filter records with the selected cluster
          records = records.filter((r) => r[1] === cluster);
          const fasta = records.map((r) => ">" + r[1] + "\n" + r[0]).join("\n");
          downloadText(fasta, "cluster_" + cluster + ".fasta");
        } else {
          // download all clusters as fasta
          const fasta = records.map((r) => ">" + r[1] + "\n" + r[0]).join("\n");
          downloadText(fasta, "all_clusters.fasta");
        }
      } else {
        // download as csv format, but not probabilities
        // pick the cluster with the highest probability
        const header = "seq,coordX,coordY,duplicates,cluster";
        let records = selex.random_regions.map((s, i) => {
          const maxProb = Math.max(...probsTable[i]);
          const maxCluster = probsTable[i].indexOf(maxProb);
          return [
            s,
            selex.coord_x[i],
            selex.coord_y[i],
            selex.duplicates[i],
            maxCluster,
          ];
        });
        if (cluster !== -1) {
          // filter records with the selected cluster
          records = records.filter((r) => r[4] === cluster);
          const body = records.map((r) => r.join(",")).join("\n");
          const csv = header + "\n" + body;
          downloadText(csv, "cluster_" + cluster + ".csv");
        } else {
          // download all clusters as csv
          const body = records.map((r) => r.join(",")).join("\n");
          const csv = header + "\n" + body;
          downloadText(csv, "all_clusters.csv");
        }
      }
    }
  };

  return (
    <Card className="mb-3">
      <Card.Body>
        <Form.Switch
          label="Download as probabilities"
          checked={asProbs}
          onChange={() => setAsProbs(!asProbs)}
          className="mb-2"
        />
        <Form.Switch
          label="Download as Fasta format"
          checked={asFasta}
          onChange={() => setAsFasta(!asFasta)}
          disabled={asProbs}
          className="mb-2"
        />
        <InputGroup>
          <Form.Select
            id="cluster"
            onChange={(e) => setCluster(parseInt(e.target.value))}
          >
            <option value={-1}>All clusters</option>
            {Array.from(Array(length).keys()).map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </Form.Select>
          <Button onClick={onDownload}>Download</Button>
        </InputGroup>
      </Card.Body>
    </Card>
  );
};

export default DownloadCluster;
