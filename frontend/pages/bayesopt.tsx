import "bootswatch/dist/cerulean/bootstrap.min.css";
import "@inovua/reactdatagrid-community/index.css";
import { NextPage } from "next";
import { Provider } from "react-redux";
import { useRouter } from "next/router";
import { apiClient } from "~/services/api-client";
import { useEffect, useState } from "react";
import Head from "next/head";
import Navigator from "~/components/common/navigator";
import {
  Col,
  Container,
  Row,
  SSRProvider,
  Spinner,
  Tab,
  Tabs,
} from "react-bootstrap";
import { RootState, store } from "~/components/bayesopt/redux/store";
import { useSelector } from "react-redux";
import { Footer } from "~/components/common/footer";
import Sessions from "~/components/bayesopt/sessions";
import VaeSelector from "~/components/bayesopt/vae-selector";
import InitialDataset from "~/components/bayesopt/initial-dataset";
import BayesOptConfig from "~/components/bayesopt/bayes-opt-config";
import { LatentGraph } from "~/components/bayesopt/latent-graph";
import {
  RegisteredTable,
  RunBayesOptButton,
} from "~/components/bayesopt/registered-table";
import { AddQueryButton, QueryTable } from "~/components/bayesopt/query-table";
import { useExperimentInitializer } from "~/components/bayesopt/experiment-initializer/hooks/use-experiment-initializer";

const App: React.FC = () => {
  const router = useRouter();
  const isDirty = useSelector((state: RootState) => state.isDirty);
  const sessionId = useSelector(
    (state: RootState) => state.sessionConfig.sessionId
  );
  const [activeTableTab, setActiveTableTab] = useState<
    "registered-table" | "query-table"
  >("registered-table");

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

  const { isLoading } = useExperimentInitializer();

  // If still loading, show the initializer and a loading spinner
  if (isLoading) {
    return (
      <main className="flex-grow-1 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <Spinner
            animation="border"
            role="status"
            variant="primary"
            style={{ width: "3rem", height: "3rem" }}
          />
          <h4 className="mt-3">
            Loading Session for Bayesian Optimization ...
          </h4>
        </div>
      </main>
    );
  }

  // Once loaded, show the full UI
  return (
    <main>
      <Container>
        <div className="py-2" />
        <h1>Bayesian Optimization</h1>
        <hr />
        <Row>
          <Col md={4}>
            <div>
              <legend>Session</legend>
              <Sessions />
              <hr />
              <legend>VAE model</legend>
              <VaeSelector />
              <legend>Initial dataset</legend>
              <InitialDataset />
              <legend>Bayes-Opt Configuration</legend>
              <BayesOptConfig />
            </div>
          </Col>
          <Col>
            <LatentGraph />
            <Tabs
              defaultActiveKey={"registered-table"}
              activeKey={activeTableTab}
              onSelect={(key) =>
                setActiveTableTab(key as "registered-table" | "query-table")
              }
            >
              <Tab eventKey="registered-table" title="Registered values">
                <RegisteredTable />
                <RunBayesOptButton setActiveTab={setActiveTableTab} />
              </Tab>
              <Tab eventKey="query-table" title="Query points">
                <QueryTable />
                <AddQueryButton setActiveTab={setActiveTableTab} />
              </Tab>
            </Tabs>
          </Col>
        </Row>
      </Container>
    </main>
  );
};

const Layout: NextPage = () => {
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
          <div className="vh-100 d-flex flex-column">
            <Navigator currentPage="bayesopt" />
            <App />
            <Footer />
          </div>
        </Provider>
      </SSRProvider>
    </>
  );
};

export default Layout;
