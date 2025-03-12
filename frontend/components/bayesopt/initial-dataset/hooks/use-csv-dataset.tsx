import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { apiClient } from "~/services/api-client";
import { RootState } from "../../redux/store";
import { setRegisteredValues } from "../../redux/registered-values";
import { setBayesoptConfig } from "../../redux/bayesopt-config";
import { setIsDirty } from "../../redux/is-dirty";

/**
 * Parse CSV data for initial dataset
 * Extracts headers, random regions, sequence IDs, and values
 *
 * @param text CSV text content
 * @returns Parsed CSV data
 */
const parseCsv = (text: string) => {
  const lines = text.split(/\r\n|\n|\r/);
  let headers = lines[0].split(",");

  const randomRegionIndex = headers.indexOf("random_region");
  if (randomRegionIndex === -1) {
    alert("random_region field is not found");
    throw new Error("random_region field is not found");
  }
  const seqIdIndex = headers.indexOf("seq_id");
  if (seqIdIndex === -1) {
    alert("seq_id field is not found");
    throw new Error("seq_id field is not found");
  }

  const validColumnsLength = headers.filter((header: string) => {
    return (
      header !== "random_region" &&
      header !== "seq_id" &&
      header !== "" &&
      header !== "coord_x" &&
      header !== "coord_y"
    );
  }).length;
  if (validColumnsLength === 0) {
    alert("No valid columns found");
    throw new Error("No valid columns found");
  }

  let sequenceIndex: number[] = [];
  let column: string[] = [];
  let value: number[] = [];
  let randomRegion: string[] = [];
  let id: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const data = lines[i].split(",");
    randomRegion.push(data[randomRegionIndex].trim());
    id.push(data[seqIdIndex].trim());

    for (let j = 0; j < headers.length; j++) {
      if (j === randomRegionIndex) continue;
      if (j === seqIdIndex) continue;

      sequenceIndex.push(i - 1);
      column.push(headers[j]);
      value.push(Number(data[j]));
    }
  }

  headers.splice(randomRegionIndex, 1);
  headers.splice(seqIdIndex, 1);

  return {
    columnNames: headers,
    id,
    randomRegion,
    sequenceIndex,
    column,
    value,
  };
};

/**
 * Hook for handling CSV file uploads for initial dataset
 */
export const useCsvDataset = () => {
  const dispatch = useDispatch();
  const sessionConfig = useSelector((state: RootState) => state.sessionConfig);

  // State for loading and validation
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isValid, setIsValid] = useState<boolean>(true);
  /**
   * Mark state as dirty (unsaved changes)
   */
  const setDirty = useCallback(() => {
    dispatch(setIsDirty(true));
  }, [dispatch]);

  /**
   * Handle file upload and process CSV data
   */
  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();

      reader.onload = async (e) => {
        const text = e.target?.result as string;
        setIsLoading(true);
        try {
          let { columnNames, randomRegion, id, sequenceIndex, column, value } =
            parseCsv(text);

          if (columnNames.length === 0) {
            setIsValid(false);
            alert("No valid columns found");
            return;
          }

          const res = await apiClient.encode({
            session_uuid: sessionConfig.sessionId,
            sequences: randomRegion,
          });

          // Remove coord_X and coord_Y columns if present
          if (columnNames.includes("coord_X")) {
            columnNames.splice(columnNames.indexOf("coord_X"), 1);
          }
          if (columnNames.includes("coord_Y")) {
            columnNames.splice(columnNames.indexOf("coord_Y"), 1);
          }

          // Filter out coord_X and coord_Y values
          const mask = column.map(
            (c: string) => c !== "coord_X" && c !== "coord_Y"
          );
          column = column.filter((_: string, i: number) => mask[i]);
          sequenceIndex = sequenceIndex.filter(
            (_: number, i: number) => mask[i]
          );
          value = value.filter((_: number, i: number) => mask[i]);

          setDirty();

          // Update registered values in Redux
          dispatch(
            setRegisteredValues({
              id,
              randomRegion,
              coordX: res.coords_x,
              coordY: res.coords_y,
              staged: new Array(randomRegion.length).fill(false),
              columnNames,
              sequenceIndex,
              column,
              value,
              masterboxChecked: false,
            })
          );

          // Update Bayesian optimization config
          dispatch(
            setBayesoptConfig({
              targetColumn: columnNames[0],
              optimizationType: "qEI",
              queryBudget: 3,
            })
          );

          setIsValid(true);
        } catch (e) {
          setIsValid(false);
          console.error(e);
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsText(file);
    },
    [sessionConfig.sessionId, dispatch, setDirty, setIsLoading]
  );

  return {
    isLoading,
    isValid,
    onFileChange,
  };
};
