import "bootswatch/dist/cerulean/bootstrap.min.css";
import { NextPage } from "next";
import Head from "next/head";
import { Col, Container, Row } from "react-bootstrap";
import Navigator from "~/components/common/navigator";
import "@inovua/reactdatagrid-community/index.css";
import Footer from "~/components/common/footer";
import AddJobButton from "~/components/gmm/home/add-job-button";
import GmmJobsList from "~/components/gmm/home/gmm-jobs-list/gmm-jobs-list";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Alert, Button } from "react-bootstrap";
import { z } from "zod";
import { apiClient } from "~/services/api-client";
import { responseGetGMMJobsItems } from "~/services/route/gmm";
import { ArrowClockwise } from "react-bootstrap-icons";
import { useIsLoading } from "~/hooks/common";
import LoadingPane from "~/components/common/loading-pane";
import TimeDescription from "~/components/gmm/home/time-description";
import { ActionButtons } from "~/components/gmm/home/action-buttons";
import ParamsTable from "~/components/gmm/home/params-table";
import { CurrentInfo } from "~/components/gmm/home/current-info";
import { GmmNumComponentSelector } from "~/components/gmm/home/gmm-job-handler";
import LatentGraph from "~/components/gmm/home/latent-graph";
import BicGraph from "~/components/gmm/home/bic-graph";

type JobItem = z.infer<typeof responseGetGMMJobsItems>;

const OptimalGmmPane: React.FC<{
  uuid: string;
  item: JobItem;
}> = ({ uuid, item }) => {
  switch (item.status) {
    case "pending":
      return (
        <Alert variant="info">
          <Alert.Heading>Pending</Alert.Heading>
          <p>The job is pending. Please wait for a while.</p>
        </Alert>
      );
    case "failure":
      return (
        <Alert variant="danger">
          <Alert.Heading>Runtime Error</Alert.Heading>
          <div style={{ fontFamily: "monospace" }}>{item.error_msg}</div>
        </Alert>
      );
    case "success":
      return (
        <>
          <legend>Optimal GMM</legend>
          <GmmNumComponentSelector uuid={uuid} jobItem={item} />
          <LatentGraph
            title="Latent Space"
            vaeData={{
              coordsX: item.latent.coords_x,
              coordsY: item.latent.coords_y,
              randomRegions: item.latent.random_regions,
              duplicates: item.latent.duplicates,
              minCount: 1,
            }}
            gmmData={{
              means: item.gmm.means,
              covariances: item.gmm.covs,
            }}
          />
          <BicGraph
            n_components={item.bic.n_components}
            values={item.bic.bics}
            step_size={item.params.step_size}
          />
        </>
      );
    default:
      return (
        <>
          <legend>Running Job info</legend>
          <CurrentInfo jobItem={item} />
          <legend>Optimal GMM</legend>
          <GmmNumComponentSelector uuid={uuid} jobItem={item} />
          <LatentGraph
            title="Latent Space"
            vaeData={{
              coordsX: item.latent.coords_x,
              coordsY: item.latent.coords_y,
              randomRegions: item.latent.random_regions,
              duplicates: item.latent.duplicates,
              minCount: 1,
            }}
            gmmData={{
              means: item.gmm.means,
              covariances: item.gmm.covs,
            }}
          />
          <BicGraph
            n_components={item.bic.n_components}
            values={item.bic.bics}
            step_size={item.params.step_size}
          />
        </>
      );
  }
};

const DetailPane: React.FC = () => {
  const router = useRouter();
  const currentUUID = router.query.experiment as string | undefined;
  const currentNumComponents = router.query.n_components as string | undefined;
  const [jobItem, setJobItem] = useState<JobItem | null>(null);
  const [loadingJob, lock, unlock] = useIsLoading();

  const refresh = async () => {
    if (!currentUUID) {
      return;
    }

    lock();
    const res = await apiClient.getGMMJobs({
      queries: {
        n_components:
          currentNumComponents === undefined
            ? undefined
            : parseInt(currentNumComponents),
      },
      params: { uuid: currentUUID },
    });
    setJobItem(res);
    unlock();
  };

  useEffect(() => {
    refresh();
  }, [currentUUID, currentNumComponents]);

  if (!currentUUID) {
    return <div>Please select items listed left.</div>;
  }

  if (loadingJob || !jobItem) {
    return <LoadingPane label="Loading..." />;
  }

  return (
    <div>
      <div className="justify-content-between d-flex">
        <h3>Experiment: {jobItem.name}</h3>
        <div>
          <Button variant="primary" onClick={refresh}>
            <div className="align-items-center d-flex">
              <ArrowClockwise />
              <span className="ms-2">Refresh</span>
            </div>
          </Button>
        </div>
      </div>
      <TimeDescription
        startTimeSecond={jobItem.start}
        durationTimeSecond={jobItem.duration}
      />
      <ActionButtons
        uuid={currentUUID}
        refreshFunc={refresh}
        jobName={jobItem.name}
        jobStatus={jobItem.status}
      />
      <ParamsTable params={jobItem.params} />
      <OptimalGmmPane uuid={currentUUID} item={jobItem} />
    </div>
  );
};

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
              <AddJobButton />
              <GmmJobsList />
            </Col>
            <Col>
              <DetailPane />
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
        <meta
          name="description"
          content="Train page for Gaussian Mixture Model"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Home />
    </>
  );
};

export default PageRoot;
