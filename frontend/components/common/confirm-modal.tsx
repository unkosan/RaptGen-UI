import { useState } from "react";
import { Button, Modal, Spinner } from "react-bootstrap";

const ConfirmModal: React.FC<{
  title: string;
  label: string | JSX.Element;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSubmit: () => Promise<void>;
  confirmText?: string;
  variant?: "primary" | "danger";
}> = ({
  title,
  label,
  isOpen,
  setIsOpen,
  onSubmit,
  confirmText = "OK",
  variant = "primary",
}) => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Modal
      show={isOpen}
      onHide={() => {
        setIsOpen(false);
      }}
    >
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {typeof label === "string" ? <p>{label}</p> : label}
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={() => {
            setIsOpen(false);
          }}
        >
          Cancel
        </Button>
        <Button
          variant={variant}
          onClick={async () => {
            setIsLoading(true);
            await onSubmit();
            setIsLoading(false);
            setIsOpen(false);
          }}
          disabled={isLoading}
        >
          {isLoading ? <Spinner animation="border" size="sm" /> : confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmModal;
