import { formatDuration, intervalToDuration } from "date-fns";

export const TimeDescription: React.FC<{
  startTimeSecond: number;
  durationTimeSecond: number;
}> = ({ startTimeSecond, durationTimeSecond }) => {
  const startTime = new Date(startTimeSecond * 1000);
  const duration = intervalToDuration({
    start: 0,
    end: durationTimeSecond * 1000,
  });

  return (
    <p>
      <span className="fw-semibold">Start time: </span>
      {startTime.toLocaleString()}
      <br />
      <span className="fw-semibold">Running duration: </span>
      {formatDuration(duration)}
    </p>
  );
};

export default TimeDescription;
