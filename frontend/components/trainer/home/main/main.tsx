import { useState } from "react";
import { apiClient } from "~/services/api-client";
import { formatDuration, intervalToDuration } from "date-fns";

import { responseGetItemChild } from "~/services/route/train";
import { responseGetItem } from "~/services/route/train";
import { z } from "zod";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  InputGroup,
  Row,
  Spinner,
} from "react-bootstrap";
import { Summary } from "./summary";
import { LatentGraph } from "./latent-graph";
import { LossesGraph } from "./losses-graph";
import { TrainingParams } from "./training-params";
import {
  ApplyViewerButton,
  DeleteButton,
  DownloadLossesButton,
  RenameButton,
  ResumeButton,
  StopButton,
} from "./action-buttons";
import _ from "lodash";
import { useRouter } from "next/router";
import { ArrowClockwise } from "react-bootstrap-icons";
import { JobStatusToLabel } from "~/components/common/status-to-label";
import { useAsyncMemo, useIsLoading } from "~/hooks/common";

type ChildItem = z.infer<typeof responseGetItemChild>;
type ParentItem = z.infer<typeof responseGetItem>;

const ParamsParentJob: React.FC<{
  item: ParentItem;
}> = ({ item }) => {
  return (
    <p>
      <span className="fw-semibold">Start time: </span>
      {new Date(item.start * 1000).toLocaleString()}
      <br />
      <span className="fw-semibold">The number of models to train: </span>
      {item.reiteration}
    </p>
  );
};

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
      <ParamsParentJob item={item} />
      <p className="d-flex align-items-center">
        <span className="me-2 fw-semibold">Actions: </span>
        {item.status === "progress" ? (
          <StopButton uuid={item.uuid} refreshFunc={refreshFunc} />
        ) : item.status === "suspend" ? (
          <ResumeButton uuid={item.uuid} refreshFunc={refreshFunc} />
        ) : null}

        <DeleteButton uuid={item.uuid} refreshFunc={refreshFunc} />
        <RenameButton
          uuid={item.uuid}
          defaultName={item.name}
          refreshFunc={refreshFunc}
        />
      </p>

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

const ParamsChildJob: React.FC<{
  item: ChildItem;
}> = ({ item }) => {
  const net_duration =
    item.status === "progress"
      ? Date.now() - (item.datetime_start - item.duration_suspend) * 1000
      : item.status === "pending"
      ? 0
      : (item.datetime_laststop - item.datetime_start - item.duration_suspend) *
        1000;
  const suspend_duration =
    item.status === "suspend"
      ? Date.now() + (item.duration_suspend - item.datetime_laststop) * 1000
      : item.duration_suspend * 1000;

  return (
    <p>
      {/* <span className="fw-semibold">Status: </span>
      <JobStatusToLabel status={item.status} />
      <br /> */}
      <span className="fw-semibold">Duration for training: </span>
      {formatDuration(intervalToDuration({ start: 0, end: net_duration }))}
      {suspend_duration ? (
        <>
          {" "}
          (Suspended for{" "}
          {formatDuration(
            intervalToDuration({
              start: 0,
              end: suspend_duration,
            })
          )}
          )
        </>
      ) : null}
    </p>
  );
};

const ChildJobHandler: React.FC<{
  childItem: ChildItem;
  parentItem: ParentItem;
}> = ({ childItem, parentItem }) => {
  const [published, setPublished] = useState<boolean>(false);
  const router = useRouter();

  return (
    <Form.Group>
      <InputGroup className="mb-3">
        <InputGroup.Text>Target model ID</InputGroup.Text>
        <Form.Control
          as="select"
          onChange={(e) => {
            router.push(
              `?experiment=${parentItem.uuid}&job=${e.currentTarget.value}`,
              undefined,
              {
                scroll: false,
              }
            );
          }}
          value={childItem.id}
        >
          {parentItem.summary.indices.map((index) => {
            return (
              <option key={index} value={index}>
                {index}
              </option>
            );
          })}
        </Form.Control>
        {childItem.status === "success" ? (
          <ApplyViewerButton
            uuid={parentItem.uuid}
            childId={
              isNaN(parseInt(router.query.job as string))
                ? undefined
                : parseInt(router.query.job as string)
            }
            disabled={childItem.is_added_viewer_dataset || published}
            setDisabled={setPublished}
          />
        ) : null}
      </InputGroup>
    </Form.Group>
  );
};

const ChildPane: React.FC<{
  childItem: ChildItem | null;
  parentItem: ParentItem;
}> = ({ childItem, parentItem }) => {
  if (childItem === null) {
    return <div>Please select a model</div>;
  }

  return (
    <>
      <legend>Job information</legend>
      <ChildJobHandler childItem={childItem} parentItem={parentItem} />
      <ParamsChildJob item={childItem} />

      {childItem.status === "failure" ? (
        <div>
          <Alert variant="danger">
            <Alert.Heading>Runtime Error</Alert.Heading>
            <div style={{ fontFamily: "monospace" }}>{childItem.error_msg}</div>
          </Alert>
        </div>
      ) : childItem.status === "pending" ? null : (
        <>
          <LatentGraph
            title={""}
            vaeData={{
              coordsX: childItem.latent.coords_x,
              coordsY: childItem.latent.coords_y,
              randomRegions: childItem.latent.random_regions,
              duplicates: childItem.latent.duplicates,
              minCount: 1,
            }}
          />

          <Card className="mb-3">
            <Card.Header className="d-flex justify-content-between">
              <span>Loss Transition</span>
              <span>
                <DownloadLossesButton
                  trainLoss={childItem.losses.train_loss}
                  testLoss={childItem.losses.test_loss}
                  testReconLoss={childItem.losses.test_recon}
                  testKldLoss={childItem.losses.test_kld}
                />
              </span>
            </Card.Header>
            <Card.Body>
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
            </Card.Body>
          </Card>
        </>
      )}
    </>
  );
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

const Main: React.FC = () => {
  // retrieved from page config in redux. not always available
  const router = useRouter();
  const parentId = router.query.experiment as string | undefined;
  const childId = router.query.job as string | undefined;

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

  const update = () => {
    setReloadFlag(!reloadFlag);
  };

  if (parentId === undefined) {
    return <div>Please click the entry on the left</div>;
  }

  if (loadingParent) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Spinner
          animation="border"
          variant="primary"
          role="status"
          className="mx-auto"
        />
        <div className="ms-2 fs-3">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      {loadingParent || !parentItem ? null : (
        <ParentPane item={parentItem} refreshFunc={update} />
      )}
      {loadingChild || !childItem || !parentItem ? (
        <div className="d-flex justify-content-center h-full w-full">
          <div className="mx-auto d-flex align-items-center">
            <Spinner
              animation="border"
              variant="primary"
              role="status"
              className="mx-auto"
            />
            <div className="ms-2 fs-3">Loading...</div>
          </div>
        </div>
      ) : (
        <ChildPane childItem={childItem} parentItem={parentItem} />
      )}
    </div>
  );
};

export default Main;
