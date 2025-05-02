import "bootswatch/dist/cerulean/bootstrap.min.css";
import "@inovua/reactdatagrid-community/index.css";
import { NextPage } from "next";
import Head from "next/head";
import { Alert, Button, Col, Row, Container } from "react-bootstrap";
import Navigator from "~/components/common/navigator";
import VaeJobsList from "~/components/trainer-home/vae-jobs-list";
import { Provider } from "react-redux";
import Footer from "~/components/common/footer";
import AddJobButton from "~/components/trainer-home/add-job-button";

import { responseGetItemChild } from "~/services/route/train";
import { responseGetItem } from "~/services/route/train";
import { z } from "zod";
import _ from "lodash";
import { ArrowClockwise } from "react-bootstrap-icons";
import { ChildJobParams } from "~/components/trainer-home/child-job-params";
import { ParentJobParams } from "~/components/trainer-home/parent-job-params";
import { ActionButtons } from "~/components/trainer-home/action-buttons";
import { Summary } from "~/components/trainer-home/summary";
import { TrainingParams } from "~/components/trainer-home/training-params";
import { ChildJobHandler } from "~/components/trainer-home/child-job-handler";
import { LatentGraph } from "~/components/trainer-home/latent-graph";
import { LossesGraph } from "~/components/trainer-home/losses-graph";
import LoadingPane from "~/components/common/loading-pane";
import { store } from "~/components/trainer-home/redux/store";
import { useJobItem } from "~/components/trainer-home/hooks/use-job-item";

type ChildItem = z.infer<typeof responseGetItemChild>;
type ParentItem = z.infer<typeof responseGetItem>;

const ParentPane: React.FC<{
  item: ParentItem;
  refreshFunc: () => void;
}> = ({ item, refreshFunc }) => {
  return (
    <>
      <div className="justify-content-between d-flex">
        <h3>{item.name}</h3>
        <div>
          <Button
            variant="primary"
            onClick={() => {
              refreshFunc();
            }}
          >
            <div className="align-items-center d-flex">
              <ArrowClockwise />
              <span className="ms-2">Refresh</span>
            </div>
          </Button>
        </div>
      </div>
      <ParentJobParams item={item} />
      <ActionButtons
        uuid={item.uuid}
        name={item.name}
        status={item.status}
        refreshFunc={refreshFunc}
      />

      <Row>
        <Col>
          <legend>Current status of the experiment</legend>
          <Summary value={item.summary} />
        </Col>
        <Col>
          <legend>Training Parameters</legend>
          <TrainingParams value={item.params_training} />
        </Col>
      </Row>
    </>
  );
};

const ChildPane: React.FC<{
  childItem: ChildItem | null;
  parentItem: ParentItem;
}> = ({ childItem, parentItem }) => {
  if (childItem === null) {
    return <div>Please select a model</div>;
  }

  switch (childItem.status) {
    case "pending":
      return (
        <>
          <ChildJobHandler childItem={childItem} parentItem={parentItem} />
          <ChildJobParams item={childItem} />
          <Alert variant="info">
            <Alert.Heading>Pending</Alert.Heading>
            <p>The job is pending. Please wait for a while.</p>
          </Alert>
        </>
      );
    case "failure":
      return (
        <>
          <ChildJobHandler childItem={childItem} parentItem={parentItem} />
          <ChildJobParams item={childItem} />
          <Alert variant="danger">
            <Alert.Heading>Runtime Error</Alert.Heading>
            <div className="font-monospace">{childItem.error_msg}</div>
          </Alert>
        </>
      );
    default:
      return (
        <>
          <ChildJobHandler childItem={childItem} parentItem={parentItem} />
          <ChildJobParams item={childItem} />
          <LatentGraph
            title={""}
            vaeData={{
              coordsX: childItem.latent.coords_x,
              coordsY: childItem.latent.coords_y,
              randomRegions: childItem.latent.random_regions,
              duplicates: childItem.latent.duplicates,
            }}
          />
          <LossesGraph
            title=""
            lossData={{
              epochs: childItem.losses.train_loss.map((_, index) => index),
              trainLosses: childItem.losses.train_loss,
              testLosses: childItem.losses.test_loss,
              testRecons: childItem.losses.test_recon,
              testKlds: childItem.losses.test_kld,
            }}
          />
        </>
      );
  }
};

const App: React.FC = () => {
  const {
    isLoading,
    pid: parentId,
    cid: childId,
    pItem: parentItem,
    cItem: childItem,
    refresh,
  } = useJobItem();

  return (
    <main>
      <Container>
        <div className="py-2" />
        <h1>VAE Trainer</h1>
        <hr />
        <Row>
          <Col md={4}>
            <AddJobButton />
            <VaeJobsList />
          </Col>
          <Col>
            {(() => {
              if (parentId === undefined) {
                return <div>Please click the entry on the left</div>;
              }

              if (isLoading || !parentItem) {
                return <LoadingPane label="Loading Job..." />;
              }

              return (
                <>
                  <ParentPane item={parentItem} refreshFunc={refresh} />
                  <legend>Job information</legend>
                  <ChildPane childItem={childItem} parentItem={parentItem} />
                </>
              );
            })()}
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
        <title>RaptGen-UI: Trainer</title>
        <meta name="description" content="Add training job for pHMM-VAE" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Provider store={store}>
        <div className="vh-100 d-flex flex-column">
          <Navigator currentPage="vae-trainer" />
          <App />
          <Footer />
        </div>
      </Provider>
    </>
  );
};

export default Layout;
