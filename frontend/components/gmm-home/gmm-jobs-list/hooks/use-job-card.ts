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
  duration: number;
}

export interface UseJobCardReturn {
  currentUUID: string | string[] | undefined;
  handleClick: () => void;
  getCardStyle: (isSelected: boolean) => React.CSSProperties;
  formatJobDuration: (duration: number) => string;
  isProgressOrSuspend: (status: JobStatus) => boolean;
}

/**
 * Custom hook for managing JobCard state and interactions
 */
export function useJobCard({
  uuid,
  duration,
}: UseJobCardProps): UseJobCardReturn {
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
  const formatJobDuration = (duration: number): string => {
    return (
      "Running for " +
      formatDuration(intervalToDuration({ start: 0, end: duration * 1000 }))
    );
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
    formatJobDuration,
    isProgressOrSuspend,
  };
}
