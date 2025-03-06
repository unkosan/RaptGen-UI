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
import PreprocessingForms from "~/components/trainer/add/preprocessing-forms";
import UploadFile from "~/components/trainer/add/upload-file";
import SelexPagenation from "~/components/trainer/add/navigator-preprocess";
import TrainPagenation from "~/components/trainer/add/navigator-train";
import TrainParametersForms from "~/components/trainer/add/train-parameters-forms";
import CountTable from "~/components/trainer/add/count-table";
import SequenceTable from "~/components/trainer/add/sequence-table";

const App: React.FC = () => {
  const router = useRouter();
  return (
    <main>
      <Container>
        <div className="py-2" />
        <h1>VAE Trainer</h1>
        <hr />
        <div
          style={{
            display: router.query.page === undefined ? "block" : "none",
          }} // default page
        >
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
        <div
          style={{
            display: router.query.page === "raptgen" ? "block" : "none",
          }} // training params page
        >
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
      </Container>
    </main>
  );
};

const Layout: NextPage = () => {
  return (
    <>
      <Head>
        <title>RaptGen-UI: Trainer</title>
        <meta name="description" content="Train page for pHMM-VAE" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Provider store={store}>
        <div className="d-flex flex-column vh-100">
          <Navigator currentPage="vae-trainer" />
          <App />
          <Footer />
        </div>
      </Provider>
    </>
  );
};

export default Layout;
