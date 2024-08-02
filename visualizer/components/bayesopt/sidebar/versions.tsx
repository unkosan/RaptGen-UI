import { useEffect, useState } from "react";
import { Button, Form, ListGroup, Modal, Stack } from "react-bootstrap";
import { PlusLg, Pencil, XLg } from "react-bootstrap-icons";
import { z } from "zod";
import { apiClient } from "~/services/api-client";
import { responseGetBayesoptItems } from "~/services/route/bayesopt";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { useDispatch } from "react-redux";

const Versions: React.FC = () => {
  const [list, setList] = useState<z.infer<typeof responseGetBayesoptItems>>(
    []
  );
  const currentUUID = useRouter().query.uuid as string;

  const graphConfig = useSelector((state: RootState) => state.graphConfig);
  const bayesoptConfig = useSelector(
    (state: RootState) => state.bayesoptConfig
  );
  const queriedValues = useSelector((state: RootState) => state.queriedValues);
  const registeredValues = useSelector(
    (state: RootState) => state.registeredValues
  );
  const acquisitionValues = useSelector(
    (state: RootState) => state.acquisitionValues
  );
  const uuid = useRouter().query.uuid as string;
  const isDirty = useSelector((state: RootState) => state.isDirty);

  const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
  const [saveAsTitle, setSaveAsTitle] = useState("");

  const router = useRouter();
  const dispatch = useDispatch();

  // retrieve experiment data
  useEffect(() => {
    (async () => {
      const res = await apiClient.listExperiments();
      setList(res);
    })();
  }, []);

  const getStates = () => {
    // save experiment
    let array = new Array(registeredValues.randomRegion.length).fill([]);
    for (let i = 0; i < array.length; i++) {
      array[i] = new Array(registeredValues.columnNames.length).fill(null);
    }

    for (let i = 0; i < registeredValues.value.length; i++) {
      const seqIndex = registeredValues.sequenceIndex[i];
      const colIndex = registeredValues.columnNames.indexOf(
        registeredValues.column[i]
      );
      array[seqIndex][colIndex] = registeredValues.value[i];
    }

    const obj = {
      experiment_name: "",
      VAE_model: graphConfig.vaeName,
      plot_config: {
        minimum_count: graphConfig.minCount,
        show_training_data: graphConfig.showSelex,
        show_bo_contour: graphConfig.showAcquisition,
      },
      optimization_params: {
        method_name: "qEI" as const,
        target_column_name: bayesoptConfig.targetColumn,
        query_budget: bayesoptConfig.queryBudget,
      },
      distribution_params: {
        xlim_start: -3.5,
        xlim_end: 3.5,
        ylim_start: -3.5,
        ylim_end: 3.5,
      },
      registered_values: {
        ids: registeredValues.id,
        sequences: registeredValues.randomRegion,
        target_column_names: registeredValues.columnNames,
        target_values: array,
      },
      query_data: {
        sequences: queriedValues.randomRegion,
        coords_x_original: queriedValues.coordOriginalX,
        coords_y_original: queriedValues.coordOriginalY,
      },
      acquisition_data: {
        values: acquisitionValues.acquisitionValues,
        coords_x: acquisitionValues.coordX,
        coords_y: acquisitionValues.coordY,
      },
    };

    return obj;
  };

  const onSave = async () => {
    if (!uuid) {
      setIsSaveAsModalOpen(true);
      return;
    }

    const states = getStates();
    await apiClient.updateExperiment(states, {
      params: { uuid },
    });

    dispatch({
      type: "isDirty/set",
      payload: false,
    });
  };

  const onSaveAs = async () => {
    const states = getStates();
    const res = await apiClient.submitExperiment({
      ...states,
      experiment_name: saveAsTitle,
    });
    setIsSaveAsModalOpen(false);
    dispatch({
      type: "isDirty/set",
      payload: false,
    });
    router.push(`?uuid=${res.uuid}`);
  };

  const onNew = async () => {
    if (isDirty) {
      if (!window.confirm("Discard changes?")) return;
    }
    router.push(`?uuid=`);
  };

  return (
    <>
      <legend>Bayes-Opt experiments</legend>
      <div
        style={{
          height: "230px",
          overflowY: "scroll",
          border: "2px solid #e5e5e5",
        }}
      >
        <ListGroup variant="flush">
          {list.map((experiment, i) => (
            <ListGroup.Item
              action
              key={i}
              active={currentUUID === experiment.uuid}
              onClick={() => router.push(`?uuid=${experiment.uuid}`)}
            >
              <Stack direction="horizontal" gap={3}>
                <span className="fs-5 me-2">{experiment.name}</span>
                <span className="fs-6 fw-light ms-auto">
                  last modified:{" "}
                  {new Date(
                    experiment.last_modified * 1000
                  ).toLocaleDateString()}
                </span>
                <Pencil
                  onClick={(e) => {
                    e.stopPropagation();
                    alert("hi");
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.color = "lightgreen";
                  }}
                  onMouseOut={(e) => {
                    if (currentUUID === experiment.uuid) {
                      e.currentTarget.style.color = "white";
                    } else {
                      e.currentTarget.style.color = "black";
                    }
                  }}
                />
                <XLg
                  onClick={(e) => {
                    e.stopPropagation();
                    alert("hi");
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.color = "red";
                  }}
                  onMouseOut={(e) => {
                    if (currentUUID === experiment.uuid) {
                      e.currentTarget.style.color = "white";
                    } else {
                      e.currentTarget.style.color = "black";
                    }
                  }}
                />
              </Stack>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </div>
      <Stack direction="horizontal" className="mt-2" gap={3}>
        <Button variant="outline-primary" onClick={onNew}>
          <PlusLg /> New
        </Button>
        <Button
          variant="outline-primary"
          className="ms-auto"
          onClick={onSave}
          disabled={!isDirty}
        >
          save
        </Button>
        <Button
          variant="outline-primary"
          onClick={() => setIsSaveAsModalOpen(true)}
        >
          save as...
        </Button>
      </Stack>

      <Modal show={isSaveAsModalOpen} backdrop="static">
        <Modal.Header>
          <Modal.Title>Save As</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Please enter the name of the experiment.
          <Form.Group className="mt-3">
            <Form.Control
              type="text"
              placeholder="Experiment name"
              onChange={(e) => setSaveAsTitle(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setSaveAsTitle("");
              setIsSaveAsModalOpen(false);
            }}
          >
            Close
          </Button>
          <Button variant="primary" onClick={onSaveAs} disabled={!saveAsTitle}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Versions;
