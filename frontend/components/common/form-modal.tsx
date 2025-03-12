import { useEffect, useState } from "react";
import { Button, Form, Modal, Spinner } from "react-bootstrap";

const FormModal: React.FC<{
  defaultName: string;
  title: string;
  label: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSubmit: (newName: string) => Promise<void>;
}> = ({ defaultName, title, label, isOpen, setIsOpen, onSubmit }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [newName, setNewName] = useState(defaultName);

  useEffect(() => {
    if (isOpen) {
      setNewName(defaultName);
    }
  }, [isOpen, defaultName]);

  return (
    <Modal
      show={isOpen}
      onHide={() => {
        setIsOpen(false);
        setNewName(defaultName);
      }}
    >
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>{label}</p>
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
            setIsOpen(false);
            setNewName(defaultName);
          }}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={async () => {
            setIsLoading(true);
            await onSubmit(newName);
            setIsLoading(false);
            setIsOpen(false);
          }}
          disabled={!newName || isLoading}
        >
          {isLoading ? <Spinner animation="border" size="sm" /> : "OK"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default FormModal;
