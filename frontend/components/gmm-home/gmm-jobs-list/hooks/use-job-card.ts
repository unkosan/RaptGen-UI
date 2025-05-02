import { useRouter } from "next/router";
import { formatDuration, intervalToDuration } from "date-fns";

export type JobStatus =
  | "success"
  | "failure"
  | "pending"
  | "progress"
  | "suspend";

export interface UseJobCardProps {
  uuid: string;
}

export interface UseJobCardReturn {
  currentUUID: string | string[] | undefined;
  handleClick: () => void;
  getCardStyle: (isSelected: boolean) => React.CSSProperties;
  formatDurationText: (status: JobStatus, duration?: number) => string;
  isProgressOrSuspend: (status: JobStatus) => boolean;
}

/**
 * Custom hook for managing JobCard state and interactions
 */
export function useJobCard({ uuid }: UseJobCardProps): UseJobCardReturn {
  const router = useRouter();
  const currentUUID = router.query.experiment;

  /**
   * Handle click event to navigate to the job details
   */
  const handleClick = () => {
    router.push(`?experiment=${uuid}`, undefined, {
      scroll: false,
    });
  };

  /**
   * Get card style based on selection state
   */
  const getCardStyle = (isSelected: boolean): React.CSSProperties => {
    return {
      width: "100%",
      backgroundColor: isSelected ? "lightgray" : "#E5E5E5",
      borderRadius: "0.3rem",
      border: "1px solid #E5E5E5",
      paddingBlock: "0.7rem",
      paddingInline: "1rem",
      cursor: "pointer",
      marginBlock: "1rem",
      boxShadow: "0 0 0.5rem 0.1rem rgba(0, 0, 0, 0.1)",
    };
  };

  /**
   * Format duration text
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
   * Check if job status is progress or suspend
   */
  const isProgressOrSuspend = (status: JobStatus): boolean => {
    return ["progress", "suspend"].includes(status);
  };

  return {
    currentUUID,
    handleClick,
    getCardStyle,
    formatDurationText,
    isProgressOrSuspend,
  };
}
