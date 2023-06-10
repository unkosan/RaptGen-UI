import React from "react";
import { Badge, Card, ProgressBar } from "react-bootstrap";

type Props =
  | {
      name: string;
      status: "success" | "failure" | "pending";
    }
  | {
      name: string;
      status: "suspended" | "progress";
      totalEpoch: number;
      currentEpoch: number;
      duration: number;
      multiple?: {
        currentIndex: number;
        reiteration: number;
        totalDuration: number;
      };
    };

const JobCard: React.FC<Props> = (props) => {
  const { name, status } = props;
  let contentHead: JSX.Element = <Card.Title>{name}</Card.Title>;
  if (status === "progress") {
    const durationText = props.multiple
      ? "Total Duration " + props.multiple.totalDuration + " sec"
      : "Running for " + props.duration + " sec";
    contentHead = (
      <div className="d-flex justify-content-between">
        {contentHead}
        <div className="text-muted">{durationText}</div>
      </div>
    );
  } else {
    contentHead = (
      <div className="d-flex justify-content-between">
        {contentHead}
        <div>
          {status === "success" && (
            <Badge pill bg="success">
              {status}
            </Badge>
          )}
          {status === "failure" && (
            <Badge pill bg="danger">
              {status}
            </Badge>
          )}
          {status === "pending" && (
            <Badge pill bg="warning">
              {status}
            </Badge>
          )}
          {status === "suspended" && (
            <Badge pill bg="warning">
              {status}
            </Badge>
          )}
        </div>
      </div>
    );
  }

  let contentBody: JSX.Element = <></>;
  let contentFoot: JSX.Element = <></>;
  if (status === "progress" || status === "suspended") {
    contentBody = props.multiple ? (
      <>
        <Card>
          <Card.Body>
            <div className="d-flex justify-content-between">
              <Card.Title>Model No.{props.multiple.currentIndex}</Card.Title>
              <div className="text-muted">Running for {props.duration} sec</div>
            </div>
            <div className="d-flex justify-content-between">
              <ProgressBar
                className="flex-grow-1 align-self-center"
                now={(props.currentEpoch / props.totalEpoch) * 100}
              />
              <div>
                &nbsp; epoch {props.currentEpoch} / {props.totalEpoch}
              </div>
            </div>
          </Card.Body>
        </Card>
        iteration {props.multiple.currentIndex} / {props.multiple.reiteration}
      </>
    ) : (
      <>
        epoch {props.currentEpoch} / {props.totalEpoch}
      </>
    );
    contentFoot = props.multiple ? (
      <ProgressBar
        now={(props.multiple.currentIndex / props.multiple.reiteration) * 100}
      />
    ) : (
      <ProgressBar now={(props.currentEpoch / props.totalEpoch) * 100} />
    );
  }

  return (
    <Card className="mb-3">
      <Card.Body>
        {contentHead}
        {contentBody}
      </Card.Body>
      {contentFoot}
    </Card>
  );
};

export default JobCard;
