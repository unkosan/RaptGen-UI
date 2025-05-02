import React from "react";
import { Badge, ProgressBar } from "react-bootstrap";
import { useJobCard, JobStatus } from "./hooks/use-job-card";

type Props = {
  name: string;
  status: JobStatus;
  nCompleted: number;
  nTotal: number;
  duration: number;
  uuid: string;
};

/**
 * JobCard component displays information about a GMM job
 */
const JobCard: React.FC<Props> = (props) => {
  const { name, status, nCompleted, nTotal, duration, uuid } = props;

  const {
    currentUUID,
    handleClick,
    getCardStyle,
    formatDurationText,
    isProgressOrSuspend,
  } = useJobCard({
    uuid,
  });

  /**
   * Render job title with status badge or duration
   */
  const renderTitle = () => {
    return (
      <div className="d-flex justify-content-between align-self-center">
        <span className="d-flex flex-column font-monospace">{name}</span>
        <div className="d-flex">
          {status === "progress" && (
            <small className="fw-light">
              {formatDurationText(status, duration)}
            </small>
          )}
          {status === "success" && (
            <Badge pill bg="success" className="align-self-center">
              success
            </Badge>
          )}
          {status === "failure" && (
            <Badge pill bg="danger" className="align-self-center">
              failure
            </Badge>
          )}
          {status === "pending" && (
            <Badge pill bg="warning" className="align-self-center">
              pending
            </Badge>
          )}
          {status === "suspend" && (
            <Badge pill bg="warning" className="align-self-center">
              suspended
            </Badge>
          )}
        </div>
      </div>
    );
  };

  /**
   * Render progress bar for progress/suspend jobs
   */
  const renderProgress = () => {
    if (isProgressOrSuspend(status)) {
      return (
        <div className="d-flex justify-content-between">
          <ProgressBar
            now={(nCompleted / nTotal) * 100}
            className="w-100 align-self-center"
          />
          <small className="ms-3 font-monospace">
            {nCompleted}&nbsp;/&nbsp;{nTotal}
          </small>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={getCardStyle(uuid === currentUUID)} onClick={handleClick}>
      {renderTitle()}
      {renderProgress()}
    </div>
  );
};

export default JobCard;
