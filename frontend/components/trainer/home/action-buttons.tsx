import { useEffect, useState } from "react";
import { Badge, Button, Form, Modal } from "react-bootstrap";
import { apiClient } from "~/services/api-client";

export const StopButton: React.FC<{
  uuid: string;
  refreshFunc: () => void;
}> = ({ uuid, refreshFunc }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Modal show={isModalOpen} onHide={() => setIsModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Stop Experiment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to stop this experiment?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={async () => {
              await apiClient.postSuspend({ uuid });
              await refreshFunc();
              setIsModalOpen(false);
            }}
          >
            OK
          </Button>
        </Modal.Footer>
      </Modal>
      <Badge
        pill
        bg="primary"
        className="mx-1"
        onClick={() => {
          setIsModalOpen(true);
        }}
        style={{ cursor: "pointer" }}
      >
        Stop
      </Badge>
    </>
  );
};

export const ResumeButton: React.FC<{
  uuid: string;
  refreshFunc: () => void;
}> = ({ uuid, refreshFunc }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Modal show={isModalOpen} onHide={() => setIsModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Resume Experiment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to resume this experiment?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={async () => {
              await apiClient.postResume({ uuid });
              await refreshFunc();
              setIsModalOpen(false);
            }}
          >
            OK
          </Button>
        </Modal.Footer>
      </Modal>
      <Badge
        pill
        bg="primary"
        className="mx-1"
        onClick={() => {
          setIsModalOpen(true);
        }}
        style={{ cursor: "pointer" }}
      >
        Resume
      </Badge>
    </>
  );
};

export const DeleteButton: React.FC<{
  uuid: string;
  refreshFunc: () => void;
}> = ({ uuid, refreshFunc }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Modal show={isModalOpen} onHide={() => setIsModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Experiment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this experiment?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              await apiClient.deleteItem(undefined, {
                params: { parent_uuid: uuid },
              });
              await refreshFunc();
              setIsModalOpen(false);
            }}
          >
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
      <Badge
        pill
        bg="danger"
        className="mx-1"
        onClick={() => {
          setIsModalOpen(true);
        }}
        style={{ cursor: "pointer" }}
      >
        Delete
      </Badge>
    </>
  );
};

export const RenameButton: React.FC<{
  uuid: string;
  defaultName: string;
  refreshFunc: () => void;
}> = ({ uuid, defaultName, refreshFunc }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState(defaultName);

  useEffect(() => {
    setName(defaultName);
  }, [defaultName]);

  return (
    <>
      <Modal show={isModalOpen} onHide={() => setIsModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Rename Experiment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Enter the new name of the experiment.</p>
          <Form.Control
            type="text"
            placeholder="Experiment Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={async () => {
              await apiClient.patchItem(
                { target: "name", value: name },
                {
                  params: { parent_uuid: uuid },
                }
              );
              await refreshFunc();
              setIsModalOpen(false);
            }}
          >
            OK
          </Button>
        </Modal.Footer>
      </Modal>
      <Badge
        pill
        bg="primary"
        className="mx-1"
        onClick={() => {
          setIsModalOpen(true);
        }}
        style={{ cursor: "pointer" }}
      >
        Rename
      </Badge>
    </>
  );
};

export const ActionButtons: React.FC<{
  uuid: string;
  name: string;
  status: string;
  refreshFunc: () => void;
}> = ({ uuid, name, status, refreshFunc }) => {
  switch (status) {
    case "suspend":
      return (
        <p className="d-flex align-items-center">
          <span className="me-2 fw-semibold">Actions: </span>
          <ResumeButton uuid={uuid} refreshFunc={refreshFunc} />
          <DeleteButton uuid={uuid} refreshFunc={refreshFunc} />
          <RenameButton
            uuid={uuid}
            defaultName={name}
            refreshFunc={refreshFunc}
          />
        </p>
      );
    case "progress":
      return (
        <p className="d-flex align-items-center">
          <span className="me-2 fw-semibold">Actions: </span>
          <StopButton uuid={uuid} refreshFunc={refreshFunc} />
          <DeleteButton uuid={uuid} refreshFunc={refreshFunc} />
          <RenameButton
            uuid={uuid}
            defaultName={name}
            refreshFunc={refreshFunc}
          />
        </p>
      );
    default:
      return (
        <p className="d-flex align-items-center">
          <span className="me-2 fw-semibold">Actions: </span>
          <DeleteButton uuid={uuid} refreshFunc={refreshFunc} />
          <RenameButton
            uuid={uuid}
            defaultName={name}
            refreshFunc={refreshFunc}
          />
        </p>
      );
  }
};
