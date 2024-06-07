import React from "react";
import ChildJobCard from "./child-job-card";
import { Badge, ProgressBar } from "react-bootstrap";
import { formatDuration, intervalToDuration } from "date-fns";
import { set } from "lodash";
import { c } from "msw/lib/glossary-de6278a9";

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
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  onChildClick?: (
    mixture: number,
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => void;
  duration: number;
  series: TypeChild[];
};

const JobCard: React.FC<Props> = (props) => {
  const { name, status, series } = props;
  const [clickedModel, setClickedModel] = React.useState<number | null>(null);

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
            onClick={(event) => {
              if (props.onChildClick) {
                props.onChildClick(child.id, event);
              }
              setClickedModel(child.id);
              event.stopPropagation();
            }}
            totalEpoch={child.epochsTotal}
            currentEpoch={child.epochsCurrent}
            duration={child.duration}
            isSelected={props.isSelected && clickedModel === child.id}
          />
        );
      }
    });
  }

  return (
    <div
      style={{
        width: "100%",
        backgroundColor: props.isSelected ? "lightgray" : "#E5E5E5",
        borderRadius: "0.3rem",
        border:
          props.isSelected && clickedModel === null
            ? "1px solid gray"
            : "1px solid #E5E5E5",
        paddingBlock: "0.7rem",
        paddingInline: "1rem",
        cursor: "pointer",
        marginBlock: "1rem",
        boxShadow: "0 0 0.5rem 0.1rem rgba(0, 0, 0, 0.1)",
      }}
      onClick={
        props.onClick !== undefined
          ? (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
              setClickedModel(null);
              (
                props.onClick as (
                  event: React.MouseEvent<HTMLElement, MouseEvent>
                ) => void
              )(event);
            }
          : undefined
      }
    >
      {title}
      {content}
    </div>
  );
};

export default JobCard;
