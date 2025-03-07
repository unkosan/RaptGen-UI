import { z } from "zod";
import { responseGetItem } from "~/services/route/train";
import { JobStatusToLabel } from "~/components/common/status-to-label";

export type SummaryType = z.infer<typeof responseGetItem>["summary"];

export type CellProps = {
  data: {
    id: number;
    status: string;
    total_epochs: number;
    nlls: number;
  };
};

export const useSummary = (value: SummaryType) => {
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

  const { indices, statuses, epochs_finished, minimum_NLLs } = value;

  const dataSource = indices.map((idx, i) => ({
    id: idx,
    status: statuses[i],
    total_epochs: epochs_finished[i],
    nlls: minimum_NLLs[i],
  }));

  const gridStyle = {
    minHeight: 300,
    width: "100%",
    zIndex: 1000,
  };

  return {
    columns,
    dataSource,
    gridStyle,
  };
};
