import { formatDuration, intervalToDuration } from "date-fns";
import { JobStatus } from "./use-job-card";

export interface UseChildJobCardProps {
  status: JobStatus;
  duration?: number;
  isSelected?: boolean;
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}

export interface UseChildJobCardReturn {
  formatDurationText: (status: JobStatus, duration?: number) => string;
  handleClick: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  getCardStyle: (isSelected?: boolean) => React.CSSProperties;
}

/**
 * Custom hook for managing ChildJobCard state and interactions
 */
export function useChildJobCard({
  status,
  duration,
  isSelected,
  onClick,
}: UseChildJobCardProps): UseChildJobCardReturn {
  /**
   * Format duration text based on status and duration
   */
  const formatDurationText = (status: JobStatus, duration?: number): string => {
    if (status !== "progress" || !duration) {
      return "";
    }

    const durationObj = intervalToDuration({
      start: 0,
      end: duration,
    });

    return `Running for ${formatDuration(durationObj)}`;
  };

  /**
   * Handle click event
   */
  const handleClick = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    if (event !== undefined && onClick !== undefined) {
      onClick(event);
    } else {
      console.log("event or onClick is undefined");
    }
  };

  /**
   * Get card style based on selection state
   */
  const getCardStyle = (isSelected?: boolean): React.CSSProperties => {
    return {
      width: "100%",
      backgroundColor: isSelected ? "#f0f0f0" : "#f5f5f5",
      borderRadius: "0.3rem",
      border: isSelected ? "1px solid gray" : "1px solid lightgray",
      boxShadow: "0 0 0.5rem 0.1rem rgba(0, 0, 0, 0.1)",
      paddingBlock: "0.5rem",
      paddingInline: "1rem",
      marginTop: "0.4rem",
      cursor: "pointer",
    };
  };

  return {
    formatDurationText,
    handleClick,
    getCardStyle,
  };
}
