import React, { useState, useEffect } from "react";
import { Button, Form, InputGroup, Spinner } from "react-bootstrap";
import { useSelector } from "react-redux";

import { RootState } from "../redux/store";

import { det, inv, matrix, multiply, subtract, transpose } from "mathjs";

const objectsToCsv = (
  header: string[],
  data: [string[], number[], number[], ...any[][]]
) => {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += header.join(",") + "\n";
  for (let i = 0; i < data[0].length; i++) {
    let row = data.map((elem) => elem[i]);
    csvContent += row.join(",") + "\n";
  }
  return csvContent;
};

const objectsToFasta = (
  clusterName: string,
  data: [string[], number[], number[], ...any[][]]
) => {
  let fastaContent = "data:text/plain;charset=utf-8,";
  for (let i = 0; i < data[0].length; i++) {
    let entry = data.map((elem) => elem[i]);
    const seq = entry[0];
    fastaContent += `>${clusterName}_${i}\n`;
    fastaContent += `${seq}\n`;
  }
  return fastaContent;
};

const DownloadCluster: React.FC = () => {
  const [cluster, setCluster] = useState<number>(-1); // -1 means all clusters
  const [isProbs, setIsProbs] = useState<boolean>(false);
  const [isFasta, setIsFasta] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const gmmConfig = useSelector((state: RootState) => state.gmmData);
  const selexData = useSelector((state: RootState) => state.vaeData);

  const length = gmmConfig.weights.length;
  if (length === 0) {
    return <div></div>;
  }

  const means = gmmConfig.means;
  const covariances = gmmConfig.covariances;
  const weights = gmmConfig.weights;

  const getProbs = (cluster: number) => {
    const mean = means[cluster];
    const covariance = matrix(JSON.parse(JSON.stringify(covariances[cluster])));
    const weight = weights[cluster];

    const coef = 1 / (2 * Math.PI * Math.sqrt(det(covariance)));
    const invcov = inv(covariance);

    const probs = selexData.map((elem) => {
      const x = [elem.coordX, elem.coordY];
      const diff = matrix(subtract(x, mean));
      const expMat = multiply(
        multiply(diff, invcov),
        transpose(diff)
      ) as unknown as number;
      const exp = -0.5 * expMat;
      // const exp = -0.5 * multiply(multiply(diff, invcov), transpose(diff)).get([0, 0]);
      const prob = weight * coef * Math.exp(exp);
      return prob;
    });
    return probs;
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    const seq = selexData.map((elem) => elem.randomRegion);
    const coord_x = selexData.map((elem) => elem.coordX);
    const coord_y = selexData.map((elem) => elem.coordY);
    const duplicates = selexData.map((elem) => elem.duplicates);

    let header: string[] = ["seq", "coord_x", "coord_y", "duplicates"];
    let data: [string[], number[], number[], ...any[][]] = [
      seq,
      coord_x,
      coord_y,
      duplicates,
    ];

    if (isProbs) {
      if (cluster === -1) {
        for (let i = 0; i < length; i++) {
          header.push(`cluster_${i}`);
          data.push(getProbs(i));
        }
      } else {
        header.push(`cluster_${cluster}`);
        data.push(getProbs(cluster));
      }
    } else {
      const clusterProbs = Array.from(Array(length).keys()).map((i) =>
        getProbs(i)
      );
      let maxProbIndex: number[] = [];
      for (let i = 0; i < clusterProbs[0].length; i++) {
        let maxProb = 0;
        let maxIndex = 0;
        for (let j = 0; j < length; j++) {
          if (clusterProbs[j][i] > maxProb) {
            maxProb = clusterProbs[j][i];
            maxIndex = j;
          }
        }
        maxProbIndex.push(maxIndex);
      }
      header.push("cluster");
      data.push(maxProbIndex);

      if (cluster !== -1) {
        const mask = maxProbIndex.map((elem) => elem === cluster);
        data = data.map((elem) =>
          (elem as any[]).filter((_, i) => mask[i])
        ) as [string[], number[], number[], ...any[][]];
      }
    }

    let content: string;
    let filename: string;
    if (isFasta) {
      if (cluster === -1) {
        filename = "all_clusters.fasta";
        content = objectsToFasta("cluster_all", data);
      } else {
        filename = `cluster_${cluster}.fasta`;
        content = objectsToFasta(`cluster_${cluster}`, data);
      }
    } else {
      if (cluster === -1) {
        filename = "all_clusters.csv";
      } else {
        filename = `cluster_${cluster}.csv`;
      }
      content = objectsToCsv(header, data);
    }

    const encodedUri = encodeURI(content);

    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsDownloading(false);
  };

  return (
    <Form.Group className="mb-3">
      <Form.Label htmlFor="cluster">Cluster</Form.Label>
      <InputGroup>
        <InputGroup.Text>
          <Form.Check
            label="As Probabilities"
            onChange={(e) => {
              setIsProbs(e.target.checked);
              setIsFasta(false);
            }}
            checked={isProbs}
          />
        </InputGroup.Text>
        {isProbs ? (
          <div></div>
        ) : (
          <InputGroup.Text>
            <Form.Check
              label="As Fasta"
              onChange={(e) => setIsFasta(e.target.checked)}
              checked={isFasta}
            />
          </InputGroup.Text>
        )}
        <Form.Select
          id="cluster"
          onChange={(e) => setCluster(parseInt(e.target.value))}
        >
          <option key={-1} value={-1}>
            All
          </option>
          {Array.from(Array(length).keys()).map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </Form.Select>
        {isDownloading ? (
          <Button variant="primary" disabled>
            <Spinner
              as="span"
              animation="border"
              size="sm"
              role="status"
              aria-hidden="true"
            />
          </Button>
        ) : (
          <Button variant="primary" onClick={handleDownload}>
            Download
          </Button>
        )}
      </InputGroup>
    </Form.Group>
  );
};

const DownloadEncode: React.FC = () => {
  const inputSeqList = useSelector((state: RootState) => state.encodeData);
  const [seriesList, setSeriesList] = useState<string[]>([]);
  const [series, setSeries] = useState<string>("all");

  useEffect(() => {
    const seriesSet = new Set<string>();
    for (const entry of inputSeqList) {
      if (entry.category)
        if (entry.fasta_file) {
          seriesSet.add(entry.fasta_file);
        } else {
          seriesSet.add("*manual_input*");
        }
    }
    setSeriesList(Array.from(seriesSet));
  }, [inputSeqList]);

  const handleDownload = () => {
    let seqList = [...inputSeqList];

    if (series.length === 1) {
      // if series is empty
      return;
    }

    if (series === "*manual_input*") {
      seqList = seqList.filter((elem) => elem.from === "manual");
    } else if (series !== "all") {
      seqList = seqList.filter((elem) => elem.fasta_file === series);
    }

    const content = objectsToCsv(
      ["seq", "coord_x", "coord_y", "id", "series"],
      [
        seqList.map((elem) => elem.seq),
        seqList.map((elem) => elem.coord_x),
        seqList.map((elem) => elem.coord_y),
        seqList.map((elem) => elem.id),
        seqList.map((elem) =>
          elem.from === "manual" ? "manual_input" : elem.fasta_file
        ),
      ]
    );
    const filename = `encoded_${series}.csv`;

    const encodedUri = encodeURI(content);

    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Form.Group className="mb-3">
      <Form.Label htmlFor="encode">Series</Form.Label>
      <InputGroup>
        <Form.Select
          id="encode"
          value={series}
          onChange={(e) => setSeries(e.target.value)}
        >
          <option key="all" value="all">
            All
          </option>
          {seriesList.map((series) => (
            <option key={series} value={series}>
              {series}
            </option>
          ))}
        </Form.Select>
        <Button variant="primary" onClick={handleDownload}>
          Download
        </Button>
      </InputGroup>
    </Form.Group>
  );
};

const DownloadDecode: React.FC = () => {
  const decodeSeqList = useSelector((state: RootState) => state.decodeData);
  const handleDownload = () => {
    const content = objectsToCsv(
      ["seq", "coord_x", "coord_y", "id"],
      [
        decodeSeqList.map((elem) => elem.seq),
        decodeSeqList.map((elem) => elem.coord_x),
        decodeSeqList.map((elem) => elem.coord_y),
        decodeSeqList.map((elem) => elem.id),
      ]
    );
    const filename = "decoded.csv";
    const encodedUri = encodeURI(content);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Form.Group className="mb-3">
      <Button variant="primary" onClick={handleDownload}>
        Download
      </Button>
    </Form.Group>
  );
};

const DownloadPanel: React.FC = () => {
  const [kind, setKind] = useState<"cluster" | "encode" | "decode">("cluster");

  return (
    <Form>
      <Form.Group className="mb-3">
        <Form.Label>Download Type</Form.Label>
        <Form.Select
          id="downloadKind"
          onChange={(e) =>
            setKind(e.currentTarget.value as "cluster" | "encode" | "decode")
          }
          value={kind}
        >
          <option key="cluster" value="cluster">
            clusters
          </option>
          <option key="encode" value="encode">
            encode sequences
          </option>
          <option key="decode" value="decode">
            decode sequences
          </option>
        </Form.Select>
      </Form.Group>
      {kind === "cluster" ? <DownloadCluster /> : <div></div>}
      {kind === "encode" ? <DownloadEncode /> : <div></div>}
      {kind === "decode" ? <DownloadDecode /> : <div></div>}
    </Form>
  );
};

export default DownloadPanel;
