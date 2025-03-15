import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { apiClient } from "~/services/api-client";
import { RootState } from "../../redux/store";
import { setRegisteredValues } from "../../redux/registered-values";
import { setBayesoptConfig } from "../../redux/bayesopt-config";
import { setIsDirty } from "../../redux/is-dirty";

/**
 * Hook for handling GMM model data for initial dataset
 */
export const useGmmDataset = () => {
  const dispatch = useDispatch();
  const sessionConfig = useSelector((state: RootState) => state.sessionConfig);
  const bayesoptConfig = useSelector(
    (state: RootState) => state.bayesoptConfig
  );

  // State for GMM models and selection
  const [gmmModels, setGmmModels] = useState<{ uuid: string; name: string }[]>(
    []
  );
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Mark state as dirty (unsaved changes)
  const setDirty = useCallback(() => {
    dispatch(setIsDirty(true));
  }, [dispatch]);

  // Fetch GMM models when VAE ID changes
  useEffect(() => {
    const fetchGmmModels = async () => {
      if (sessionConfig.vaeId === "") return;

      try {
        const res = await apiClient.getGMMModelNames({
          queries: {
            vae_uuid: sessionConfig.vaeId,
          },
        });

        setGmmModels(res.entries);
        if (res.entries.length > 0) {
          setSelectedModel(res.entries[0].uuid);
        }
      } catch (error) {
        console.error("Error fetching GMM models:", error);
      }
    };

    fetchGmmModels();
  }, [sessionConfig.vaeId]);

  // Handle GMM model selection and data loading
  const handleClickApplyGMM = useCallback(async () => {
    if (selectedModel === "") return;

    setIsLoading(true);

    try {
      // Get GMM model data
      const resModel = await apiClient.getGMMModel({
        queries: {
          gmm_uuid: selectedModel,
        },
      });

      // Decode sequences from GMM centers
      const resDecode = await apiClient.decode({
        session_uuid: sessionConfig.sessionId,
        coords_x: resModel.means.map((mean) => mean[0]),
        coords_y: resModel.means.map((mean) => mean[1]),
      });

      // Clean up sequences
      const randomRegions = resDecode.sequences.map((value) => {
        return value.replaceAll("_", "").replaceAll("N", "");
      });

      // Re-encode cleaned sequences
      const resEncode = await apiClient.encode({
        session_uuid: sessionConfig.sessionId,
        sequences: randomRegions,
      });

      setDirty();

      // Update registered values in Redux
      dispatch(
        setRegisteredValues({
          id: new Array(randomRegions.length)
            .fill("")
            .map((_, i) => `MoG No.${i + 1}`),
          randomRegion: randomRegions,
          coordX: resEncode.coords_x,
          coordY: resEncode.coords_y,
          staged: new Array(randomRegions.length).fill(false),
          columnNames: ["value"],
          sequenceIndex: randomRegions.map((_, i) => i),
          column: new Array(randomRegions.length).fill("value"),
          value: new Array(randomRegions.length).fill(null),
          masterboxChecked: false,
        })
      );

      // Update Bayesian optimization config
      dispatch(
        setBayesoptConfig({
          ...bayesoptConfig,
          targetColumn: "value",
        })
      );
    } catch (error) {
      console.error("Error applying GMM model:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedModel,
    sessionConfig.sessionId,
    bayesoptConfig,
    dispatch,
    setDirty,
  ]);

  return {
    gmmModels,
    selectedModel,
    setSelectedModel,
    isLoading,
    handleClickApplyGMM,
  };
};
