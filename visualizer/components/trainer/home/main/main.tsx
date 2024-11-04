import React, { useEffect, useState } from "react";
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
} from "react-bootstrap";
import { Summary } from "./summary";
import { LatentGraph } from "./latent-graph";
import { LossesGraph } from "./losses-graph";
import { TrainingParams } from "./training-params";
import {
  ApplyViewerButton,
  DeleteButton,
  DownloadCurrentCodesButton,
  DownloadLossesButton,
  RenameButton,
  ResumeButton,
  StopButton,
} from "./action-buttons";
import _ from "lodash";
import { useRouter } from "next/router";
import { ArrowClockwise } from "react-bootstrap-icons";

type ChildItem = z.infer<typeof responseGetItemChild>;
type Item = z.infer<typeof responseGetItem>;

const ParentPane: React.FC<{
  item: Item;
  updateFunc: (parentId: string | undefined) => Promise<void>;
}> = ({ item, updateFunc }) => {
  return (
    <>
      <div className="justify-content-between d-flex">
        <h2>Experiment: {item.name}</h2>
        <div>
          <Button
            variant="primary"
            onClick={() => {
              updateFunc(item.uuid);
            }}
          >
            <div className="align-items-center d-flex">
              <ArrowClockwise />
              <span className="ms-2">Refresh</span>
            </div>
          </Button>
        </div>
      </div>
      <p>
        <div>Start time: {new Date(item.start * 1000).toLocaleString()}</div>
        <div>The number of models to train: {item.reiteration}</div>
      </p>
      <p className="d-flex align-items-center">
        <b className="me-2">Actions:</b>
        {item.status === "progress" ? (
          <StopButton uuid={item.uuid} updateFunc={updateFunc} />
        ) : item.status === "suspend" ? (
          <ResumeButton uuid={item.uuid} updateFunc={updateFunc} />
        ) : null}

        <DeleteButton uuid={item.uuid} updateFunc={updateFunc} />
        <RenameButton
          uuid={item.uuid}
          defaultName={item.name}
          updateFunc={updateFunc}
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

const ChildPane: React.FC<{
  childItem: ChildItem | null;
  parentItem: Item;
  currentRunning: number[];
  optimalModel: number | null;
}> = ({ childItem, parentItem, currentRunning, optimalModel }) => {
  const [published, setPublished] = useState<boolean>(false);
  const router = useRouter();

  if (childItem === null) {
    return <div>Please select a model</div>;
  }

  const net_duration =
    childItem.status === "progress"
      ? Date.now() -
        (childItem.datetime_start - childItem.duration_suspend) * 1000
      : childItem.status === "pending"
      ? 0
      : (childItem.datetime_laststop -
          childItem.datetime_start -
          childItem.duration_suspend) *
        1000;
  const suspend_duration =
    childItem.status === "suspend"
      ? Date.now() +
        (childItem.duration_suspend - childItem.datetime_laststop) * 1000
      : childItem.duration_suspend * 1000;

  return (
    <>
      <legend>Job information</legend>
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
              if (currentRunning.includes(index)) {
                return (
                  <option key={index} value={index}>
                    {index} (in progress)
                  </option>
                );
              } else if (optimalModel === index) {
                return (
                  <option key={index} value={index}>
                    {index} (optimal)
                  </option>
                );
              } else {
                return (
                  <option key={index} value={index}>
                    {index}
                  </option>
                );
              }
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

      <p>
        <>Duration for training: </>
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

      {childItem.status === "failure" ? (
        <div>
          <Alert variant="danger">
            <Alert.Heading>Runtime Error</Alert.Heading>
            <div style={{ fontFamily: "monospace" }}>{childItem.error_msg}</div>
          </Alert>
        </div>
      ) : childItem.status === "pending" ? null : (
        <>
          <Card className="mb-3">
            <Card.Header className="d-flex justify-content-between">
              <span>Latent Space</span>
              <span>
                <DownloadCurrentCodesButton
                  randomRegions={childItem.latent.random_regions}
                  duplicates={childItem.latent.duplicates}
                  coordsX={childItem.latent.coords_x}
                  coordsY={childItem.latent.coords_y}
                />
              </span>
            </Card.Header>
            <Card.Body>
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
            </Card.Body>
          </Card>

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

const Main: React.FC = () => {
  // retrieved from page config in redux. not always available
  const router = useRouter();
  const parentId = router.query.experiment as string | undefined;
  const childId = router.query.job as string | undefined;

  // items shown on the page
  const [item, setItem] = React.useState<Item | null>(null);
  const [childItem, setChildItem] = React.useState<ChildItem | null>(null);

  // current running model
  const [currentModels, setCurrentModels] = React.useState<number[]>([]);
  // most optimal model
  const [optimalModel, setOptimalModel] = React.useState<number | null>(null);

  // Update information of the parent job if avaiable
  const update = async (parentId: string | undefined) => {
    if (parentId) {
      const item = await apiClient.getItem({
        params: {
          parent_uuid: parentId,
        },
      });
      setItem(item);
    } else {
      setItem(null);
      setChildItem(null);
    }
  };
  useEffect(() => {
    update(parentId);
  }, [parentId]);

  // Update information of the child job
  useEffect(() => {
    if (parentId === undefined || item === null) return;

    if (parentId !== item.uuid) return;

    const summary = item.summary;
    const status = item.status;

    const runningIndices = summary.statuses.flatMap((value, index) => {
      return value === "progress" || value === "suspend" ? [index] : [];
    });
    setCurrentModels(runningIndices);

    const successIndices = summary.statuses.flatMap((value, index) => {
      return value === "success" ? [index] : [];
    });
    const nlls = summary.minimum_NLLs.flatMap((value, index) => {
      return value === null ? [Infinity] : [value];
    });
    const argmin =
      successIndices.length > 1
        ? successIndices.reduce((acc, index) => {
            if (nlls[index] < nlls[acc]) {
              return index;
            } else {
              return acc;
            }
          })
        : successIndices.length === 1
        ? successIndices[0]
        : null;
    setOptimalModel(argmin);

    if (childId === undefined) {
      (async () => {
        switch (status) {
          case "progress":
          case "suspend":
            setChildItem(
              runningIndices.length === 0
                ? null
                : await apiClient.getChildItem({
                    params: {
                      parent_uuid: parentId,
                      child_id: summary.indices[runningIndices[0]],
                    },
                  })
            );
            break;
          case "success":
            setChildItem(
              await apiClient.getChildItem({
                params: {
                  parent_uuid: parentId,
                  child_id: summary.indices[argmin as number],
                },
              })
            );
            break;
          case "failure":
            setChildItem(
              await apiClient.getChildItem({
                params: {
                  parent_uuid: parentId,
                  child_id: summary.indices[0],
                },
              })
            );
            break;
          case "pending":
            const pendIndex = summary.statuses.findIndex(
              (value) => value === "pending"
            );
            setChildItem(
              pendIndex === -1
                ? null
                : await apiClient.getChildItem({
                    params: {
                      parent_uuid: parentId,
                      child_id: summary.indices[pendIndex],
                    },
                  })
            );
            break;
          default:
            setChildItem(null);
        }
      })();
    } else if (parseInt(childId) < item.reiteration) {
      // when a parent and a child is specified
      apiClient
        .getChildItem({
          params: {
            parent_uuid: parentId,
            child_id: parseInt(childId),
          },
        })
        .then((childItem) => {
          setChildItem(childItem);
        })
        .catch((err) => {
          console.log(err);
          setChildItem(null);
        });
    } else {
      setChildItem(null);
    }
  }, [childId, item, parentId]);

  if (!item) {
    return <div>Please click the entry on the left</div>;
  }

  return (
    <div>
      <ParentPane item={item} updateFunc={update} />
      <ChildPane
        childItem={childItem}
        parentItem={item}
        currentRunning={currentModels}
        optimalModel={optimalModel}
      />
    </div>
  );
};

export default Main;
