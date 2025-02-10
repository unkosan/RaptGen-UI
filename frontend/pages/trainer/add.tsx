import "bootswatch/dist/cerulean/bootstrap.min.css";
import { NextPage } from "next";
import Head from "next/head";
import { Container } from "react-bootstrap";
import Navigator from "~/components/common/navigator";
import { Provider } from "react-redux";
import { store } from "~/components/trainer/add/redux/store";
import "@inovua/reactdatagrid-community/index.css";
import { useRouter } from "next/router";
import Footer from "~/components/common/footer";
import React from "react";
import { Col, Row } from "react-bootstrap";
import PreprocessingForms from "~/components/trainer/add/selex-page/preprocessing-forms";
import UploadFile from "~/components/trainer/add/selex-page/upload-file";
import SelexPagenation from "~/components/trainer/add/selex-page/pagenation";
import TrainPagenation from "~/components/trainer/add/train-page/pagenation";
import TrainParametersForms from "~/components/trainer/add/train-page/train-parameters-forms";
import CountTable from "~/components/trainer/add/train-page/count-table";
import SequenceTable from "~/components/trainer/add/train-page/sequence-table";

const SelexPage: React.FC = () => {
  return (
    <div>
      <Row>
        <Col md={4}>
          <PreprocessingForms />
        </Col>
        <Col>
          <legend>SELEX sequences</legend>
          <UploadFile />
          <SelexPagenation />
        </Col>
      </Row>
    </div>
  );
};

const TrainPage: React.FC = () => {
  return (
    <div>
      <Row>
        <Col md={4}>
          <TrainParametersForms />
        </Col>
        <Col>
          <legend>SELEX sequences</legend>
          <CountTable />
          <SequenceTable />
          <TrainPagenation />
        </Col>
      </Row>
    </div>
  );
};

const Home: React.FC = () => {
  const router = useRouter();
  return (
    <div className="d-flex flex-column vh-100">
      <main>
        <Navigator currentPage="vae-trainer" />
        <Container>
          <h1>VAE Trainer</h1>
          <hr />
          <div
            style={{
              display: router.query.page === undefined ? "block" : "none",
            }}
          >
            <SelexPage />
          </div>
          <div
            style={{
              display: router.query.page === "raptgen" ? "block" : "none",
            }}
          >
            <TrainPage />
          </div>
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
        <meta name="description" content="Train page for pHMM-VAE" />
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
