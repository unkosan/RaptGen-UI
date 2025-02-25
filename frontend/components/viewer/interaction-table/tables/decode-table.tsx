import CustomDataGrid, {
  EditorProps,
} from "~/components/common/custom-datagrid";
import { CoordXEditor, CoordYEditor } from "../editors";
import { ActionProps, DecoderActions } from "../actions";
import { useDecodeTableData } from "../hooks/hooks";

const DecodeTable: React.FC = () => {
  const { data } = useDecodeTableData();

  const gridStyle = { minHeight: 500, width: "100%", zIndex: 1000 };

  const columns = [
    { name: "key", header: "Key", defaultVisible: false, editable: false },
    { name: "id", header: "ID", editable: false },
    {
      name: "randomRegion",
      header: "Random Region",
      defaultFlex: 1,
      editable: false,
    },
    {
      name: "coordX",
      header: "Coord X",
      editable: true,
      renderEditor: (props: EditorProps) => <CoordXEditor {...props} />,
    },
    {
      name: "coordY",
      header: "Coord Y",
      editable: true,
      renderEditor: (props: EditorProps) => <CoordYEditor {...props} />,
    },
    {
      name: "actions",
      header: "Actions",
      width: 100,
      editable: false,
      render: (props: ActionProps) => <DecoderActions {...props} />,
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

export default DecodeTable;
