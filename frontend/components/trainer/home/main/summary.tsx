import { z } from "zod";
import { responseGetItem } from "~/services/route/train";
import { CustomDataGrid } from "~/components/common/custom-datagrid";
import { JobStatusToLabel } from "~/components/common/status-to-label";

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
      return (
        <center>
          <JobStatusToLabel status={props.data.status} />
        </center>
      );
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
      className="mb-3"
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
