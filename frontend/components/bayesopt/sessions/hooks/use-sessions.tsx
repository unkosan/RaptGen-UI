import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import { z } from "zod";
import { apiClient } from "~/services/api-client";
import { responseGetBayesoptItems } from "~/services/route/bayesopt";
import { RootState } from "../../redux/store";
import { setIsDirty } from "../../redux/is-dirty";

/**
 * Hook for managing experiment sessions
 * Handles state and operations for the Sessions component
 */
export const useSessions = () => {
  // State for experiment list
  const [sessionEntries, setSessionEntries] = useState<
    z.infer<typeof responseGetBayesoptItems>
  >([]);

  // Selected experiment states
  const [selectedExperimentId, setSelectedExperimentId] = useState<string>("");
  const [selectedExperimentName, setSelectedExperimentName] =
    useState<string>("");

  // Router and Redux
  const { query, isReady, push } = useRouter();
  const currentSessionId = (query.uuid as string) || "";
  const dispatch = useDispatch();

  // Name of current session
  const [currentSessionName, setCurrentSessionName] = useState<string>("");

  // Redux state selectors
  const graphConfig = useSelector((state: RootState) => state.graphConfig);
  const sessionConfig = useSelector((state: RootState) => state.sessionConfig);
  const bayesoptConfig = useSelector(
    (state: RootState) => state.bayesoptConfig
  );
  const queriedValues = useSelector((state: RootState) => state.queriedValues);
  const registeredValues = useSelector(
    (state: RootState) => state.registeredValues
  );
  const acquisitionValues = useSelector(
    (state: RootState) => state.acquisitionValues
  );
  const isDirty = useSelector((state: RootState) => state.isDirty);

  /**
   * Fetch the list of experiments
   */
  const updateList = useCallback(async () => {
    const entries = await apiClient.listExperiments();
    setSessionEntries(entries);
  }, []);

  /**
   * Set the current session name based on the UUID
   */
  useEffect(() => {
    if (isReady) {
      setCurrentSessionName(
        sessionEntries.find(({ uuid }) => uuid === currentSessionId)?.name ?? ""
      );
    }
  }, [currentSessionId, isReady, sessionEntries]);

  /**
   * Initialize the list when the component mounts or UUID changes
   */
  useEffect(() => {
    if (isReady) {
      updateList();
    }
  }, [isReady, updateList]);

  /**
   * Get the current state of the experiment for saving
   */
  const getStates = useCallback(() => {
    // Create a 2D array for target values
    let array = new Array(registeredValues.randomRegion.length).fill([]);
    for (let i = 0; i < array.length; i++) {
      array[i] = new Array(registeredValues.columnNames.length).fill(null);
    }

    // Fill in the values
    for (let i = 0; i < registeredValues.value.length; i++) {
      const seqIndex = registeredValues.sequenceIndex[i];
      const colIndex = registeredValues.columnNames.indexOf(
        registeredValues.column[i]
      );
      array[seqIndex][colIndex] = registeredValues.value[i];
    }

    // Create the experiment state object
    return {
      experiment_name: "",
      VAE_name: graphConfig.vaeName,
      VAE_uuid: sessionConfig.vaeId,
      plot_config: {
        minimum_count: graphConfig.minCount,
        show_training_data: graphConfig.showSelex,
        show_bo_contour: graphConfig.showAcquisition,
      },
      optimization_config: {
        method_name: "qEI" as const,
        target_column_name: bayesoptConfig.targetColumn,
        query_budget: bayesoptConfig.queryBudget,
      },
      distribution_config: {
        xlim_min: -3.5,
        xlim_max: 3.5,
        ylim_min: -3.5,
        ylim_max: 3.5,
      },
      registered_values_table: {
        ids: registeredValues.id,
        sequences: registeredValues.randomRegion,
        target_column_names: registeredValues.columnNames,
        target_values: array,
      },
      query_table: {
        sequences: queriedValues.randomRegion,
        coords_x_original: queriedValues.coordOriginalX,
        coords_y_original: queriedValues.coordOriginalY,
      },
      acquisition_mesh: {
        values: acquisitionValues.acquisitionValues,
        coords_x: acquisitionValues.coordX,
        coords_y: acquisitionValues.coordY,
      },
    };
  }, [
    registeredValues,
    graphConfig,
    sessionConfig,
    bayesoptConfig,
    queriedValues,
    acquisitionValues,
  ]);

  /**
   * Save the current experiment
   */
  const handleSave = useCallback(async () => {
    if (!currentSessionId) {
      return;
    }

    try {
      const states = getStates();
      await apiClient.updateExperiment(states, {
        params: { uuid: currentSessionId },
      });

      dispatch(setIsDirty(false));
    } catch (error) {
      console.error("Error saving experiment:", error);
    }
  }, [currentSessionId, getStates, dispatch]);

  /**
   * Save the current experiment with a new name
   */
  const handleSaveAs = useCallback(
    async (title: string) => {
      try {
        const states = getStates();
        const res = await apiClient.submitExperiment({
          ...states,
          experiment_name: title,
        });

        dispatch(setIsDirty(false));
        push(`?uuid=${res.uuid}`);
      } catch (error) {
        console.error("Error saving experiment as:", error);
      }
    },
    [getStates, dispatch]
  );

  /**
   * Create a new experiment
   */
  const handleNew = useCallback(async () => {
    if (isDirty) {
      if (!window.confirm("Discard changes?")) return;
    }
    push(`?uuid=`);
  }, [isDirty]);

  /**
   * Rename an experiment
   */
  const handleRename = useCallback(
    async (newName: string) => {
      if (!selectedExperimentId) return;

      try {
        await apiClient.patchExperiment(
          {
            target: "experiment_name",
            value: newName,
          },
          {
            params: { uuid: selectedExperimentId },
          }
        );

        await updateList();
      } catch (error) {
        console.error("Error renaming experiment:", error);
      }
    },
    [selectedExperimentId, updateList]
  );

  /**
   * Delete an experiment
   */
  const handleDelete = useCallback(async () => {
    if (!selectedExperimentId) return;

    try {
      await apiClient.deleteExperiment(undefined, {
        params: { uuid: selectedExperimentId },
      });

      if (selectedExperimentId === currentSessionId) {
        push(`?uuid=`);
      }

      await updateList();
    } catch (error) {
      console.error("Error deleting experiment:", error);
    }
  }, [selectedExperimentId, currentSessionId, updateList]);

  const setTargetEntry = useCallback((uuid: string, name: string) => {
    setSelectedExperimentId(uuid);
    setSelectedExperimentName(name);
  }, []);

  return {
    // State
    sessionEntries,
    currentSessionId,
    currentSessionName,
    isDirty,

    // Selected experiment
    targetEntryName: selectedExperimentName,

    // Actions
    handleSave,
    handleSaveAs,
    handleNew,
    handleRename,
    handleDelete,
    setTargetEntry,
  };
};
