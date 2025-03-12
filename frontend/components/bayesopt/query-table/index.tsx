import React from "react";
import {
  Badge,
  Button,
  OverlayTrigger,
  Spinner,
  Tooltip,
} from "react-bootstrap";
import CustomDataGrid from "~/components/common/custom-datagrid";
import { useQueryTable } from "./hooks/use-query-table";
import { useAddQueryButton } from "./hooks/use-add-query-button";

type Props = {
  setActiveTab: React.Dispatch<
    React.SetStateAction<"registered-table" | "query-table">
  >;
};

const QueryTable: React.FC<Props> = ({ setActiveTab }) => {
  // Table logic
  const { dataSource, onSelectionChange, selectedIndices } = useQueryTable();

  // Button logic
  const { onClick, isLoading } = useAddQueryButton();

  const gridStyle = { minHeight: 400, width: "100%", zIndex: 950 };

  return (
    <>
      <CustomDataGrid
        className="mb-2"
        columns={[
          { name: "id", header: "ID", defaultVisible: false },
          { name: "randomRegion", header: "Random Region", defaultFlex: 1 },
          { name: "coordX", header: "X" },
          { name: "coordY", header: "Y" },
          {
            name: "originalCoordX",
            header: () => (
              <>
                Original X
                <OverlayTrigger
                  overlay={
                    <Tooltip>
                      <div className="text-start">
                        <span className="font-monospace">Original X</span>
                        means the raw value of the X coordinate returned by the
                        Bayesian optimization. This value is reembedded through
                        the decoder and encoder of the VAE model to keep the
                        consistency of the latent space.
                      </div>
                    </Tooltip>
                  }
                >
                  <span className="ms-1">
                    <Badge pill bg="secondary">
                      ?
                    </Badge>
                  </span>
                </OverlayTrigger>
              </>
            ),
            defaultVisible: false,
          },
          {
            name: "originalCoordY",
            header: () => (
              <>
                Original Y
                <OverlayTrigger
                  overlay={
                    <Tooltip>
                      <div className="text-start">
                        <span className="font-monospace">Original Y</span>
                        means the raw value of the Y coordinate returned by the
                        Bayesian optimization. This value is reembedded through
                        the decoder and encoder of the VAE model to keep the
                        consistency of the latent space.
                      </div>
                    </Tooltip>
                  }
                >
                  <span className="ms-1">
                    <Badge pill bg="secondary">
                      ?
                    </Badge>
                  </span>
                </OverlayTrigger>
              </>
            ),
            defaultVisible: false,
          },
        ]}
        dataSource={dataSource}
        style={gridStyle}
        rowStyle={{ fontFamily: "monospace" }}
        checkboxColumn
        pagination
        downloadable
        copiable
        defaultSelected={selectedIndices}
        onSelectionChange={onSelectionChange}
        checkboxOnlyRowSelect
      />

      <Button
        variant="primary"
        onClick={() => {
          onClick();
          setActiveTab("registered-table");
        }}
        className="mb-3"
        disabled={isLoading}
      >
        {isLoading ? (
          <Spinner animation="border" size="sm" />
        ) : (
          "Add to the Register values table"
        )}
      </Button>
    </>
  );
};

export default QueryTable;
