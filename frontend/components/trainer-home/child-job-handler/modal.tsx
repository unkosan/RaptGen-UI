import { useState } from "react";
import { Button, Form, Modal, Spinner } from "react-bootstrap";

export const ApplyViewerModal: React.FC<{
  title: string;
  label: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSubmit: (name: string) => Promise<void>;
}> = ({ title, label, isOpen, setIsOpen, onSubmit }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");

  return (
    <Modal
      show={isOpen}
      onHide={() => {
        setIsOpen(false);
        setName("");
      }}
    >
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>{label}</p>
        <Form.Control
          type="text"
          placeholder="Experiment Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={() => {
            setIsOpen(false);
            setName("");
          }}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={async () => {
            setIsLoading(true);
            await onSubmit(name);
            setIsLoading(false);
            setIsOpen(false);
          }}
          disabled={!name || isLoading}
        >
          {isLoading ? (
            <Spinner animation="border" size="sm" />
          ) : (
            "Add to Viewer Dataset"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
