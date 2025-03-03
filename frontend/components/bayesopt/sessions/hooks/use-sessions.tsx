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
  const [list, setList] = useState<z.infer<typeof responseGetBayesoptItems>>(
    []
  );

  // Modal states
  const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Selected experiment states
  const [selectedExperimentId, setSelectedExperimentId] = useState<string>("");
  const [selectedExperimentName, setSelectedExperimentName] =
    useState<string>("");

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Router and Redux
  const router = useRouter();
  const dispatch = useDispatch();
  const currentUUID = router.query.uuid as string;

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
    const res = await apiClient.listExperiments();
    setList(res);
  }, []);

  /**
   * Initialize the list when the component mounts or UUID changes
   */
  useEffect(() => {
    updateList();
  }, [router.query.uuid, updateList]);

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
  const onSave = useCallback(async () => {
    if (!currentUUID) {
      setIsSaveAsModalOpen(true);
      return;
    }

    setIsLoading(true);

    try {
      const states = getStates();
      await apiClient.updateExperiment(states, {
        params: { uuid: currentUUID },
      });

      dispatch(setIsDirty(false));
    } catch (error) {
      console.error("Error saving experiment:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUUID, getStates, dispatch]);

  /**
   * Save the current experiment with a new name
   */
  const onSaveAs = useCallback(
    async (title: string) => {
      setIsLoading(true);

      try {
        const states = getStates();
        const res = await apiClient.submitExperiment({
          ...states,
          experiment_name: title,
        });

        dispatch(setIsDirty(false));
        setIsSaveAsModalOpen(false);
        router.push(`?uuid=${res.uuid}`);
      } catch (error) {
        console.error("Error saving experiment as:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [getStates, dispatch, router]
  );

  /**
   * Create a new experiment
   */
  const onNew = useCallback(async () => {
    if (isDirty) {
      if (!window.confirm("Discard changes?")) return;
    }
    router.push(`?uuid=`);
  }, [isDirty, router]);

  /**
   * Rename an experiment
   */
  const onRename = useCallback(
    async (newName: string) => {
      if (!selectedExperimentId) return;

      setIsLoading(true);

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
        setIsRenameModalOpen(false);
      } catch (error) {
        console.error("Error renaming experiment:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedExperimentId, updateList]
  );

  /**
   * Delete an experiment
   */
  const onDelete = useCallback(async () => {
    if (!selectedExperimentId) return;

    setIsLoading(true);

    try {
      await apiClient.deleteExperiment(undefined, {
        params: { uuid: selectedExperimentId },
      });

      if (selectedExperimentId === currentUUID) {
        router.push(`?uuid=`);
      }

      await updateList();
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Error deleting experiment:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedExperimentId, currentUUID, router, updateList]);

  /**
   * Handle experiment selection for rename
   */
  const handleRenameClick = useCallback(
    (experimentId: string, experimentName: string) => {
      setSelectedExperimentId(experimentId);
      setSelectedExperimentName(experimentName);
      setIsRenameModalOpen(true);
    },
    []
  );

  /**
   * Handle experiment selection for delete
   */
  const handleDeleteClick = useCallback(
    (experimentId: string, experimentName: string) => {
      setSelectedExperimentId(experimentId);
      setSelectedExperimentName(experimentName);
      setIsDeleteModalOpen(true);
    },
    []
  );

  return {
    // State
    list,
    currentUUID,
    isDirty,
    isLoading,

    // Modal states
    isSaveAsModalOpen,
    setIsSaveAsModalOpen,
    isRenameModalOpen,
    setIsRenameModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,

    // Selected experiment
    selectedExperimentName,

    // Actions
    onSave,
    onSaveAs,
    onNew,
    onRename,
    onDelete,
    handleRenameClick,
    handleDeleteClick,
  };
};
