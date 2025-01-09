import "bootswatch/dist/cosmo/bootstrap.min.css";
import "@inovua/reactdatagrid-community/index.css";
import { NextPage } from "next";
import { Provider } from "react-redux";
import { useRouter } from "next/router";
import { apiClient } from "~/services/api-client";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { z } from "zod";
import Head from "next/head";
import Navigator from "~/components/common/navigator";
import { Col, Container, Row, SSRProvider } from "react-bootstrap";
import { RootState, store } from "~/components/bayesopt/redux/store";
import { responsePostEncode } from "~/services/route/session";
import { experimentState } from "~/services/route/bayesopt";
import { useSelector } from "react-redux";
import { Footer } from "~/components/common/footer";
import Versions from "~/components/bayesopt/versions";
import VaeSelector from "~/components/bayesopt/vae-selector";
import InitialDataset from "~/components/bayesopt/initial-dataset";
import BayesOptConfig from "~/components/bayesopt/bayes-opt-config";
import { LatentGraph } from "~/components/bayesopt/latent-graph";
import { RegisteredTable } from "~/components/bayesopt/registered-table";
import { QueryTable } from "~/components/bayesopt/query-table";

const InitializeExperimentComponent: React.FC = () => {
  const router = useRouter();
  const uuid = router.query.uuid;
  const dispatch = useDispatch();

  // check if uuid is given or not, and set isLoading and isDirty
  useEffect(() => {
    (async () => {
      dispatch({
        type: "isLoading/set",
        payload: true,
      });

      if (uuid && typeof uuid === "string") {
        try {
          await restoreExperiment(uuid);
        } catch (e) {
          console.error(e);
          await initializeExperiment();
        }
      } else {
        await initializeExperiment();
      }

      dispatch({
        type: "isLoading/set",
        payload: false,
      });
      dispatch({
        type: "isDirty/set",
        payload: false,
      });
    })();
  }, [uuid]);

  // initialize new experiment and set redux store
  const initializeExperiment = async () => {
    const resVaeNames = await apiClient.getVAEModelNames();

    const response = {
      VAE_uuid:
        resVaeNames.entries.length > 0 ? resVaeNames.entries[0].uuid : "",
      VAE_name:
        resVaeNames.entries.length > 0 ? resVaeNames.entries[0].name : "",
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

    dispatch({
      type: "bayesoptConfig/set",
      payload: {
        targetColumn: response.optimization_config.target_column_name,
        queryBudget: response.optimization_config.query_budget,
        optimizationType: response.optimization_config.method_name,
      },
    });

    dispatch({
      type: "acquisitionValues/set",
      payload: {
        acquisitionValues: response.acquisition_mesh.values,
        coordX: response.acquisition_mesh.coords_x,
        coordY: response.acquisition_mesh.coords_y,
      },
    });

    dispatch({
      type: "graphConfig/set",
      payload: {
        vaeName: response.VAE_name,
        minCount: response.plot_config.minimum_count,
        showSelex: response.plot_config.show_training_data,
        showAcquisition: true,
      },
    });

    dispatch({
      type: "registeredValues/set",
      payload: {
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
      },
    });

    dispatch({
      type: "queriedValues/set",
      payload: {
        randomRegion: response.query_table.sequences,
        coordX: [],
        coordY: [],
        coordOriginalX: response.query_table.coords_x_original,
        coordOriginalY: response.query_table.coords_y_original,
        staged: new Array(response.query_table.sequences.length).fill(false),
      },
    });

    if (response.VAE_uuid === "") {
      console.log("No VAE model found");
      return;
    }

    const resSessionId = await apiClient.startSession({
      queries: { vae_uuid: response.VAE_uuid },
    });
    dispatch({
      type: "sessionConfig/set",
      payload: {
        vaeId: response.VAE_uuid,
        sessionId: resSessionId.uuid,
      },
    });

    const resCoords = await apiClient.getSelexData({
      queries: { vae_uuid: response.VAE_uuid },
    });
    dispatch({
      type: "vaeData/set",
      payload: resCoords.random_regions.map((value, index) => {
        return {
          key: index,
          randomRegion: value,
          duplicates: resCoords.duplicates[index],
          coordX: resCoords.coord_x[index],
          coordY: resCoords.coord_y[index],
          isSelected: false,
          isShown: true,
        };
      }),
    });
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
    dispatch({
      type: "sessionConfig/set",
      payload: {
        vaeId: response.VAE_uuid,
        sessionId: resSessionId.uuid,
      },
    });

    dispatch({
      type: "bayesoptConfig/set",
      payload: {
        targetColumn: response.optimization_config.target_column_name,
        queryBudget: response.optimization_config.query_budget,
        optimizationType: response.optimization_config.method_name,
      },
    });

    dispatch({
      type: "acquisitionValues/set",
      payload: {
        acquisitionValues: response.acquisition_mesh.values,
        coordX: response.acquisition_mesh.coords_x,
        coordY: response.acquisition_mesh.coords_y,
      },
    });

    dispatch({
      type: "graphConfig/set",
      payload: {
        vaeName: response.VAE_name,
        minCount: response.plot_config.minimum_count,
        showSelex: response.plot_config.show_training_data,
        showAcquisition: true,
      },
    });

    // set selex data
    const resSelex = await apiClient.getSelexData({
      queries: { vae_uuid: response.VAE_uuid },
    });
    dispatch({
      type: "vaeData/set",
      payload: Array.from({ length: resSelex.coord_x.length }, (_, i) => ({
        key: i,
        randomRegion: resSelex.random_regions[i],
        coordX: resSelex.coord_x[i],
        coordY: resSelex.coord_y[i],
        duplicates: resSelex.duplicates[i],
        isSelected: false,
        isShown: false,
      })),
    });

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
    dispatch({
      type: "registeredValues/set",
      payload: {
        id: response.registered_values_table.ids,
        randomRegion: response.registered_values_table.sequences,
        coordX: resCoords.coords_x,
        coordY: resCoords.coords_y,
        // staged: response.registered_values[0].staged,
        staged: new Array(
          response.registered_values_table.sequences.length
        ).fill(false),
        columnNames: response.registered_values_table.target_column_names,
        sequenceIndex: sequenceIds,
        column: columns,
        value: values,
      },
    });

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
    dispatch({
      type: "queriedValues/set",
      payload: {
        randomRegion: response.query_table.sequences,
        coordX: resQueryCoords.coords_x,
        coordY: resQueryCoords.coords_y,
        coordOriginalX: response.query_table.coords_x_original,
        coordOriginalY: response.query_table.coords_y_original,
        staged: new Array(response.query_table.sequences.length).fill(false),
      },
    });
  };

  return <></>;
};

const Home: React.FC = () => {
  const router = useRouter();
  const isDirty = useSelector((state: RootState) => state.isDirty);
  const sessionId = useSelector(
    (state: RootState) => state.sessionConfig.sessionId
  );

  const pageChangeHandler = () => {
    if (isDirty) {
      if (!confirm("Discard changes?")) {
        throw "cancelled";
      }
    }
  };
  const beforeUnload = (e: BeforeUnloadEvent) => {
    if (isDirty) {
      e.preventDefault();
      e.returnValue = "Discard changes?";
    }
  };
  const unload = async () => {
    if (sessionId !== "") {
      await apiClient.endSession({
        queries: {
          session_uuid: sessionId,
        },
      });
    }
  };

  useEffect(() => {
    router.events.on("routeChangeStart", pageChangeHandler);
    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener("unload", unload);
    return () => {
      router.events.off("routeChangeStart", pageChangeHandler);
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("unload", unload);
    };
  }, [isDirty]);

  return (
    <div className="vh-100 d-flex flex-column">
      <Navigator currentPage="bayesopt" />
      <main>
        <InitializeExperimentComponent />
        <Container>
          <h1 style={{ marginTop: "1rem" }}>Bayesian Optimization</h1>
          <hr />
          <Row>
            <Col md={4}>
              <div>
                <Versions />
                <hr />
                <VaeSelector />
                <InitialDataset />
                <BayesOptConfig />
              </div>
            </Col>
            <Col>
              <div>
                <LatentGraph />
                <RegisteredTable />
                <QueryTable />
              </div>
            </Col>
          </Row>
        </Container>
      </main>
      <Footer />
    </div>
  );
};

const PageRoot: NextPage = () => {
  return (
    <>
      <Head>
        <title>RaptGen-UI: Bayesian Optimization</title>
        <meta
          name="description"
          content="Page for Bayesian optimization on latent space"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <SSRProvider>
        <Provider store={store}>
          <Home />
        </Provider>
      </SSRProvider>
    </>
  );
};

export default PageRoot;
