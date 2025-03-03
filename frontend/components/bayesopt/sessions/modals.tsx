import { useState, useEffect } from "react";
import { Button, Form, Modal, Spinner } from "react-bootstrap";

/**
 * SaveAsModal component
 * Modal for saving an experiment with a new name
 */
export const SaveAsModal: React.FC<{
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSubmit: (title: string) => Promise<void>;
  isLoading: boolean;
}> = ({ isOpen, setIsOpen, onSubmit, isLoading }) => {
  const [title, setTitle] = useState("");

  return (
    <Modal
      show={isOpen}
      backdrop="static"
      onHide={() => {
        setTitle("");
        setIsOpen(false);
      }}
    >
      <Modal.Header closeButton>
        <Modal.Title>Save As</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Please enter the name of the experiment.</p>
        <Form.Group className="mt-3">
          <Form.Control
            type="text"
            placeholder="Experiment name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={() => {
            setTitle("");
            setIsOpen(false);
          }}
        >
          Close
        </Button>
        <Button
          variant="primary"
          onClick={async () => {
            await onSubmit(title);
            setTitle("");
          }}
          disabled={!title || isLoading}
        >
          {isLoading ? <Spinner animation="border" size="sm" /> : "Save"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

/**
 * RenameModal component
 * Modal for renaming an experiment
 */
export const RenameModal: React.FC<{
  defaultName: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSubmit: (newName: string) => Promise<void>;
  isLoading: boolean;
}> = ({ defaultName, isOpen, setIsOpen, onSubmit, isLoading }) => {
  const [newName, setNewName] = useState(defaultName);

  // Reset the name when the modal opens
  useEffect(() => {
    if (isOpen) {
      setNewName(defaultName);
    }
  }, [isOpen, defaultName]);

  return (
    <Modal
      show={isOpen}
      backdrop="static"
      onHide={() => {
        setNewName("");
        setIsOpen(false);
      }}
    >
      <Modal.Header closeButton>
        <Modal.Title>Rename</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Please enter the new name of the experiment.</p>
        <Form.Group className="mt-3">
          <Form.Control
            type="text"
            placeholder="Experiment name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={() => {
            setNewName("");
            setIsOpen(false);
          }}
        >
          Close
        </Button>
        <Button
          variant="primary"
          onClick={async () => {
            await onSubmit(newName);
            setNewName("");
          }}
          disabled={!newName || isLoading}
        >
          {isLoading ? <Spinner animation="border" size="sm" /> : "OK"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

/**
 * DeleteModal component
 * Modal for confirming experiment deletion
 */
export const DeleteModal: React.FC<{
  experimentName: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSubmit: () => Promise<void>;
  isLoading: boolean;
}> = ({ experimentName, isOpen, setIsOpen, onSubmit, isLoading }) => {
  return (
    <Modal show={isOpen} backdrop="static" onHide={() => setIsOpen(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Delete</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Are you sure you want to delete the experiment{" "}
        <span className="fw-bold">{experimentName}</span>?
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setIsOpen(false)}>
          Close
        </Button>
        <Button
          variant="danger"
          onClick={async () => {
            await onSubmit();
          }}
          disabled={isLoading}
        >
          {isLoading ? <Spinner animation="border" size="sm" /> : "Delete"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
