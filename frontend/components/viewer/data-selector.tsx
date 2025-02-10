import { useEffect, useState } from "react";
import { Card, Form, ListGroup, Modal, Stack, Button } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "./redux/store";
import { apiClient } from "~/services/api-client";
import { useRouter } from "next/router";
import { Pencil, XLg } from "react-bootstrap-icons";
import { setSessionConfigByVaeIdName, setGmmId } from "./redux/session-config";

const SelectVAE: React.FC = () => {
  const [id, setId] = useState<string>("");
  const [models, setModels] = useState<
    {
      uuid: string;
      name: string;
    }[]
  >([]);

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { uuid } = router.query;
  const [isRenameModelOpen, setIsRenameModelOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [newName, setNewName] = useState<string>("");

  const reloadModels = async () => {
    const res = await apiClient.getVAEModelNames();
    setModels(res.entries);

    if (res.entries.length > 0) {
      if (
        typeof uuid === "string" &&
        res.entries.some((model) => model.uuid === uuid)
      ) {
        setId(uuid);
      } else {
        setId(res.entries[0].uuid);
      }
    } else {
      setId("");
    }
  };

  // retrieve VAE model names
  useEffect(() => {
    reloadModels();
  }, [uuid]);

  // start session
  useEffect(() => {
    (async () => {
      if (id === "") {
        return;
      }

      const vaeName = models.find((model) => model.uuid === id)?.name;
      dispatch(
        setSessionConfigByVaeIdName({
          vaeId: id,
          vaeName: vaeName,
        })
      );
    })();
  }, [id]);

  return (
    <div
      style={{
        height: "230px",
        overflowY: "scroll",
        border: "2px solid #e5e5e5",
      }}
    >
      <ListGroup variant="flush">
        {models.map((model, index) => (
          <ListGroup.Item
            action
            key={index}
            active={model.uuid === id}
            onClick={(e) => {
              // default behavior of the button is to submit the form
              e.preventDefault();
              router.push(`?uuid=${model.uuid}`, undefined, {
                shallow: true,
              });
            }}
          >
            <Stack direction="horizontal" gap={3}>
              <span className="fs-5 me-2">{model.name}</span>
              <span className="ms-auto"></span>
              <Pencil
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedId(model.uuid);
                  setNewName(model.name);
                  setIsRenameModelOpen(true);
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = "lightgreen";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = "inherit";
                }}
              />
              <XLg
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedId(model.uuid);
                  setIsDeleteModalOpen(true);
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = "red";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = "inherit";
                }}
              />
            </Stack>
          </ListGroup.Item>
        ))}
      </ListGroup>

      <Modal
        show={isRenameModelOpen}
        onHide={() => setIsRenameModelOpen(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Rename VAE model</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Please enter a new name for the VAE model.</p>
          <Form.Control
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setIsRenameModelOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={async () => {
              await apiClient.patchVaeItems(
                {
                  target: "name",
                  value: newName,
                },
                {
                  params: {
                    vae_uuid: selectedId,
                  },
                }
              );
              await reloadModels();
              setIsRenameModelOpen(false);
            }}
            disabled={!newName}
          >
            OK
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={isDeleteModalOpen}
        onHide={() => setIsDeleteModalOpen(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Delete VAE model</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to delete the VAE model{" "}
            <span className="fw-bold">
              {models.find((model) => model.uuid === selectedId)?.name}
            </span>
            ?
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setIsDeleteModalOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              await apiClient.deleteVaeItems(undefined, {
                params: {
                  vae_uuid: selectedId,
                },
              });
              await reloadModels();
              setIsDeleteModalOpen(false);
              if (selectedId === id) {
                router.push(``, undefined, {
                  shallow: true,
                });
              }
            }}
          >
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

const SelectGMM: React.FC = () => {
  const [models, setModels] = useState<
    {
      uuid: string;
      name: string;
    }[]
  >([]);
  const [id, setId] = useState<string>("");

  const dispatch = useDispatch();
  const sessionConfig = useSelector((state: RootState) => state.sessionConfig);

  useEffect(() => {
    (async () => {
      if (!sessionConfig.vaeId) {
        return;
      }

      const res = await apiClient.getGMMModelNames({
        queries: {
          vae_uuid: sessionConfig.vaeId,
        },
      });
      setModels(res.entries);

      if (res.entries.length > 0) {
        setId(res.entries[0].uuid);
        dispatch(setGmmId(res.entries[0].uuid));
      } else {
        setId("");
        dispatch(setGmmId(""));
      }
    })();
  }, [sessionConfig.vaeId]);

  const onChangeGMM = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setId(e.target.value);
    dispatch(setGmmId(e.target.value));
  };

  return (
    <>
      <Form.Select value={id} onChange={onChangeGMM}>
        {models.map((model, index) => (
          <option key={index} value={model.uuid}>
            {model.name}
          </option>
        ))}
      </Form.Select>
    </>
  );
};

const DataSelector: React.FC = () => {
  return (
    <Card className="mb-3">
      <Card.Body>
        <Form.Group className="mb-3">
          <Form.Label>Selected VAE Model</Form.Label>
          <SelectVAE />
        </Form.Group>
        <Form.Group className="">
          <Form.Label>Selected GMM Model</Form.Label>
          <SelectGMM />
        </Form.Group>
      </Card.Body>
    </Card>
  );
};

export default DataSelector;
