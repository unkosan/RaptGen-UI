import { z } from "zod";
import { responseGetItem } from "../../../../services/route/train";
import Button from "@inovua/reactdatagrid-community/packages/Button";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { CustomDataGrid } from "../../../common/custom-datagrid";

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

const DetailButton: React.FC<CellProps> = (props) => {
  const dispatch = useDispatch();
  const pageConfig = useSelector((state: RootState) => state.pageConfig);

  return (
    <Button
      onClick={() => {
        dispatch({
          type: "pageConfig/set",
          payload: {
            ...pageConfig,
            childId: props.data.id,
          },
        });
      }}
    >
      Go Detail
    </Button>
  );
};

const columns = [
  { name: "id", type: "number", header: "ID" },
  { name: "status", header: "Status" },
  { name: "total_epochs", header: "Total Epochs" },
  { name: "nlls", header: "Minimum negative log ELBO", defaultFlex: 1 },
  {
    name: "buttons",
    header: "",
    render: (props: CellProps) => {
      return <DetailButton data={props.data} />;
    },
  },
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
      pagination
      defaultLimit={20}
      rowHeight={35}
      style={{ minHeight: 250, width: "100%", zIndex: 1000 }}
      downloadable
      copiable
    />
  );
};
