import { Badge, ProgressBar } from "react-bootstrap";
import { formatDuration, intervalToDuration } from "date-fns";
import { useRouter } from "next/router";

type Props = {
  name: string;
  status: "success" | "failure" | "pending" | "progress" | "suspend";
  nCompleted: number;
  nTotal: number;
  duration: number;
  uuid: string;
};

const JobCard: React.FC<Props> = (props) => {
  const router = useRouter();
  const currentUUID = router.query.experiment;
  return (
    <div
      style={{
        width: "100%",
        backgroundColor: props.uuid === currentUUID ? "lightgray" : "#E5E5E5",
        borderRadius: "0.3rem",
        border: true && true === null ? "1px solid gray" : "1px solid #E5E5E5",
        paddingBlock: "0.7rem",
        paddingInline: "1rem",
        cursor: "pointer",
        marginBlock: "1rem",
        boxShadow: "0 0 0.5rem 0.1rem rgba(0, 0, 0, 0.1)",
      }}
      onClick={() => {
        router.push(`?experiment=${props.uuid}`, undefined, {
          scroll: false,
        });
      }}
    >
      <div className="d-flex justify-content-between align-self-center">
        <span className="d-flex flex-column font-monospace">{props.name}</span>
        <div className="d-flex">
          {props.status === "progress" && (
            <small className="fw-light">
              {"Running for" +
                formatDuration(intervalToDuration({ start: 0, end: 1000 }))}
            </small>
          )}
          {props.status === "success" && (
            <Badge pill bg="success" className="align-self-center">
              success
            </Badge>
          )}
          {props.status === "failure" && (
            <Badge pill bg="danger" className="align-self-center">
              failure
            </Badge>
          )}
          {props.status === "pending" && (
            <Badge pill bg="warning" className="align-self-center">
              pending
            </Badge>
          )}
          {props.status === "suspend" && (
            <Badge pill bg="warning" className="align-self-center">
              suspended
            </Badge>
          )}
        </div>
      </div>
      {["progress", "suspend"].includes(props.status) && (
        <div className="d-flex justify-content-between">
          <ProgressBar
            now={(props.nCompleted / props.nTotal) * 100}
            className="w-100 align-self-center"
          />
          <small className="ms-3 font-monospace">
            {props.nCompleted}&nbsp;/&nbsp;{props.nTotal}
          </small>
        </div>
      )}
    </div>
  );
};

export default JobCard;
