// this component is a wrapper around the reactdatagrid component that allows for copying of selected cells
// and downloading of all data in the grid
// we use header groups to add buttons to the header that allow for copying and downloading
// additionally, margins are added to the tables to make them nicer

import ReactDataGrid from "@inovua/reactdatagrid-community";
import ClientOnly from "./client-only";
import React, { useEffect } from "react";
import {
  TypeCellSelection,
  TypeColumn,
  TypeDataGridProps,
  TypeDataSource,
} from "@inovua/reactdatagrid-community/types";
import Button from "@inovua/reactdatagrid-community/packages/Button";
import _ from "lodash";
import { Clipboard, Download } from "react-bootstrap-icons";

type CustomDataGridProps = Partial<TypeDataGridProps> & {
  columns: TypeColumn[]; // required
  dataSource: TypeDataSource; //required
  copiable?: boolean;
  downloadable?: boolean;
  copyButtonDisabled?: boolean;
  downloadButtonDisabled?: boolean;
  notDownloadColumns?: string[];
};

const copyToClipboard = (str: string) => {
  const el = document.createElement("textarea");
  el.value = str;
  el.setAttribute("readonly", "");
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
};

const download = (filename: string, text: string) => {
  const element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(text)
  );
  element.setAttribute("download", filename);
  element.style.display = "none";

  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

export const CustomDataGrid: React.FC<CustomDataGridProps> = (props) => {
  const [cells, setCells] = React.useState<TypeCellSelection>({});
  const [canCopy, setCanCopy] = React.useState<boolean>(false); // if no cells are selected, can't copy

  const onCopy = (e: any) => {
    const entries = Object.entries(cells as unknown as [string, boolean]);
    const selected = entries.map((value) => {
      const [row, col] = value[0].split(",");
      return [parseInt(row), col];
    }) as [number, string][];
    const rowNum = _.uniq(selected.map((value) => value[0])).length;
    const mapped = selected.map((value) => {
      return (props.dataSource as any[])[value[0]][value[1]];
    });

    const tsvBody = _.chunk(mapped, mapped.length / rowNum)
      .map((row) => row.join("\t"))
      .join("\n");

    console.log(tsvBody);

    copyToClipboard(tsvBody);
  };

  const onDownload = (e: any) => {
    console.log("download");
    console.log("props.dataSource", props.dataSource);
    const dataSource = props.dataSource as any[];
    const csvHeader = Object.keys(dataSource[0])
      // .filter((key) => !props.notDownloadColumns?.includes(key))
      .join(",");

    const csvBody = dataSource
      .map((row) => Object.values(row).join(","))
      .join("\n");

    const csv = csvHeader + "\n" + csvBody;

    download("data.csv", csv);
  };

  const columns = props.columns?.map((column) => {
    return {
      ...column,
      group: "group",
    } as TypeColumn;
  });
  const group = [
    {
      name: "group",
      header: (
        <>
          {props.copiable && (
            <>
              <Button disabled={props.copyButtonDisabled} onClick={onCopy}>
                <span className="d-flex align-items-center">
                  <Clipboard className="me-2" />
                  Copy selected cells
                </span>
              </Button>
              <span style={{ marginInline: 4 }} />
            </>
          )}
          {props.downloadable && (
            <Button
              disabled={props.downloadButtonDisabled}
              onClick={onDownload}
            >
              <span className="d-flex align-items-center">
                <Download className="me-2" />
                Download All
              </span>
            </Button>
          )}
        </>
      ),
    },
  ];

  useEffect(() => {
    if (Object.keys(cells as {}).length > 0) {
      setCanCopy(true);
    } else {
      setCanCopy(false);
    }
  }, [cells]);

  return (
    <ClientOnly>
      <ReactDataGrid
        {...props}
        style={{ ...props.style }}
        className={props.className}
        columns={columns}
        groups={props.copiable || props.downloadable ? group : undefined}
        cellSelection={cells}
        onCellSelectionChange={setCells}
      />
    </ClientOnly>
  );
};

type EditorProps = {
  value: string;
  onComplete: () => void;
  onCancel: () => void;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  cellProps: any;
};

export default CustomDataGrid;
export type { EditorProps };
