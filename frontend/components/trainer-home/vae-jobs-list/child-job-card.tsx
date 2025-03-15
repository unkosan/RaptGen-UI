import React from "react";
import { Badge, ProgressBar } from "react-bootstrap";
import { useChildJobCard } from "./hooks/use-child-job-card";
import { JobStatus } from "./hooks/use-job-card";

type BaseProps = {
  name: string;
  status: JobStatus;
  isSelected?: boolean;
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
};

type ProgressProps = BaseProps & {
  status: "suspend" | "progress";
  totalEpoch: number;
  currentEpoch: number;
  duration: number;
};

type Props = BaseProps | ProgressProps;

/**
 * ChildJobCard component displays information about a child job
 */
const ChildJobCard: React.FC<Props> = (props) => {
  const { name, status, isSelected } = props;

  // Determine if this is a progress/suspend job with additional props
  const isProgressJob = status === "progress" || status === "suspend";
  const duration = isProgressJob
    ? (props as ProgressProps).duration
    : undefined;

  const { formatDurationText, handleClick, getCardStyle } = useChildJobCard({
    status,
    duration,
    isSelected,
    onClick: props.onClick,
  });

  // Render title with status badge or duration
  const renderTitle = () => {
    if (status === "progress") {
      const durationText = formatDurationText(status, duration);
      return (
        <div className="d-flex justify-content-between">
          <span className="d-flex flex-column font-monospace">{name}</span>
          <small className="fw-light">{durationText}</small>
        </div>
      );
    } else {
      return (
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
  };

  // Render progress bar for progress/suspend jobs
  const renderProgress = () => {
    if (isProgressJob) {
      const { currentEpoch, totalEpoch } = props as ProgressProps;
      return (
        <div className="d-flex justify-content-between">
          <ProgressBar
            now={(currentEpoch / totalEpoch) * 100}
            className="w-100 align-self-center"
          />
          <small className="ms-3 font-monospace">
            {currentEpoch}&nbsp;/&nbsp;{totalEpoch}
          </small>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      style={getCardStyle(isSelected)}
      onClick={handleClick}
      data-testid="child-job-card"
    >
      {renderTitle()}
      {renderProgress()}
    </div>
  );
};

export default ChildJobCard;
