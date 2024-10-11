import { useState } from "react";
import { Alert, Form, InputGroup } from "react-bootstrap";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { cloneDeep } from "lodash";
import { det, inv, matrix, multiply, subtract, transpose } from "mathjs";
import { Button } from "react-bootstrap";

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

  const gmmData = useSelector((state: RootState) => state.gmmData);
  const vaeData = useSelector((state: RootState) => state.vaeData);

  const length = gmmData.means.length;
  if (length === 0) {
    return <Alert variant="warning">No GMM selected</Alert>;
  }

  const onDownload = () => {
    (async () => {
      const seq = vaeData.map((d) => d.randomRegion);
      const coordX = vaeData.map((d) => d.coordX);
      const coordY = vaeData.map((d) => d.coordY);
      const duplicates = vaeData.map((d) => d.duplicates);

      // const weights = gmmData.weights;
      const means = gmmData.means;
      const covariances = gmmData.covariances;

      // column: cluster
      // row: coord
      let probsTable: number[][] = Array(seq.length).fill(Array(length));
      probsTable = probsTable.map((row, i) => {
        const coords = [coordX[i], coordY[i]];
        // const probs = weights.map((w, j) => {
        //   return calcProb(w, means[j], covariances[j], coords);
        // });
        const probs = means.map((m, j) => {
          return calcProb(1, m, covariances[j], coords);
        }); // must be changed later
        return probs;
      });

      console.log(probsTable);

      if (asProbs) {
        if (cluster === -1) {
          // download all clusters as probabilities
          const header =
            "seq,coordX,coordY,duplicates," +
            means.map((_, i) => "cluster" + i).join(",");
          const body = seq.map((s, i) => {
            return [
              s,
              coordX[i],
              coordY[i],
              duplicates[i],
              ...probsTable[i],
            ].join(",");
          });
          const csv = header + "\n" + body.join("\n");
          downloadText(csv, "all_probs.csv");
        } else {
          // download selected cluster as probabilities
          const header = "seq,coordX,coordY,duplicates,prob";
          const body = seq.map((s, i) => {
            return [
              s,
              coordX[i],
              coordY[i],
              duplicates[i],
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
          let records = seq.map((s, i) => {
            const maxProb = Math.max(...probsTable[i]);
            const maxCluster = probsTable[i].indexOf(maxProb);
            return [s, maxCluster];
          });
          if (cluster !== -1) {
            // filter records with the selected cluster
            records = records.filter((r) => r[1] === cluster);
            const fasta = records
              .map((r) => ">" + r[1] + "\n" + r[0])
              .join("\n");
            downloadText(fasta, "cluster_" + cluster + ".fasta");
          } else {
            // download all clusters as fasta
            const fasta = records
              .map((r) => ">" + r[1] + "\n" + r[0])
              .join("\n");
            downloadText(fasta, "all_clusters.fasta");
          }
        } else {
          // download as csv format, but not probabilities
          // pick the cluster with the highest probability
          const header = "seq,coordX,coordY,duplicates,cluster";
          let records = seq.map((s, i) => {
            const maxProb = Math.max(...probsTable[i]);
            const maxCluster = probsTable[i].indexOf(maxProb);
            return [s, coordX[i], coordY[i], duplicates[i], maxCluster];
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
    })();
  };

  return (
    <Form.Group className="mb-3">
      <Form.Switch
        label="Download as probabilities"
        checked={asProbs}
        onChange={() => setAsProbs(!asProbs)}
      />
      <Form.Switch
        label="Download as Fasta format"
        checked={asFasta}
        onChange={() => setAsFasta(!asFasta)}
        disabled={asProbs}
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
    </Form.Group>
  );
};

export default DownloadCluster;
