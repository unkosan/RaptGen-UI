import ReactDataGrid from "@inovua/reactdatagrid-community";
import ClientOnly from "./client-only";
import React, { useEffect } from "react";
import {
  TypeCellSelection,
  TypeColumn,
  TypeColumnGroup,
  TypeDataGridProps,
  TypeDataSource,
} from "@inovua/reactdatagrid-community/types";
import Button from "@inovua/reactdatagrid-community/packages/Button";

// extend TypeDataGridProps to allow for addtional props specifing the data not to be downloaded
type Props = TypeDataGridProps & {
  dataToNotDownload: string[] | undefined;
};

const CopiableDataGrid: React.FC<Partial<Props>> = (props) => {
  const [cellSelection, setCellSelection] = React.useState<TypeCellSelection>(
    {}
  );
  const [canCopy, setCanCopy] = React.useState<boolean>(false);
  const [canDownload, setCanDownload] = React.useState<boolean>(false);

  const columns = props.columns?.map((column) => {
    return {
      ...column,
      group: "group",
    };
  }) as TypeColumn[];

  const group = [
    {
      name: "group",
      header: (
        <>
          <Button disabled={!canCopy} onClick={() => console.log(props)}>
            Copy selected cells
          </Button>
          <span style={{ marginInline: 4 }} />
          <Button disabled={!canDownload} onClick={() => console.log(props)}>
            Download All
          </Button>
        </>
      ),
    },
  ] as TypeColumnGroup[];

  useEffect(() => {
    if (Object.keys(cellSelection as {}).length > 0) {
      setCanCopy(true);
    } else {
      setCanCopy(false);
    }
  }, [cellSelection]);

  useEffect(() => {
    if ((props.dataSource as any[]).length > 0) {
      setCanDownload(true);
    } else {
      setCanDownload(false);
    }
  }, [props.dataSource]);

  const onCopy = () => {
    console.log("copy");
  };

  const onDownload = () => {
    console.log("download");
  };

  return (
    <ClientOnly>
      <ReactDataGrid
        {...props}
        dataSource={props.dataSource as TypeDataSource}
        columns={columns}
        groups={group}
        cellSelection={cellSelection}
        onCellSelectionChange={setCellSelection}
      />
    </ClientOnly>
  );
};

export default CopiableDataGrid;
