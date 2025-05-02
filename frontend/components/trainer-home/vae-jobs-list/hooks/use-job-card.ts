import { useState } from "react";

export type JobStatus =
  | "success"
  | "failure"
  | "pending"
  | "progress"
  | "suspend";

export type SeriesItem = {
  id: number;
  duration: number;
  status: JobStatus;
  epochsTotal: number;
  epochsCurrent: number;
};

export interface UseJobCardProps {
  isSelected?: boolean;
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  onChildClick?: (
    mixture: number,
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => void;
}

export interface UseJobCardReturn {
  clickedModel: number | null;
  setClickedModel: (id: number | null) => void;
  handleClick: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  handleChildClick: (
    childId: number,
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => void;
  getCardStyle: (
    isSelected: boolean | undefined,
    clickedModel: number | null
  ) => React.CSSProperties;
}

/**
 * Custom hook for managing JobCard state and interactions
 */
export function useJobCard({
  isSelected,
  onClick,
  onChildClick,
}: UseJobCardProps): UseJobCardReturn {
  const [clickedModel, setClickedModel] = useState<number | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    if (onClick) {
      setClickedModel(null);
      onClick(event);
    }
  };

  const handleChildClick = (
    childId: number,
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    if (onChildClick) {
      onChildClick(childId, event);
    }
    setClickedModel(childId);
    event.stopPropagation();
  };

  const getCardStyle = (
    isSelected: boolean | undefined,
    clickedModel: number | null
  ): React.CSSProperties => {
    return {
      width: "100%",
      backgroundColor: isSelected ? "lightgray" : "#E5E5E5",
      borderRadius: "0.3rem",
      border:
        isSelected && clickedModel === null
          ? "1px solid gray"
          : "1px solid #E5E5E5",
      paddingBlock: "0.7rem",
      paddingInline: "1rem",
      cursor: "pointer",
      marginBlock: "1rem",
      boxShadow: "0 0 0.5rem 0.1rem rgba(0, 0, 0, 0.1)",
    };
  };

  return {
    clickedModel,
    setClickedModel,
    handleClick,
    handleChildClick,
    getCardStyle,
  };
}
