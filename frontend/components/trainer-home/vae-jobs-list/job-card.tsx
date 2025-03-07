import React from "react";
import ChildJobCard from "./child-job-card";
import { Badge, ProgressBar } from "react-bootstrap";
import { useJobCard, SeriesItem } from "./hooks/use-job-card";

type Props = {
  name: string;
  isSelected?: boolean;
  status: "success" | "failure" | "pending" | "progress" | "suspend";
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  onChildClick?: (
    mixture: number,
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => void;
  series: SeriesItem[];
};

/**
 * JobCard component displays information about a job and its child jobs
 */
const JobCard: React.FC<Props> = (props) => {
  const { name, status, series, isSelected } = props;

  const { clickedModel, handleClick, handleChildClick, getCardStyle } =
    useJobCard({
      isSelected,
      onClick: props.onClick,
      onChildClick: props.onChildClick,
    });

  // Render job title with status badge
  const renderTitle = () => {
    if (status === "progress") {
      return (
        <div className="d-flex justify-content-between">
          <span className="d-flex flex-column font-monospace">{name}</span>
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

  // Render content based on series length
  const renderContent = () => {
    if (series.length === 1) {
      const child = series[0];
      if (child.status === "progress" || child.status === "suspend") {
        return (
          <div className="d-flex justify-content-between mt-1">
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
      return null;
    } else {
      return series.map((child) => {
        if (
          isSelected ||
          child.status === "progress" ||
          child.status === "suspend"
        ) {
          if (child.status === "progress" || child.status === "suspend") {
            // For progress/suspend status, we need to cast to the appropriate type
            return (
              <ChildJobCard
                key={child.id}
                name={"Mixture " + child.id}
                status={child.status as "progress" | "suspend"}
                onClick={(event) => handleChildClick(child.id, event)}
                isSelected={isSelected && clickedModel === child.id}
                totalEpoch={child.epochsTotal}
                currentEpoch={child.epochsCurrent}
                duration={child.duration}
              />
            ) as React.ReactElement;
          } else {
            // For other statuses, we don't need the additional props
            return (
              <ChildJobCard
                key={child.id}
                name={"Mixture " + child.id}
                status={child.status}
                onClick={(event) => handleChildClick(child.id, event)}
                isSelected={isSelected && clickedModel === child.id}
              />
            );
          }
        }
        return null;
      });
    }
  };

  return (
    <div style={getCardStyle(isSelected, clickedModel)} onClick={handleClick}>
      {renderTitle()}
      {renderContent()}
    </div>
  );
};

export default JobCard;
