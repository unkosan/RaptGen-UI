import { cloneDeep } from "lodash";
import { det, inv, matrix, multiply, subtract, transpose } from "mathjs";
import { useCallback, useEffect, useState } from "react";
import { apiClient } from "~/services/api-client";

/**
 * Calculates the probability of a point belonging to a Gaussian
 * @param weight The weight of the Gaussian
 * @param mean Centroid of the Gaussian
 * @param covariance Covariance matrix of the Gaussian
 * @param coords Coordinates of the point
 * @returns The probability of the point belonging to the Gaussian
 */
const calcurateProbability = (
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

const downloadFileFromText = (text: string, filename: string) => {
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

/**
 * This hook fetches the GMM parameters from the server.
 * Does not cache on download, because numComponents is needed to select the cluster.
 * @param gmmId UUID of the GMM model
 * @returns
 */
const useGaussianMixtureModel = (gmmId: string) => {
  const [gmmParams, setGmmParams] = useState<{
    weights: number[];
    means: number[][];
    covariances: number[][][];
  }>({
    weights: [],
    means: [],
    covariances: [],
  });

  useEffect(() => {
    const fetchGmm = async () => {
      if (!gmmId) return;

      try {
        const gmmParamsResult = await apiClient.getGMMModel({
          queries: {
            gmm_uuid: gmmId,
          },
        });
        setGmmParams(gmmParamsResult);
      } catch (error) {
        console.error(error);
      }
    };
    fetchGmm();
  }, [gmmId]);

  return {
    numComponents: gmmParams.weights.length,
    gmmParams,
  };
};

/**
 * Caches the SELEX data from the server.
 * @param vaeId UUID of the VAE model
 * @returns
 */
const useCachedSELEX = (vaeId: string) => {
  const [selexData, setSelexData] = useState<{
    randomRegions: string[];
    duplicates: number[];
    coordsX: number[];
    coordsY: number[];
  }>({
    randomRegions: [],
    duplicates: [],
    coordsX: [],
    coordsY: [],
  });

  // remove the cache when the vaeId changes
  useEffect(() => {
    setSelexData({
      randomRegions: [],
      duplicates: [],
      coordsX: [],
      coordsY: [],
    });
    return;
  }, [vaeId]);

  const fetchSelex = async () => {
    if (selexData.randomRegions.length > 0) {
      return selexData;
    }
    const rawResult = await apiClient.getSelexData({
      queries: {
        vae_uuid: vaeId,
      },
    });
    const processedSelexData = {
      randomRegions: rawResult.random_regions,
      duplicates: rawResult.duplicates,
      coordsX: rawResult.coord_x,
      coordsY: rawResult.coord_y,
    };
    setSelexData(processedSelexData);
    return processedSelexData;
  };

  return {
    fetchSelex,
  };
};

export const ALL_CLUSTERS = -1;

export const useDownloader = (
  gmmId: string,
  vaeId: string,
  vaeName: string
) => {
  // const [isLoading, setIsLoading] = useState(false);
  const [isSavingCSV, setIsSavingCSV] = useState(false);
  const [isSavingFASTA, setIsSavingFASTA] = useState(false);
  const { gmmParams } = useGaussianMixtureModel(gmmId);
  const { fetchSelex } = useCachedSELEX(vaeId);

  /**
   * Downloads the data as a CSV file
   * @param cluster The index of cluster, "-1" means all clusters
   */
  const onDownloadCSV = useCallback(
    async (cluster: number) => {
      setIsSavingCSV(true);

      try {
        const selex = await fetchSelex();
        const numComponents = gmmParams.weights.length;
        const numPoints = selex.randomRegions.length;

        const probabilitiesTable: number[][] = Array.from({
          length: numPoints,
        }).map((_, index) => {
          const coords = [selex.coordsX[index], selex.coordsY[index]];
          const probs = gmmParams.weights.map((weight, j) => {
            return calcurateProbability(
              weight,
              gmmParams.means[j],
              gmmParams.covariances[j],
              coords
            );
          });
          return probs;
        });

        const maxIndexRecords = probabilitiesTable.map((row, i) => {
          const maxIndex = row.indexOf(Math.max(...row));
          return {
            maxIndex,
            sequenceIndex: i,
            probs: row,
            sequence: selex.randomRegions[i],
          };
        });

        const header =
          "seq,coordX,coordY,duplicates,cluster," +
          Array.from(
            { length: numComponents },
            (_, i) => `probs_cluster-${i}`
          ).join(",");
        let body: string[] = [];
        let filename: string = "";

        if (cluster === ALL_CLUSTERS) {
          body = maxIndexRecords.map((record) => {
            return [
              record.sequence,
              selex.coordsX[record.sequenceIndex],
              selex.coordsY[record.sequenceIndex],
              selex.duplicates[record.sequenceIndex],
              record.maxIndex,
              ...record.probs,
            ].join(",");
          });
          filename = vaeName + "_csv_all.csv";
        } else {
          body = maxIndexRecords
            .filter((record) => record.maxIndex === cluster)
            .map((record) => {
              return [
                record.sequence,
                selex.coordsX[record.sequenceIndex],
                selex.coordsY[record.sequenceIndex],
                selex.duplicates[record.sequenceIndex],
                record.maxIndex,
                ...record.probs,
              ].join(",");
            });
          filename = vaeName + "_csv_cluster-" + cluster + ".csv";
        }
        downloadFileFromText(header + "\n" + body.join("\n"), filename);
      } catch (error) {
        console.log(error);
      } finally {
        setIsSavingCSV(false);
        return;
      }
    },
    [gmmParams, vaeId, vaeName]
  );

  /**
   * Downloads the data as a FASTA file
   * @param cluster The index of cluster, does not support donwloading all clusters
   * @returns
   */
  const onDownloadFASTA = useCallback(
    async (cluster: number) => {
      setIsSavingFASTA(true);

      try {
        const selex = await fetchSelex();
        const numPoints = selex.randomRegions.length;

        const probabilitiesTable: number[][] = Array.from({
          length: numPoints,
        }).map((_, index) => {
          const coords = [selex.coordsX[index], selex.coordsY[index]];
          const probs = gmmParams.weights.map((weight, j) => {
            return calcurateProbability(
              weight,
              gmmParams.means[j],
              gmmParams.covariances[j],
              coords
            );
          });
          return probs;
        });

        const maxIndexRecords = probabilitiesTable.map((row, i) => {
          const maxIndex = row.indexOf(Math.max(...row));
          return {
            maxIndex,
            sequenceIndex: i,
            prob: row[maxIndex],
            sequence: selex.randomRegions[i],
          };
        });

        let body: string[] = [];
        let filename: string = "";

        if (cluster === ALL_CLUSTERS) {
          body = maxIndexRecords.map((record) => {
            return `>seq-${record.sequenceIndex} (cluster-${record.maxIndex}, prob-${record.prob})\n${record.sequence}`;
          });
          filename = vaeName + "_fasta_all.fasta";
        } else {
          body = maxIndexRecords
            .filter((record) => {
              return record.maxIndex === cluster;
            })
            .map((record) => {
              return `>seq-${record.sequenceIndex} (cluster-${record.maxIndex}, prob-${record.prob})\n${record.sequence}`;
            });
          filename = vaeName + "_fasta_cluster-" + cluster + ".fasta";
        }
        downloadFileFromText(body.join("\n"), filename);
      } catch (error) {
        console.log(error);
      } finally {
        setIsSavingFASTA(false);
        return;
      }
    },
    [gmmParams, vaeId, vaeName]
  );

  return {
    isSavingCSV,
    isSavingFASTA,
    numComponents: gmmParams.weights.length,
    onDownloadCSV,
    onDownloadFASTA,
  };
};
