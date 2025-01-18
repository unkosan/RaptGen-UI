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
import VAEParamsTable from "~/components/viewer/vae-params-table";
import GMMParamsTable from "~/components/viewer/gmm-params-table";
import Encode from "~/components/viewer/encode/encode";
import Decode from "~/components/viewer/decode/decode";
import EncodeTable from "~/components/viewer/encode-table";
import DecodeTable from "~/components/viewer/decode-table";
import DownloadCluster from "~/components/viewer/download-cluster";

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
              <legend>Data and properties</legend>
              <Tabs defaultActiveKey="dataSelector" id="dataControl">
                <Tab eventKey="dataSelector" title="Data">
                  <DataSelector />
                </Tab>
                <Tab eventKey="vaeParamsTable" title="VAE Parameters">
                  <VAEParamsTable />
                </Tab>
                <Tab eventKey="gmmParamsTable" title="GMM Parameters">
                  <GMMParamsTable />
                </Tab>
              </Tabs>
              <legend>Encode sequences</legend>
              <Encode />
              <legend>Decode latent points</legend>
              <Decode />
              <legend>Download clusters</legend>
              <DownloadCluster />
            </Col>
            <Col>
              <LatentGraph />
              <Tabs defaultActiveKey="selected-points" id="interaction-table">
                <Tab eventKey="selected-points" title="Selected points">
                  <SelectionTable />
                </Tab>
                <Tab eventKey="encoded-sequences" title="Encoded sequences">
                  <EncodeTable />
                </Tab>
                <Tab eventKey="decoded-points" title="Decoded points">
                  <DecodeTable />
                </Tab>
              </Tabs>
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
