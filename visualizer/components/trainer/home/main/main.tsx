import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { apiClient } from "../../../../services/api-client";
import { formatDuration, intervalToDuration } from "date-fns";

import { responseGetItemChild } from "../../../../services/route/train";
import { responseGetItem } from "../../../../services/route/train";
import { z } from "zod";
import { Alert, Badge } from "react-bootstrap";
import { Summary } from "./summary";
import { LatentGraph } from "./latent-graph";
import { LossesGraph } from "./losses-graph";
import { TrainingParams } from "./training-params";
import {
  ApplyViewerButton,
  DeleteButton,
  DownloadCurrentCodesButton,
  DownloadLossesButton,
  KillButton,
  ResumeButton,
  StopButton,
} from "./action-buttons";
import _ from "lodash";
import { useDispatch } from "react-redux";

type ChildItem = z.infer<typeof responseGetItemChild>;
type Item = z.infer<typeof responseGetItem>;

const ParentPane: React.FC<{ item: Item; childId: number | null }> = ({
  item,
  childId,
}) => {
  const dispatch = useDispatch();

  const parentHead = (
    <>
      <h2>
        <div
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "blue";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "black";
          }}
          onClick={() => {
            dispatch({
              type: "pageConfig/set",
              payload: {
                parentId: item.uuid,
                childId: null,
              },
            });
          }}
          style={{ cursor: "pointer", transition: "color 0.2s ease-in-out" }}
        >
          {item.name}
        </div>
      </h2>
      <p>
        <div>Start time: {new Date(item.start * 1000).toLocaleString()}</div>
        <div>
          Total duration:{" "}
          {formatDuration(
            intervalToDuration({ start: 0, end: item.duration * 1000 })
          )}
        </div>
        <div>The number of models to train: {item.reiteration}</div>
      </p>
      <p className="d-flex align-items-center">
        <b className="me-2">Actions:</b>
        {item.status === "progress" ? (
          <StopButton uuid={item.uuid} />
        ) : item.status === "suspend" ? (
          <ResumeButton uuid={item.uuid} />
        ) : null}

        {item.status === "progress" || item.status === "suspend" ? (
          <KillButton uuid={item.uuid} />
        ) : null}

        <DeleteButton uuid={item.uuid} />
        <Badge pill bg="success" className="mx-1">
          Rename
        </Badge>
      </p>
    </>
  );

  const summary = (
    <div>
      <legend>Summary</legend>
      <Summary value={item.summary} />
    </div>
  );

  const paramsList = (
    <div>
      <legend>Training Parameters</legend>
      <TrainingParams value={item.params_training} />
    </div>
  );

  return (
    <>
      {parentHead}
      {childId === null && item.reiteration !== 1 ? summary : null}
      {paramsList}
    </>
  );
};

const ChildPane: React.FC<{
  childItem: ChildItem | null;
  parentItem: Item | null;
  // building the title partially dependent on the parentItem
  isRepresenter?: boolean;
  // whether the child is a representer of the parent model
}> = ({ childItem, parentItem, isRepresenter }) => {
  const [published, setPublished] = useState<boolean>(false);

  useEffect(() => {
    if (childItem !== null) {
      setPublished(false);
    }
  }, [childItem]);

  if (parentItem === null) {
    // do not show anything, instructions are shown in the parent pane
    return <div></div>;
  }

  if (childItem === null) {
    // this should not happen (cause childId is null, Representer will be filled as childItem)
    return <div>Please select a model on the left</div>;
  }

  let title: string = "";
  if (isRepresenter) {
    switch (parentItem.status) {
      case "progress":
      case "suspend":
        title = `Current training model`;
        break;
      case "success":
        title = `Most optimal model`;
        break;
      case "failure":
        title = `Training failed`;
        break;
      case "pending":
        title = `Now pending...`;
        break;
    }
  } else {
    title = `Model No. ${childItem.id}`;
  }

  const head = (
    <>
      <h3>{title}</h3>
      <p>
        {isRepresenter ? (
          <>
            Model: No. {childItem.id}
            <br />
          </>
        ) : null}
        Duration:{" "}
        {formatDuration(
          intervalToDuration({ start: 0, end: childItem.duration * 1000 })
        )}
      </p>
    </>
  );

  const actions = (
    <>
      <p className="align-center">
        {childItem.status === "failure" ||
        childItem.status === "pending" ? null : (
          <div className="d-flex align-items-center">
            <b className="me-2">Actions: </b>
            <DownloadCurrentCodesButton
              randomRegions={childItem.latent.random_regions}
              duplicates={childItem.latent.duplicates}
              coordsX={childItem.latent.coords_x}
              coordsY={childItem.latent.coords_y}
            />
            <DownloadLossesButton
              trainLoss={childItem.losses.train_loss}
              testLoss={childItem.losses.test_loss}
              testReconLoss={childItem.losses.test_recon}
              testKldLoss={childItem.losses.test_kld}
            />
          </div>
        )}
      </p>
      {childItem.status === "success" ? (
        <ApplyViewerButton
          uuid={parentItem.uuid}
          childId={childItem.id}
          disabled={childItem.is_added_viewer_dataset || published}
          setDisabled={setPublished}
        />
      ) : null}
    </>
  );

  const body =
    childItem.status === "failure" ? (
      <div>
        <Alert variant="danger">
          <Alert.Heading>Runtime Error</Alert.Heading>
          <div style={{ fontFamily: "monospace" }}>{childItem.error_msg}</div>
        </Alert>
      </div>
    ) : childItem.status === "pending" ? null : (
      <>
        <LatentGraph
          title={`Latent Space`}
          vaeData={{
            coordsX: childItem.latent.coords_x,
            coordsY: childItem.latent.coords_y,
            randomRegions: childItem.latent.random_regions,
            duplicates: childItem.latent.duplicates,
            minCount: 1,
          }}
        />
        <LossesGraph
          title="Loss Transition"
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

  return (
    <>
      {parentItem.reiteration === 1 ? null : head}
      {actions}
      {body}
    </>
  );
};

const Main: React.FC = () => {
  // retrieved from page config in redux. not always available
  const parentId = useSelector((state: RootState) => state.pageConfig.parentId);
  const childId = useSelector((state: RootState) => state.pageConfig.childId);

  // items shown on the page
  const [item, setItem] = React.useState<Item | null>(null);
  const [childItem, setChildItem] = React.useState<ChildItem | null>(null);

  // Update information of the parent job if avaiable
  useEffect(() => {
    if (parentId) {
      apiClient
        .getItem({
          params: {
            parent_uuid: parentId,
          },
        })
        .then((item) => {
          setItem(item);
        });
    } else {
      setItem(null);
      setChildItem(null);
    }
  }, [parentId]);

  // Update information of the child job
  useEffect(() => {
    // when a parent is specified but the child is not
    if (item !== null && childId === null) {
      (async () => {
        const summary = item.summary;
        const status = item.status;
        switch (status) {
          case "progress":
          case "suspend":
            const progIndex = summary.statuses.findLastIndex(
              (value) => value === "progress" || value === "suspend"
            );
            setChildItem(
              progIndex === -1
                ? null
                : await apiClient.getChildItem({
                    params: {
                      parent_uuid: parentId,
                      child_id: summary.indices[progIndex],
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
          case "success":
            // find the model with the minimum NLL but in the range that the model is "success"
            const argmin = _.zip(summary.minimum_NLLs, summary.statuses)
              .map(([nll, status]) =>
                nll === null ? [Infinity, status] : [nll, status]
              )
              .reduce(
                (acc, [nll, status], index) => {
                  if (
                    nll === undefined ||
                    status === undefined ||
                    acc[0] === undefined
                  ) {
                    return acc;
                  }
                  if (status === "success" && nll < acc[0]) {
                    return [nll, index];
                  } else {
                    return acc;
                  }
                },
                [Infinity, -1]
              )[1] as number;

            setChildItem(
              await apiClient.getChildItem({
                params: {
                  parent_uuid: parentId,
                  child_id: summary.indices[summary.indices[argmin]],
                },
              })
            );
            break;

          default:
            setChildItem(null);
        }
      })();
    } else if (item !== null && childId !== null) {
      apiClient
        .getChildItem({
          params: {
            parent_uuid: parentId,
            child_id: childId,
          },
        })
        .then((childItem) => {
          setChildItem(childItem);
        })
        .catch((err) => {
          console.log(err);
          setChildItem(null);
        });
    }
  }, [childId, item]);

  if (!item) {
    return <div>Please click the entry on the left</div>;
  }

  return (
    <div>
      <ParentPane item={item} childId={childId} />
      <ChildPane
        childItem={childItem}
        parentItem={item}
        isRepresenter={childId === null}
      />
    </div>
  );
};

export default Main;
