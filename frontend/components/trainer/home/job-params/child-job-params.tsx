import { z } from "zod";
import { responseGetItemChild } from "~/services/route/train";
import { formatDuration, intervalToDuration } from "date-fns";

type ChildItem = z.infer<typeof responseGetItemChild>;

export const ChildJobParams: React.FC<{
  item: ChildItem;
}> = ({ item }) => {
  const net_duration =
    item.status === "progress"
      ? Date.now() - (item.datetime_start - item.duration_suspend) * 1000
      : item.status === "pending"
      ? 0
      : (item.datetime_laststop - item.datetime_start - item.duration_suspend) *
        1000;
  const suspend_duration =
    item.status === "suspend"
      ? Date.now() + (item.duration_suspend - item.datetime_laststop) * 1000
      : item.duration_suspend * 1000;

  return (
    <p>
      {/* <span className="fw-semibold">Status: </span>
      <JobStatusToLabel status={item.status} />
      <br /> */}
      <span className="fw-semibold">Duration for training: </span>
      {formatDuration(intervalToDuration({ start: 0, end: net_duration }))}
      {suspend_duration ? (
        <>
          {" "}
          (Suspended for{" "}
          {formatDuration(
            intervalToDuration({
              start: 0,
              end: suspend_duration,
            })
          )}
          )
        </>
      ) : null}
    </p>
  );
};
