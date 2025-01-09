import "bootswatch/dist/cosmo/bootstrap.min.css";
import { NextPage } from "next";
import { Provider } from "react-redux";
import { store } from "~/components/viewer/redux/store";
import Head from "next/head";
import Navigator from "~/components/common/navigator";
import { Col, Container, Row, SSRProvider, Tab, Tabs } from "react-bootstrap";
import LatentGraph from "~/components/viewer/latent-graph";
import SelectionTable from "~/components/viewer/selection-table";
import "@inovua/reactdatagrid-community/index.css";
import { Footer } from "~/components/common/footer";
import DataSelector from "~/components/viewer/data-selector/data-selector";
import ConfigSelector from "~/components/viewer/config-selector/config-selector";
import VAEParamsTable from "~/components/viewer/vae-params-table";
import GMMParamsTable from "~/components/viewer/gmm-params-table";
import Encode from "~/components/viewer/encode/encode";
import Decode from "~/components/viewer/decode/decode";
import Download from "~/components/viewer/download/download";

const Home: React.FC = () => {
  return (
    <div className="vh-100 d-flex flex-column">
      <Navigator currentPage="viewer" />
      <main>
        <Container>
          <h1 style={{ marginTop: "1rem" }}>Viewer</h1>
          <hr />
          <Row>
            <Col md={4}>
              <legend>Data</legend>
              <Tabs
                defaultActiveKey="dataSelector"
                id="dataControl"
                className="mb-3"
              >
                <Tab eventKey="dataSelector" title="Select">
                  <DataSelector />
                </Tab>
                <Tab eventKey="configSelector" title="Config">
                  <ConfigSelector />
                </Tab>
                <Tab eventKey="vaeParamsTable" title="VAE Params">
                  <VAEParamsTable />
                </Tab>
                <Tab eventKey="gmmParamsTable" title="GMM Params">
                  <GMMParamsTable />
                </Tab>
              </Tabs>
              <legend>Operation</legend>
              <Tabs
                defaultActiveKey="encode"
                id="operatorControl"
                className="mb-3"
              >
                <Tab eventKey="encode" title="Encode">
                  <Encode />
                </Tab>
                <Tab eventKey="decode" title="Decode">
                  <Decode />
                </Tab>
                <Tab eventKey="download" title="Download">
                  <Download />
                </Tab>
              </Tabs>
            </Col>
            <Col>
              <LatentGraph />
              <legend>Selected sequences</legend>
              <SelectionTable />
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
        <title>RaptGen-UI: Viewer</title>
        <meta name="description" content="Viewer of latent spaces" />
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
