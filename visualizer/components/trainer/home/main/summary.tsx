import { z } from "zod";
import { responseGetItem } from "~/services/route/train";
import Button from "@inovua/reactdatagrid-community/packages/Button";
import { CustomDataGrid } from "~/components/common/custom-datagrid";
import { useRouter } from "next/router";
import { Badge } from "react-bootstrap";

type SummaryType = z.infer<typeof responseGetItem>["summary"];

// type hint for the props of the cell renderer
// this is not well-defined yet, but sufficient for now
type CellProps = {
  data: {
    id: number;
    status: string;
    total_epochs: number;
    nlls: number;
  };
};

const columns = [
  { name: "id", type: "number", header: "ID", width: 60 },
  {
    name: "status",
    header: "Status",
    width: 90,
    render: (props: CellProps) => {
      switch (props.data.status) {
        case "success":
          return (
            <center>
              <Badge pill bg="success">
                {props.data.status}
              </Badge>
            </center>
          );
        case "progress":
          return (
            <center>
              <Badge pill bg="primary">
                {props.data.status}
              </Badge>
            </center>
          );
        case "failure":
          return (
            <center>
              <Badge pill bg="danger">
                {props.data.status}
              </Badge>
            </center>
          );
        default:
          return (
            <center>
              <Badge pill bg="warning">
                {props.data.status}
              </Badge>
            </center>
          );
      }
    },
  },
  { name: "total_epochs", header: "Total Epochs", defaultFlex: 1 },
  { name: "nlls", header: "log ELBO", defaultFlex: 1 },
];

export const Summary: React.FC<{
  value: SummaryType;
}> = (props) => {
  const { indices, statuses, epochs_finished, minimum_NLLs } = props.value;

  const data = indices.map((idx, i) => ({
    id: idx,
    status: statuses[i],
    total_epochs: epochs_finished[i],
    nlls: minimum_NLLs[i],
  }));

  return (
    <CustomDataGrid
      idProperty="id"
      columns={columns}
      dataSource={data}
      rowStyle={{ fontFamily: "monospace" }}
      defaultLimit={20}
      rowHeight={35}
      style={{ minHeight: 300, width: "100%", zIndex: 1000 }}
      downloadable
      copiable
    />
  );
};
