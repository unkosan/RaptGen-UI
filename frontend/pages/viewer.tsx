import "bootswatch/dist/cerulean/bootstrap.min.css";
import "@inovua/reactdatagrid-community/index.css";
import "react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css";
import { NextPage } from "next";
import { Provider } from "react-redux";
import { store } from "~/components/viewer/redux/store";
import Head from "next/head";
import Navigator from "~/components/common/navigator";
import { Col, Container, Row, SSRProvider } from "react-bootstrap";
import LatentGraph from "~/components/viewer/latent-graph/index";
import { Footer } from "~/components/common/footer";
import ModelPicker from "~/components/viewer/model-picker";
import InteractionTables from "~/components/viewer/interaction-tables";
import DecoderInput from "~/components/viewer/decode-input";
import DecoderOutput from "~/components/viewer/decode-output";
import Downloader from "~/components/viewer/downloader";
import EncodeInput from "~/components/viewer/encode-input";

const App: React.FC = () => {
  return (
    <main>
      <Container>
        <div className="py-2" />
        <h1>Viewer</h1>
        <hr />
        <Row>
          <Col md={4}>
            <legend>Data and properties</legend>
            <ModelPicker />
            <legend>Encode sequences</legend>
            <EncodeInput />
            <legend>Decode latent points</legend>
            <DecoderInput />
            <DecoderOutput />
            <legend>Download clusters</legend>
            <Downloader />
          </Col>
          <Col>
            <LatentGraph />
            <InteractionTables />
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
        <title>RaptGen-UI: Viewer</title>
        <meta name="description" content="Viewer of latent spaces" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <SSRProvider>
        <Provider store={store}>
          <div className="vh-100 d-flex flex-column">
            <Navigator currentPage="viewer" />
            <App />
            <Footer />
          </div>
        </Provider>
      </SSRProvider>
    </>
  );
};

export default Layout;
