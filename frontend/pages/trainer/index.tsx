import "bootswatch/dist/cerulean/bootstrap.min.css";
import { NextPage } from "next";
import Head from "next/head";
import { Alert, Button, Col, Row, Container } from "react-bootstrap";
import Navigator from "~/components/common/navigator";
import VaeJobsList from "~/components/trainer/home/vae-jobs-list/vae-jobs-list";
import { Provider } from "react-redux";
import { store } from "~/components/trainer/home/redux/store";
import "@inovua/reactdatagrid-community/index.css";
import Footer from "~/components/common/footer";
import AddJobButton from "~/components/trainer/home/add-job-button";
import { useState } from "react";
import { apiClient } from "~/services/api-client";

import { responseGetItemChild } from "~/services/route/train";
import { responseGetItem } from "~/services/route/train";
import { z } from "zod";
import _ from "lodash";
import { useRouter } from "next/router";
import { ArrowClockwise } from "react-bootstrap-icons";
import { useAsyncMemo, useIsLoading } from "~/hooks/common";
import {
  ChildJobParams,
  ParentJobParams,
} from "~/components/trainer/home/job-params";
import { ActionButtons } from "~/components/trainer/home/action-buttons";
import { Summary } from "~/components/trainer/home/summary";
import { TrainingParams } from "~/components/trainer/home/training-params";
import { ChildJobHandler } from "~/components/trainer/home/child-job-handler";
import { LatentGraph } from "~/components/trainer/home/latent-graph";
import { LossesGraph } from "~/components/trainer/home/losses-graph";
import LoadingPane from "~/components/common/loading-pane";

type ChildItem = z.infer<typeof responseGetItemChild>;
type ParentItem = z.infer<typeof responseGetItem>;

const ParentPane: React.FC<{
  item: ParentItem;
  refreshFunc: () => void;
}> = ({ item, refreshFunc }) => {
  return (
    <>
      <div className="justify-content-between d-flex">
        <h3>Experiment: {item.name}</h3>
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

const calculateDefaultChildModelId = (item: ParentItem): number => {
  const summary = item.summary;
  switch (item.status) {
    case "progress":
    case "suspend":
    case "failure":
    case "pending":
      const firstOccurrence = summary.statuses.indexOf(item.status);
      if (firstOccurrence === -1) {
        return 0;
      } else {
        return summary.indices[firstOccurrence];
      }
    case "success":
      const nlls = summary.minimum_NLLs.flatMap((value, index) => {
        return value === null || isNaN(value) ? [Infinity] : [value];
      });
      const successIndex = _.minBy(nlls);
      if (successIndex === undefined) {
        return 0;
      } else {
        return summary.indices[successIndex];
      }
    default:
      return 0;
  }
};

const DetailPane: React.FC<{
  parentId: string | undefined;
  childId: string | undefined;
}> = ({ parentId, childId }) => {
  const [reloadFlag, setReloadFlag] = useState(false);
  const [loadingParent, lockParent, unlockParent] = useIsLoading();
  const [loadingChild, lockChild, unlockChild] = useIsLoading();

  // items shown on the page
  const parentItem: ParentItem | null = useAsyncMemo(
    async () => {
      if (parentId === undefined) {
        return null;
      }
      lockParent();
      const item = await apiClient.getItem({
        params: {
          parent_uuid: parentId,
        },
      });
      unlockParent();
      return item;
    },
    [parentId, reloadFlag],
    null
  );

  const childItem: ChildItem | null = useAsyncMemo(
    async () => {
      if (parentItem === null) {
        return null;
      } // parentItem must be available

      lockChild();
      if (
        childId === undefined ||
        isNaN(parseInt(childId)) ||
        parentItem.reiteration <= parseInt(childId)
      ) {
        // return null;
        const defaultChildId = calculateDefaultChildModelId(parentItem);
        const item = await apiClient.getChildItem({
          params: {
            parent_uuid: parentItem.uuid,
            child_id: defaultChildId,
          },
        });
        unlockChild();
        return item;
      } // if valid childId is not available, default item is set
      else {
        const item = await apiClient.getChildItem({
          params: {
            parent_uuid: parentItem.uuid,
            child_id: parseInt(childId),
          },
        });
        unlockChild();
        return item;
      }
    },
    [parentItem, childId, reloadFlag],
    null
  );

  if (parentId === undefined) {
    return <div>Please click the entry on the left</div>;
  }

  if (loadingParent || !parentItem) {
    return <LoadingPane label="Loading Job Group..." />;
  }

  if (loadingChild) {
    return (
      <>
        <ParentPane
          item={parentItem}
          refreshFunc={() => setReloadFlag(!reloadFlag)}
        />
        <LoadingPane label="Loading Job..." />
      </>
    );
  }

  return (
    <>
      <ParentPane
        item={parentItem}
        refreshFunc={() => setReloadFlag(!reloadFlag)}
      />
      <legend>Job information</legend>
      <ChildPane childItem={childItem} parentItem={parentItem} />
    </>
  );
};

const Home: React.FC = () => {
  const router = useRouter();
  const parentId = router.query.experiment as string | undefined;
  const childId = router.query.job as string | undefined;

  return (
    <div className="vh-100 d-flex flex-column">
      <Navigator currentPage="vae-trainer" />
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
              <DetailPane parentId={parentId} childId={childId} />
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
