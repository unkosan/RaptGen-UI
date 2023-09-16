import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import CustomDataGrid from "~/components/common/custom-datagrid";
import useProcessRawReads from "~/hooks/useProcessRawReads";
import workerpool from "workerpool";
import { TypeDataSource } from "@inovua/reactdatagrid-community/types";
import { useDispatch } from "react-redux";
import { Button } from "react-bootstrap";
const pool = workerpool.pool();

const columnsCountTable = [
  { name: "id", type: "number", header: "ID", defaultVisible: false },
  { name: "item", header: "Item", defaultFlex: 1 },
  { name: "duplicate", header: "Duplicate", type: "number" },
];

const columnsSequenceTable = [
  { name: "id", type: "number", label: "ID", defaultVisible: false },
  { name: "sequence", header: "Random Region Sequence", defaultFlex: 1 },
  { name: "duplicate", header: "Duplicate", type: "number" },
];

const gridStyleCountTable = {
  minHeight: 200,
  width: "100%",
  zIndex: 1000,
  marginBlock: "1rem",
};

const gridStyleSequenceTable = {
  minHeight: 500,
  width: "100%",
  zIndex: 1000,
  marginBlock: "1rem",
};

type Props = {
  setRoute: React.Dispatch<
    React.SetStateAction<"/preprocess-config" | "/train-config">
  >;
};

const TrainConfigRight: React.FC<Props> = (props) => {
  const [summaryDataSource, setSummaryDataSource] = useState<TypeDataSource>(
    []
  );
  const [sequenceDataSource, setSequenceDataSource] = useState<TypeDataSource>(
    []
  );

  const selexData = useSelector((state: RootState) => state.selexData);
  const preprocessingConfig = useSelector(
    (state: RootState) => state.preprocessingConfig
  );

  const dispatch = useDispatch();

  const { setRawReads, cancelProcessing, isProcessing, processResult } =
    useProcessRawReads(pool);

  useEffect(() => {
    if (isProcessing) {
      return;
    }
    console.log(processResult);

    const {
      summary: { numTotal, numFiltered, numUnique, uniqueRatio },
      data: { seqs, dups, randomRegions },
    } = processResult;

    setSummaryDataSource([
      { id: 0, item: "Total Entry Count", duplicate: numTotal },
      {
        id: 1,
        item: "Uniquified Entry Count",
        duplicate: numFiltered,
      },
      { id: 2, item: "Adapters Matched", duplicate: numUnique },
      {
        id: 3,
        item: "Unique Ratio",
        duplicate: uniqueRatio,
      },
    ]);

    setSequenceDataSource([
      ...randomRegions.map((seq, index) => {
        return {
          id: index,
          sequence: seq,
          duplicate: dups[index],
        };
      }),
    ]);
  }, [isProcessing]);

  useEffect(() => {
    const {
      isDirty,
      isValidParams,
      forwardAdapter,
      reverseAdapter,
      targetLength,
      tolerance,
      minCount,
    } = preprocessingConfig;
    const { sequences } = selexData;

    // pass through if isDirty changed from true to false
    if (isDirty || !isValidParams) {
      return;
    }

    setRawReads(
      sequences,
      minCount,
      tolerance,
      targetLength,
      forwardAdapter,
      reverseAdapter
    );
  }, [selexData, preprocessingConfig]);

  return (
    <div id="train-config-right">
      <CustomDataGrid
        idProperty="id"
        columns={columnsCountTable}
        dataSource={summaryDataSource}
        style={gridStyleCountTable}
        rowStyle={{
          fontFamily: "monospace",
        }}
        loading={isProcessing}
      />
      <CustomDataGrid
        idProperty="id"
        columns={columnsSequenceTable}
        dataSource={sequenceDataSource}
        style={gridStyleSequenceTable}
        rowStyle={{
          fontFamily: "monospace",
        }}
        loading={isProcessing}
        copiable
        downloadable
      />
      <div className="d-flex justify-content-between my-3">
        <Button
          onClick={() => {
            props.setRoute("/preprocess-config");
          }}
          variant="primary"
        >
          Back
        </Button>
        <Button type="submit" form="train-config-form">
          Submit
        </Button>
      </div>
    </div>
  );
};

export default TrainConfigRight;
