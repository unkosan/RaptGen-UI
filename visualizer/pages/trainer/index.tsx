import "bootswatch/dist/cosmo/bootstrap.min.css";
import { NextPage } from "next";
import Head from "next/head";
import { Col, Container, Row } from "react-bootstrap";
import Navigator from "~/components/common/navigator";
import VaeJobsList from "~/components/trainer/home/vae-jobs-list/vae-jobs-list";
import { Provider } from "react-redux";
import { store } from "~/components/trainer/home/redux/store";
import Main from "~/components/trainer/home/main/main";
import "@inovua/reactdatagrid-community/index.css";
import Footer from "~/components/common/footer";
import AddJobButton from "~/components/trainer/home/add-job-button";

const Home: React.FC = () => {
  return (
    <div className="vh-100 d-flex flex-column">
      <Navigator currentPage="vae-trainer" />
      <main>
        <Container>
          <h1 style={{ marginTop: "1rem" }}>VAE Trainer</h1>
          <hr />
          <Row>
            <Col md={4}>
              <AddJobButton />
              <VaeJobsList />
            </Col>
            <Col>
              <Main />
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
        <title>RaptGen-UI: Trainer</title>
        <meta name="description" content="Add training job for pHMM-VAE" />
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
