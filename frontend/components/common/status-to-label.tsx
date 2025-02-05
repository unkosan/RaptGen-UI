import { Badge } from "react-bootstrap";

export const JobStatusToLabel: React.FC<{
  // status: "success" | "progress" | "failure" | "pending" | "suspend";
  status: string;
}> = ({ status }) => {
  switch (status) {
    case "success":
      return (
        <Badge pill bg="success">
          {status}
        </Badge>
      );
    case "progress":
      return (
        <Badge pill bg="primary">
          {status}
        </Badge>
      );
    case "failure":
      return (
        <Badge pill bg="danger">
          {status}
        </Badge>
      );
    default:
      return (
        <Badge pill bg="warning">
          {status}
        </Badge>
      );
  }
};
