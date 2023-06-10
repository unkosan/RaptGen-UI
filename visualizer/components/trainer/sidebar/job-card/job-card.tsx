import React from "react";
import ChildJobCard from "./child-job-card";
import { Badge, ProgressBar } from "react-bootstrap";
import { formatDuration, intervalToDuration } from "date-fns";

type TypeChild = {
  id: number;
  duration: number;
  status: "success" | "failure" | "pending" | "progress" | "suspend";
  epochsTotal: number;
  epochsCurrent: number;
};

type Props = {
  name: string;
  isSelected?: boolean;
  status: "success" | "failure" | "pending" | "progress" | "suspend";
  onClick?: () => void;
  onChildClick?: (mixture: number) => void;
  duration: number;
  series: TypeChild[];
};

const JobCardAlt: React.FC<Props> = (props) => {
  const { name, status, series } = props;

  let title;
  if (status === "progress") {
    let durationText;
    if (series.length === 1) {
      durationText = "Running for ";
    } else {
      durationText = "Total Duration ";
    }
    const duration = intervalToDuration({
      start: 0,
      end: props.duration * 1000,
    });
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

  let content = null;
  if (series.length === 1) {
    const child = series[0];
    if (child.status === "progress" || child.status === "suspend") {
      content = (
        <div className="d-flex justify-content-between">
          <ProgressBar
            now={(child.epochsCurrent / child.epochsTotal) * 100}
            className="w-100 align-self-center"
          />
          <small className="ms-3 font-monospace">
            {child.epochsCurrent}&nbsp;/&nbsp;{child.epochsTotal}
          </small>
        </div>
      );
    }
  } else {
    content = series.map((child) => {
      if (
        props.isSelected ||
        child.status === "progress" ||
        child.status === "suspend"
      ) {
        return (
          <ChildJobCard
            key={child.id}
            name={"Mixture " + child.id}
            status={child.status}
            onClick={() => {
              if (props.onChildClick) {
                props.onChildClick(child.id);
              }
            }}
            totalEpoch={child.epochsTotal}
            currentEpoch={child.epochsCurrent}
            duration={child.duration}
          />
        );
      }
    });
  }

  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "lightgray",
        borderRadius: "0.3rem",
        border: "1px solid gray",
        paddingBlock: "0.7rem",
        paddingInline: "1rem",
        cursor: "pointer",
        marginBlock: "1rem",
      }}
    >
      {title}
      {content}
    </div>
  );
};

const JobCardAlt2: React.FC = () => {
  let title = (
    <div className="d-flex justify-content-between align-self-center">
      <span className="d-flex flex-column font-monospace">Aloha</span>
      <div className="d-flex">
        <Badge pill bg="success" className="align-self-center">
          success
        </Badge>
      </div>
    </div>
  );

  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "lightgray",
        borderRadius: "0.3rem",
        border: "1px solid gray",
        paddingBlock: "0.7rem",
        paddingInline: "1rem",
        cursor: "pointer",
        marginBlock: "1rem",
      }}
    >
      {title}
      {/* <ChildJobCard
        name={"No.1"}
        status="success"
        onClick={() => {
          console.log("clicked");
        }}
      /> */}
      <ChildJobCard
        name={"No.2"}
        status="progress"
        onClick={() => {
          console.log("clicked");
        }}
        currentEpoch={341}
        totalEpoch={1000}
        duration={400}
      />
    </div>
  );
};

export default JobCardAlt;
