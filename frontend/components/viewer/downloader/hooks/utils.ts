import { cloneDeep } from "lodash";
import { det, inv, matrix, multiply, subtract, transpose } from "mathjs";

/**
 * Calculates the probability of a point belonging to a Gaussian
 * @param weight The weight of the Gaussian
 * @param mean Centroid of the Gaussian
 * @param covariance Covariance matrix of the Gaussian
 * @param coords Coordinates of the point
 * @returns The probability of the point belonging to the Gaussian
 */
export const calcurateProbability = (
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

export const downloadFileFromText = (text: string, filename: string) => {
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
