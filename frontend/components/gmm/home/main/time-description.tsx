import { formatDuration, intervalToDuration } from "date-fns";

export const TimeDescription: React.FC<{
  startTimeSecond: number;
  durationTimeSecond: number;
}> = ({ startTimeSecond, durationTimeSecond }) => {
  return (
    <p>
      <span className="fw-semibold">Start time: </span>
      {new Date(startTimeSecond * 1000).toLocaleString()}
      <br />
      <span className="fw-semibold">Running duration: </span>
      {formatDuration(
        intervalToDuration({ start: 0, end: durationTimeSecond * 1000 })
      )}
    </p>
  );
};

export default TimeDescription;
