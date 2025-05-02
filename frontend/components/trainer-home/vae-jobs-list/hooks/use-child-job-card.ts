import { intervalToDuration } from "date-fns";
import { JobStatus } from "./use-job-card";

export interface UseChildJobCardProps {
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

    // Convert days to hours and add to existing hours
    const totalHours = (durationObj.days || 0) * 24 + (durationObj.hours || 0);

    // Create abbreviated format: "xxh xxm xxs"
    const parts: string[] = [];

    if (totalHours > 0) {
      parts.push(`${totalHours}h`);
    }

    if (durationObj.minutes) {
      parts.push(`${durationObj.minutes}m`);
    }

    if (durationObj.seconds) {
      parts.push(`${durationObj.seconds}s`);
    }

    const str = parts.join(" ");

    return `Running for ${str}`;
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
