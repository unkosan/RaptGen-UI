import { Badge, Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import { useSelector } from "react-redux";
import CustomDataGrid from "~/components/common/custom-datagrid";
import { RootState } from "./redux/store";
import React, { useCallback } from "react";
import { cloneDeep } from "lodash";
import { useDispatch } from "react-redux";
import { TypeOnSelectionChangeArg } from "@inovua/reactdatagrid-community/types/TypeDataGridProps";
import { QueriedValues } from "./redux/queried-values";

const gridStyle = { minHeight: 400, width: "100%", zIndex: 950 };

export const QueryTable: React.FC = () => {
  const dispatch = useDispatch();
  const queryData = useSelector((state: RootState) => state.queriedValues);

  const dataSource = queryData.randomRegion.map((value, index) => {
    return {
      id: index,
      randomRegion: value,
      coordX: queryData.coordX[index],
      coordY: queryData.coordY[index],
      originalCoordX: queryData.coordOriginalX[index],
      originalCoordY: queryData.coordOriginalY[index],
    };
  });

  const onSelectionChange = useCallback(
    (e: TypeOnSelectionChangeArg) => {
      let newData = cloneDeep(queryData);
      if (e.selected === true) {
        newData.wholeSelected = true;
        const unselected =
          e.unselected === null
            ? []
            : Object.keys(e.unselected as Object).map((value) =>
                parseInt(value)
              );
        newData.staged = newData.staged.map((value, index) => {
          return !unselected.includes(index);
        });
      } else {
        newData.wholeSelected = false;
        const selected = Object.keys(e.selected as Object).map((value) =>
          parseInt(value)
        );
        newData.staged = newData.staged.map((value, index) => {
          return selected.includes(index);
        });
      }

      dispatch({
        type: "queriedValues/set",
        payload: newData,
      });
      dispatch({
        type: "isDirty/set",
        payload: true,
      });
    },
    [queryData]
  );

  return (
    <>
      <CustomDataGrid
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
                      <div style={{ textAlign: "left" }}>
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
                      <div style={{ textAlign: "left" }}>
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
        defaultSelected={queryData.staged.map((value, index) => {
          return value ? index : -1;
        })}
        onSelectionChange={onSelectionChange}
        checkboxOnlyRowSelect
      />
      <AddQueryButton />
    </>
  );
};

const AddQueryButton: React.FC = () => {
  const dispatch = useDispatch();
  const registeredData = useSelector(
    (state: RootState) => state.registeredValues
  );
  const queryData = useSelector((state: RootState) => state.queriedValues);

  const onClick = () => {
    console.log("Add to the Register values table");
    console.log(queryData);

    let newRegisteredData = cloneDeep(registeredData);
    let newQueryData: QueriedValues = {
      wholeSelected: queryData.wholeSelected,
      randomRegion: [],
      coordX: [],
      coordY: [],
      coordOriginalX: [],
      coordOriginalY: [],
      staged: [],
    };

    let currIndex = Math.max(...newRegisteredData.sequenceIndex);

    for (let i = 0; i < queryData.staged.length; i++) {
      if (queryData.staged[i] === true) {
        currIndex += 1;
        newRegisteredData.id.push("untitled -- " + currIndex.toString());
        newRegisteredData.randomRegion.push(queryData.randomRegion[i]);
        newRegisteredData.coordX.push(queryData.coordX[i]);
        newRegisteredData.coordY.push(queryData.coordY[i]);
        if (registeredData.wholeSelected) {
          newRegisteredData.staged.push(true);
        } else {
          newRegisteredData.staged.push(false);
        }
        for (let j = 0; j < registeredData.columnNames.length; j++) {
          newRegisteredData.sequenceIndex.push(currIndex);
          newRegisteredData.column.push(registeredData.columnNames[j]);
          newRegisteredData.value.push(null);
        }
      } else {
        newQueryData.randomRegion.push(queryData.randomRegion[i]);
        newQueryData.coordX.push(queryData.coordX[i]);
        newQueryData.coordY.push(queryData.coordY[i]);
        newQueryData.coordOriginalX.push(queryData.coordOriginalX[i]);
        newQueryData.coordOriginalY.push(queryData.coordOriginalY[i]);
        if (queryData.wholeSelected) {
          newQueryData.staged.push(true);
        } else {
          newQueryData.staged.push(false);
        }
      }
    }

    dispatch({
      type: "registeredValues/set",
      payload: newRegisteredData,
    });
    dispatch({
      type: "queriedValues/set",
      payload: newQueryData,
    });
    dispatch({
      type: "isDirty/set",
      payload: true,
    });
  };

  return (
    <Button variant="primary" onClick={onClick} style={{ marginBottom: 10 }}>
      Add to the Register values table
    </Button>
  );
};
