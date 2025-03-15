import CustomDataGrid, {
  EditorProps,
} from "~/components/common/custom-datagrid";
import { IdEditor, SequenceEditor } from "../editors";
import { ActionProps, EncoderActions } from "../actions";
import { useEncodeTableData } from "../hooks/use-tables";

const EncodeTable: React.FC = () => {
  const { data } = useEncodeTableData();

  const gridStyle = { minHeight: 500, width: "100%", zIndex: 1000 };

  const columns = [
    { name: "key", header: "Key", defaultVisible: false, editable: false },
    {
      name: "id",
      header: "ID",
      renderEditor: (props: EditorProps) => {
        return <IdEditor {...props} />;
      },
    },
    {
      name: "randomRegion",
      header: "Random Region",
      defaultFlex: 1,
      renderEditor: (props: EditorProps) => {
        return <SequenceEditor {...props} />;
      },
    },
    {
      name: "coordX",
      header: "Coord X",
      editable: false,
    },
    {
      name: "coordY",
      header: "Coord Y",
      editable: false,
    },
    {
      name: "actions",
      header: "Actions",
      width: 100,
      editable: false,
      render: (props: ActionProps) => {
        return <EncoderActions {...props} />;
      },
    },
  ];

  return (
    <CustomDataGrid
      idProperty="key"
      className="mb-3"
      columns={columns}
      dataSource={data}
      editable={true}
      rowStyle={{ fontFamily: "monospace" }}
      pagination
      defaultLimit={20}
      rowHeight={35}
      style={gridStyle}
      copiable
      downloadable
    />
  );
};

export default EncodeTable;
