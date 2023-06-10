import React from "react";
import { Badge, ProgressBar } from "react-bootstrap";
import { formatDuration, intervalToDuration } from "date-fns";

type Props =
  | {
      name: string;
      status: "success" | "failure" | "pending";
      onClick?: () => void;
    }
  | {
      name: string;
      status: "suspend" | "progress";
      onClick?: () => void;
      totalEpoch: number;
      currentEpoch: number;
      duration: number;
    };

const ChildJobCard: React.FC<Props> = (props) => {
  const { name, status } = props;

  let title;
  if (status === "progress") {
    const duration = intervalToDuration({
      start: 0,
      end: props.duration * 1000,
    });
    let durationText = "Running for ";
    durationText += formatDuration(duration);
    title = (
      <div className="d-flex justify-content-between">
        <span className="d-flex flex-column font-monospace">{name}</span>
        <small className="fw-light">{durationText}</small>
      </div>
    );
  } else {
    title = (
      <div className="d-flex justify-content-between align-self-center">
        <span className="d-flex flex-column font-monospace">{name}</span>
        <div className="d-flex">
          {status === "success" && (
            <Badge pill bg="success" className="align-self-center">
              {status}
            </Badge>
          )}
          {status === "failure" && (
            <Badge pill bg="danger" className="align-self-center">
              {status}
            </Badge>
          )}
          {status === "pending" && (
            <Badge pill bg="warning" className="align-self-center">
              {status}
            </Badge>
          )}
          {status === "suspend" && (
            <Badge pill bg="warning" className="align-self-center">
              {status}
            </Badge>
          )}
        </div>
      </div>
    );
  }

  let progress;
  if (status === "progress" || status === "suspend") {
    progress = (
      <div className="d-flex justify-content-between">
        <ProgressBar
          now={(props.currentEpoch / props.totalEpoch) * 100}
          className="w-100 align-self-center"
        />
        <small className="ms-3 font-monospace">
          {props.currentEpoch}&nbsp;/&nbsp;{props.totalEpoch}
        </small>
      </div>
    );
  } else {
    progress = null;
  }

  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "#f5f5f5",
        borderRadius: "0.3rem",
        border: "1px solid lightgray",
        paddingBlock: "0.5rem",
        paddingInline: "1rem",
        marginTop: "0.4rem",
        cursor: "pointer",
      }}
      onClick={props.onClick}
    >
      {title}
      {progress}
    </div>
  );
};

export default ChildJobCard;
