import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { z } from "zod";
import { apiClient } from "~/services/api-client";
import { experimentState } from "~/services/route/bayesopt";
import { responsePostEncode } from "~/services/route/session";
import { AppDispatch } from "../redux/store";
import { setIsDirty } from "../redux/is-dirty";
import { setBayesoptConfig } from "../redux/bayesopt-config";
import { setAcquisitionValues } from "../redux/acquisition-values";
import { setGraphConfig } from "../redux/graph-config";
import { setRegisteredValues } from "../redux/registered-values";
import { setQueriedValues } from "../redux/queried-values";
import { setSessionConfigByVaeIdName } from "../redux/session-config";

export const useSessionInitializer = () => {
  const { query, isReady } = useRouter();
  const { uuid } = query;
  const dispatch = useDispatch<AppDispatch>();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      if (!isReady) {
        return;
      }

      setIsLoading(true);

      if (typeof uuid !== "string" || uuid === "") {
        // if not provided or invalid uuid
        try {
          await initializeExperiment();
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoading(false);
          dispatch(setIsDirty(false));
        }
        return;
      } else {
        // if valid uuid
        try {
          await restoreExperiment(uuid);
        } catch (e) {
          console.error(e);
          try {
            await initializeExperiment();
          } catch (e) {
            console.error(e);
          }
        } finally {
          setIsLoading(false);
          dispatch(setIsDirty(false));
        }
      }
    };
    init();
  }, [uuid, isReady, dispatch]);

  // initialize new experiment and set redux store
  const initializeExperiment = async () => {
    const { entries } = await apiClient.getVAEModelNames();

    const response = {
      VAE_uuid: entries.length > 0 ? entries[0].uuid : "",
      VAE_name: entries.length > 0 ? entries[0].name : "",
      plot_config: {
        minimum_count: 5,
        show_training_data: true,
        show_bo_contour: true,
      },
      optimization_config: {
        method_name: "qEI",
        target_column_name: "target",
        query_budget: 3,
      },
      distribution_config: {
        xlim_min: -3.5,
        xlim_max: 3.5,
        ylim_min: -3.5,
        ylim_max: 3.5,
      },
      registered_values_table: {
        ids: [],
        sequences: [],
        target_column_names: [],
        target_values: [],
      },
      query_table: {
        sequences: [],
        coords_x_original: [],
        coords_y_original: [],
      },
      acquisition_mesh: {
        coords_x: [],
        coords_y: [],
        values: [],
      },
    } as z.infer<typeof experimentState>;

    if (response.VAE_uuid === "") {
      console.log("No VAE model found");
      return;
    }

    await dispatch(
      setSessionConfigByVaeIdName({
        vaeId: response.VAE_uuid,
        vaeName: response.VAE_name,
      })
    );

    dispatch(
      setBayesoptConfig({
        targetColumn: response.optimization_config.target_column_name,
        queryBudget: response.optimization_config.query_budget,
        optimizationType: response.optimization_config.method_name,
      })
    );

    dispatch(
      setAcquisitionValues({
        acquisitionValues: response.acquisition_mesh.values,
        coordX: response.acquisition_mesh.coords_x,
        coordY: response.acquisition_mesh.coords_y,
      })
    );

    dispatch(
      setGraphConfig({
        vaeName: response.VAE_name,
        minCount: response.plot_config.minimum_count,
        showSelex: response.plot_config.show_training_data,
        showTitle: false,
        showAcquisition: true,
      })
    );

    dispatch(
      setRegisteredValues({
        id: response.registered_values_table.ids,
        randomRegion: response.registered_values_table.sequences,
        coordX: [],
        coordY: [],
        staged: new Array(
          response.registered_values_table.sequences.length
        ).fill(false),
        columnNames: response.registered_values_table.target_column_names,
        sequenceIndex: [],
        column: [],
        value: [],
        masterboxChecked: false,
      })
    );

    dispatch(
      setQueriedValues({
        randomRegion: response.query_table.sequences,
        coordX: [],
        coordY: [],
        coordOriginalX: response.query_table.coords_x_original,
        coordOriginalY: response.query_table.coords_y_original,
        staged: new Array(response.query_table.sequences.length).fill(false),
        masterboxChecked: false,
      })
    );
  };

  // restore experiment and set redux store
  const restoreExperiment = async (uuid: string) => {
    const response = await apiClient.getExperiment({
      params: { uuid },
    });

    const resSessionId = await apiClient.startSession({
      queries: { vae_uuid: response.VAE_uuid },
    });

    if (resSessionId.uuid === "") {
      throw "Failed to start session";
    }

    dispatch(
      setSessionConfigByVaeIdName({
        vaeId: response.VAE_uuid,
        vaeName: response.VAE_name,
      })
    );

    dispatch(
      setBayesoptConfig({
        targetColumn: response.optimization_config.target_column_name,
        queryBudget: response.optimization_config.query_budget,
        optimizationType: response.optimization_config.method_name,
      })
    );

    dispatch(
      setAcquisitionValues({
        acquisitionValues: response.acquisition_mesh.values,
        coordX: response.acquisition_mesh.coords_x,
        coordY: response.acquisition_mesh.coords_y,
      })
    );

    dispatch(
      setGraphConfig({
        vaeName: response.VAE_name,
        minCount: response.plot_config.minimum_count,
        showSelex: response.plot_config.show_training_data,
        showTitle: false,
        showAcquisition: true,
      })
    );

    // set registered values
    let resCoords: z.infer<typeof responsePostEncode> = {
      coords_x: [],
      coords_y: [],
    };
    if (response.registered_values_table.sequences.length !== 0) {
      resCoords = await apiClient.encode({
        session_uuid: resSessionId.uuid,
        sequences: response.registered_values_table.sequences,
      });
    }

    let columns: string[] = [];
    let values: (number | null)[] = [];
    let sequenceIds: number[] = [];

    for (
      let i = 0;
      i < response.registered_values_table.sequences.length;
      i++
    ) {
      for (
        let j = 0;
        j < response.registered_values_table.target_column_names.length;
        j++
      ) {
        columns.push(response.registered_values_table.target_column_names[j]);
        values.push(response.registered_values_table.target_values[i][j]);
        sequenceIds.push(i);
      }
    }
    dispatch(
      setRegisteredValues({
        id: response.registered_values_table.ids,
        randomRegion: response.registered_values_table.sequences,
        coordX: resCoords.coords_x,
        coordY: resCoords.coords_y,
        staged: new Array(
          response.registered_values_table.sequences.length
        ).fill(false),
        columnNames: response.registered_values_table.target_column_names,
        sequenceIndex: sequenceIds,
        column: columns,
        value: values,
        masterboxChecked: false,
      })
    );

    // set query values
    let resQueryCoords: z.infer<typeof responsePostEncode> = {
      coords_x: [],
      coords_y: [],
    };
    if (response.query_table.sequences.length !== 0) {
      resQueryCoords = await apiClient.encode({
        session_uuid: resSessionId.uuid,
        sequences: response.query_table.sequences,
      });
    }
    dispatch(
      setQueriedValues({
        randomRegion: response.query_table.sequences,
        coordX: resQueryCoords.coords_x,
        coordY: resQueryCoords.coords_y,
        coordOriginalX: response.query_table.coords_x_original,
        coordOriginalY: response.query_table.coords_y_original,
        staged: new Array(response.query_table.sequences.length).fill(false),
        masterboxChecked: false,
      })
    );
  };

  return {
    isLoading,
  };
};
