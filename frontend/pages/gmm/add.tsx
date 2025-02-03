import "bootswatch/dist/cerulean/bootstrap.min.css";
import { NextPage } from "next";
import Head from "next/head";
import { Col, Container, Row } from "react-bootstrap";
import Navigator from "~/components/common/navigator";
import { Provider } from "react-redux";
import { store } from "~/components/gmm/add/redux/store";
import "@inovua/reactdatagrid-community/index.css";
import Forms from "~/components/gmm/add/forms";
import Footer from "~/components/common/footer";
import LatentGraph from "~/components/gmm/add/latent-graph";
import PagenationNav from "~/components/gmm/add/pagenation-nav";

const Home: React.FC = () => {
  return (
    <div className="vh-100 d-flex flex-column">
      <Navigator currentPage="gmm-trainer" />
      <main>
        <Container>
          <h1 style={{ marginTop: "1rem" }}>GMM Trainer</h1>
          <hr />
          <Row>
            <Col md={4}>
              <Forms />
            </Col>
            <Col>
              <LatentGraph />
              <PagenationNav />
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
        <title>RaptGen-UI: GMM Trainer</title>
        <meta name="description" content="Add training job for GMM" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Provider store={store}>
        <Home />
      </Provider>
    </>
  );
};

export default PageRoot;
