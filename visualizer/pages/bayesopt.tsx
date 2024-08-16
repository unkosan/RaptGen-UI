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
import SideBar from "~/components/bayesopt/sidebar/sidebar";
import Main from "~/components/bayesopt/main/main";
import { RootState, store } from "~/components/bayesopt/redux/store";
import { responsePostEncode } from "~/services/route/session";
import { experimentState } from "~/services/route/bayesopt";
import { useSelector } from "react-redux";

const InitializeExperimentComponent: React.FC = () => {
  const router = useRouter();
  const uuid = router.query.uuid;
  const dispatch = useDispatch();
  const sessionId = useSelector(
    (state: RootState) => state.sessionConfig.sessionId
  );

  // check if uuid is given or not, and set isLoading and isDirty
  useEffect(() => {
    (async () => {
      dispatch({
        type: "isLoading/set",
        payload: true,
      });

      if (sessionId !== 0) {
        await apiClient.endSession({
          queries: {
            session_id: sessionId,
          },
        });
      }

      if (uuid && typeof uuid === "string") {
        await restoreExperiment();
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
    const vaeNames = await apiClient.getVAEModelNames();
    if (vaeNames.status === "error") {
      return;
    }

    const response = {
      VAE_model: vaeNames.data[0] ? vaeNames.data[0] : "",
      plot_config: {
        minimum_count: 5,
        show_training_data: true,
        show_bo_contour: true,
      },
      optimization_params: {
        method_name: "qEI",
        target_column_name: "target",
        query_budget: 3,
      },
      distribution_params: {
        xlim_start: -3.5,
        xlim_end: 3.5,
        ylim_start: -3.5,
        ylim_end: 3.5,
      },
      registered_values: {
        ids: [],
        sequences: [],
        target_column_names: [],
        target_values: [],
      },
      query_data: {
        sequences: [],
        coords_x_original: [],
        coords_y_original: [],
      },
      acquisition_data: {
        coords_x: [],
        coords_y: [],
        values: [],
      },
    } as z.infer<typeof experimentState>;

    const resSessionId = await apiClient.startSession({
      queries: { VAE_name: response.VAE_model },
    });
    if (resSessionId.status === "error") {
      return;
    }
    const sessionId = resSessionId.data;

    dispatch({
      type: "sessionConfig/set",
      payload: {
        vaeName: response.VAE_model,
        sessionId: sessionId,
      },
    });

    dispatch({
      type: "bayesoptConfig/set",
      payload: {
        targetColumn: response.optimization_params.target_column_name,
        queryBudget: response.optimization_params.query_budget,
        optimizationType: response.optimization_params.method_name,
      },
    });

    dispatch({
      type: "acquisitionValues/set",
      payload: {
        acquisitionValues: response.acquisition_data.values,
        coordX: response.acquisition_data.coords_x,
        coordY: response.acquisition_data.coords_y,
      },
    });

    dispatch({
      type: "graphConfig/set",
      payload: {
        vaeName: response.VAE_model,
        minCount: response.plot_config.minimum_count,
        showSelex: response.plot_config.show_training_data,
        showAcquisition: true,
      },
    });

    dispatch({
      type: "registeredValues/set",
      payload: {
        id: response.registered_values.ids,
        randomRegion: response.registered_values.sequences,
        coordX: [],
        coordY: [],
        staged: new Array(response.registered_values.sequences.length).fill(
          false
        ),
        columnNames: response.registered_values.target_column_names,
        sequenceIndex: [],
        column: [],
        value: [],
      },
    });

    dispatch({
      type: "queriedValues/set",
      payload: {
        randomRegion: response.query_data.sequences,
        coordX: [],
        coordY: [],
        coordOriginalX: response.query_data.coords_x_original,
        coordOriginalY: response.query_data.coords_y_original,
        staged: new Array(response.query_data.sequences.length).fill(false),
      },
    });
  };

  // restore experiment and set redux store
  const restoreExperiment = async () => {
    const vaeNames = await apiClient.getVAEModelNames();
    if (vaeNames.status === "error") {
      return;
    }

    let response = {
      VAE_model: vaeNames.data[0] ? vaeNames.data[0] : "",
      plot_config: {
        minimum_count: 5,
        show_training_data: true,
        show_bo_contour: true,
      },
      optimization_params: {
        method_name: "qEI",
        target_column_name: "target",
        query_budget: 3,
      },
      distribution_params: {
        xlim_start: -3.5,
        xlim_end: 3.5,
        ylim_start: -3.5,
        ylim_end: 3.5,
      },
      registered_values: {
        ids: [],
        sequences: [],
        target_column_names: [],
        target_values: [],
      },
      query_data: {
        sequences: [],
        coords_x_original: [],
        coords_y_original: [],
      },
      acquisition_data: {
        coords_x: [],
        coords_y: [],
        values: [],
      },
    } as z.infer<typeof experimentState>;

    if (uuid) {
      response = await apiClient.getExperiment({
        params: { uuid: uuid as string },
      });
    }

    const resSessionId = await apiClient.startSession({
      queries: { VAE_name: response.VAE_model },
    });
    if (resSessionId.status === "error") {
      return;
    }
    const sessionId = resSessionId.data;

    dispatch({
      type: "sessionConfig/set",
      payload: {
        vaeName: response.VAE_model,
        sessionId: sessionId,
      },
    });

    dispatch({
      type: "bayesoptConfig/set",
      payload: {
        targetColumn: response.optimization_params.target_column_name,
        queryBudget: response.optimization_params.query_budget,
        optimizationType: response.optimization_params.method_name,
      },
    });

    dispatch({
      type: "acquisitionValues/set",
      payload: {
        acquisitionValues: response.acquisition_data.values,
        coordX: response.acquisition_data.coords_x,
        coordY: response.acquisition_data.coords_y,
      },
    });

    dispatch({
      type: "graphConfig/set",
      payload: {
        vaeName: response.VAE_model,
        minCount: response.plot_config.minimum_count,
        showSelex: response.plot_config.show_training_data,
        showAcquisition: true,
      },
    });

    // set registered values
    let resCoords = {
      status: "success",
      data: [],
    } as z.infer<typeof responsePostEncode>;
    if (response.registered_values.sequences.length !== 0) {
      resCoords = await apiClient.encode({
        session_id: sessionId,
        sequences: response.registered_values.sequences,
      });
    }
    if (resCoords.status === "error") {
      return;
    }
    const coords = resCoords.data;

    let columns: string[] = [];
    let values: (number | null)[] = [];
    let sequenceIds: number[] = [];

    for (let i = 0; i < response.registered_values.sequences.length; i++) {
      for (
        let j = 0;
        j < response.registered_values.target_column_names.length;
        j++
      ) {
        columns.push(response.registered_values.target_column_names[j]);
        values.push(response.registered_values.target_values[i][j]);
        sequenceIds.push(i);
      }
    }
    dispatch({
      type: "registeredValues/set",
      payload: {
        id: response.registered_values.ids,
        randomRegion: response.registered_values.sequences,
        coordX: coords.map((coord) => coord.coord_x),
        coordY: coords.map((coord) => coord.coord_y),
        // staged: response.registered_values[0].staged,
        staged: new Array(response.registered_values.sequences.length).fill(
          false
        ),
        columnNames: response.registered_values.target_column_names,
        sequenceIndex: sequenceIds,
        column: columns,
        value: values,
      },
    });

    // set query values
    let resQueryCoords = {
      status: "success",
      data: [],
    } as z.infer<typeof responsePostEncode>;
    if (response.query_data.sequences.length !== 0) {
      resQueryCoords = await apiClient.encode({
        session_id: sessionId,
        sequences: response.query_data.sequences,
      });
    }
    if (resQueryCoords.status === "error") {
      return;
    }
    const queryCoords = resQueryCoords.data;

    dispatch({
      type: "queriedValues/set",
      payload: {
        randomRegion: response.query_data.sequences,
        coordX: queryCoords.map((coord) => coord.coord_x),
        coordY: queryCoords.map((coord) => coord.coord_y),
        coordOriginalX: response.query_data.coords_x_original,
        coordOriginalY: response.query_data.coords_y_original,
        staged: new Array(response.query_data.sequences.length).fill(false),
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
    if (sessionId !== 0) {
      await apiClient.endSession({
        queries: {
          session_id: sessionId,
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
    <>
      <Head>
        <title>RaptGen Visualizer: Bayesian Optimization</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <InitializeExperimentComponent />
        <Navigator currentPage="bayesopt" />
        <Container>
          <h1 style={{ marginTop: "1rem" }}>Bayesian Optimization</h1>
          <hr />
          <Row>
            <Col md={4}>
              <SideBar />
            </Col>
            <Col>
              <Main />
            </Col>
          </Row>
        </Container>
      </main>
    </>
  );
};

const PageRoot: NextPage = () => {
  return (
    <SSRProvider>
      <Provider store={store}>
        <Home />
      </Provider>
    </SSRProvider>
  );
};

export default PageRoot;
