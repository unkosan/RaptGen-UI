import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { apiClient } from "../../../../services/api-client";
import { formatDuration, intervalToDuration } from "date-fns";

import { responseGetItemChild } from "../../../../services/api-client";
import { responseGetItem } from "../../../../services/api-client";
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
import ClientOnly from "../../../common/client-only";

type ChildItem = z.infer<typeof responseGetItemChild>;
type Item = z.infer<typeof responseGetItem>;

const ParentPane: React.FC<{ item: Item; childId: number | null }> = ({
  item,
  childId,
}) => {
  const parentHead = (
    <>
      <h2>{item.name}</h2>
      <p>
        <div>
          Total duration:{" "}
          {formatDuration(
            intervalToDuration({ start: 0, end: item.duration * 1000 })
          )}
        </div>
        <div>The number of models to train: {item.reiteration}</div>
      </p>
      <p className="align-center">
        <b className="mr-2">Actions:</b>
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
  childId: number | null;
  isMultiple: boolean;
  parentStatus: "progress" | "suspend" | "success" | "failure" | "pending";
  parentUUID: string;
}> = ({ childItem, childId, isMultiple, parentStatus, parentUUID }) => {
  const [appliedDataset, setAppliedDataset] = useState<boolean>(false);

  useEffect(() => {
    if (childItem !== null) {
      setAppliedDataset(false);
    }
  }, [childItem]);

  if (childItem === null) {
    return <div>Please select an model on the left</div>;
  }
  let title = "";
  if (childId === null) {
    if (parentStatus === "progress" || parentStatus === "suspend") {
      title = `Current running model No. ${childItem.id}`;
    } else if (parentStatus === "success") {
      title = `Best model No. ${childItem.id}`;
    } else if (parentStatus === "failure") {
      title = `Model No. ${childItem.id} (Failed)`;
    } else {
      title = `Now pending model No. ${childItem.id}`;
    }
  } else {
    title = `Model No. ${childId}`;
  }

  const head = (
    <>
      <h3>{title}</h3>
      <p>
        <div>
          Duration:{" "}
          {formatDuration(
            intervalToDuration({ start: 0, end: childItem.duration * 1000 })
          )}
        </div>
      </p>
    </>
  );

  const actions = (
    <>
      <p className="align-center">
        {childItem.status === "failure" ||
        childItem.status === "pending" ? null : (
          <>
            <b className="mr-2">Actions: </b>
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
          </>
        )}
      </p>
      {childItem.status === "success" ? (
        <ApplyViewerButton
          uuid={parentUUID}
          childId={childItem.id}
          disabled={appliedDataset}
          setDisabled={setAppliedDataset}
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
          title="Latent Space"
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
      {isMultiple ? head : null}
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
        if (status === "progress" || status === "suspend") {
          const progIndex = summary.statuses.findLastIndex(
            (value) => value === "progress" || value === "suspend"
          );
          if (progIndex === -1) {
            setChildItem(null);
          }
          const childItem = await apiClient.getChildItem({
            params: {
              parent_uuid: parentId,
              child_id: summary.indices[progIndex],
            },
          });
          setChildItem(childItem);
        } else if (status === "failure") {
          const childItem = await apiClient.getChildItem({
            params: {
              parent_uuid: parentId,
              child_id: summary.indices[0],
            },
          });
          setChildItem(childItem);
        } else if (status === "pending") {
          const pendIndex = summary.statuses.findIndex(
            (value) => value === "pending"
          );
          if (pendIndex === -1) {
            setChildItem(null);
          }
          const childItem = await apiClient.getChildItem({
            params: {
              parent_uuid: parentId,
              child_id: summary.indices[pendIndex],
            },
          });
        } else if (status === "success") {
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

          const childItem = await apiClient.getChildItem({
            params: {
              parent_uuid: parentId,
              child_id: summary.indices[summary.indices[argmin]],
            },
          });
          setChildItem(childItem);
        } else {
          setChildItem(null);
        }
        console.log(item.params_training);
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
        childId={childId}
        isMultiple={item.reiteration !== 1}
        parentStatus={item.status}
        parentUUID={item.uuid}
      />
    </div>
  );
};

export default Main;
