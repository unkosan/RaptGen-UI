import { Button, Form } from "react-bootstrap";
import useParseFastx from "~/hooks/useParseFastx";
import workerpool from "workerpool";
const pool = workerpool.pool();

import { countBy } from "lodash";
import { useEffect, useState } from "react";
import { TypeDataSource } from "@inovua/reactdatagrid-community/types";
import CustomDataGrid from "~/components/common/custom-datagrid";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

const columns = [
  { name: "id", type: "number", header: "ID", defaultVisible: false },
  { name: "sequence", header: "Sequence", defaultFlex: 1 },
  { name: "duplicate", header: "Duplicate", type: "number" },
];
const gridStyle = { minHeight: 500, width: "100%", zIndex: 1000 };

const PreprocessConfigRight: React.FC = () => {
  const [dataSource, setDataSource] = useState<TypeDataSource>([]);

  const dispatch = useDispatch();
  const selexData = useSelector((state: RootState) => state.selexData);
  const preprocessingConfig = useSelector(
    (state: RootState) => state.preprocessingConfig
  );

  const { setFastx, cancelParsing, isParsing, isValid, parseResult } =
    useParseFastx(pool);

  useEffect(() => {
    if (!isValid || isParsing) {
      return;
    }
    const count = countBy(parseResult, "seq");
    const seqs = Object.keys(count);
    const freqs = Object.values(count);

    let dataSource = [];
    for (let i = 0; i < seqs.length; i++) {
      dataSource.push({
        id: i,
        sequence: seqs[i],
        duplicate: freqs[i],
      });
    }
    setDataSource(dataSource);

    dispatch({
      type: "selexData/set",
      payload: {
        ...selexData,
        sequences: seqs,
        duplicates: freqs,
      },
    });
  }, [isParsing]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file !== undefined) {
      setFastx(file);
    } else {
      cancelParsing();
    }
    dispatch({
      type: "preprocessingConfig/set",
      payload: {
        ...preprocessingConfig,
        isDirty: true,
      },
    });
  };

  return (
    <div id="preprocess-config-right">
      <legend>Fastx file</legend>
      <Form.Group className="mb-3">
        <Form.Control
          type="file"
          onChange={handleFileChange}
          isInvalid={!isValid && parseResult.length !== 0}
        />
      </Form.Group>
      <CustomDataGrid
        idProperty="id"
        columns={columns}
        dataSource={dataSource}
        style={gridStyle}
        rowStyle={{
          fontFamily: "monospace",
        }}
        loading={isParsing}
        copiable
        downloadable
      />
      <div className="d-flex justify-content-between">
        <Button href="/trainer" variant="primary">
          Back
        </Button>
        <Button type="submit" form="preprocess-config-form" variant="primary">
          Next
        </Button>
      </div>
    </div>
  );
};

export default PreprocessConfigRight;
