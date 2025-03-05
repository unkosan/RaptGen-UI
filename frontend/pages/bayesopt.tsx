import "bootswatch/dist/cerulean/bootstrap.min.css";
import "@inovua/reactdatagrid-community/index.css";
import { NextPage } from "next";
import { Provider } from "react-redux";
import { useState } from "react";
import { useConfirmNavigation } from "~/components/bayesopt/hooks/use-confirm-navigation";
import Head from "next/head";
import Navigator from "~/components/common/navigator";
import { Col, Container, Row, SSRProvider, Tab, Tabs } from "react-bootstrap";
import { store } from "~/components/bayesopt/redux/store";
import { Footer } from "~/components/common/footer";
import Sessions from "~/components/bayesopt/sessions/index";
import VaeSelector from "~/components/bayesopt/vae-selector/index";
import InitialDataset from "~/components/bayesopt/initial-dataset/index";
import BayesOptConfig from "~/components/bayesopt/bayes-opt-config/index";
import LatentGraph from "~/components/bayesopt/latent-graph/index";
import RegisteredTable from "~/components/bayesopt/registered-table/index";
import QueryTable from "~/components/bayesopt/query-table/index";
import { useSessionInitializer } from "~/components/bayesopt/hooks/use-session-initializer";

const App: React.FC = () => {
  // Use the hook for navigation confirmation and session cleanup
  useConfirmNavigation();

  // State for tab management
  const [activeTableTab, setActiveTableTab] = useState<
    "registered-table" | "query-table"
  >("registered-table");

  const { isLoading } = useSessionInitializer();

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
            <LatentGraph isLoading={isLoading} />
            <Tabs
              defaultActiveKey={"registered-table"}
              activeKey={activeTableTab}
              onSelect={(key) =>
                setActiveTableTab(key as "registered-table" | "query-table")
              }
            >
              <Tab eventKey="registered-table" title="Registered values">
                <RegisteredTable setActiveTab={setActiveTableTab} />
              </Tab>
              <Tab eventKey="query-table" title="Query points">
                <QueryTable setActiveTab={setActiveTableTab} />
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
