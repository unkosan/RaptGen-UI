import { useState } from "react";
import { Badge } from "react-bootstrap";
import ConfirmModal from "~/components/common/confirm-modal";
import FormModal from "~/components/common/form-modal";
import { apiClient } from "~/services/api-client";

export type ActionButtonsProps = {
  uuid: string;
  name: string;
  status: string;
  refreshFunc: () => void;
};

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  uuid,
  name,
  status,
  refreshFunc,
}) => {
  const [isOpenRenameModal, setIsOpenRenameModal] = useState(false);
  const [isOpenDeleteModal, setIsOpenDeleteModal] = useState(false);
  const [isOpenStopModal, setIsOpenStopModal] = useState(false);
  const [isOpenResumeModal, setIsOpenResumeModal] = useState(false);

  const handleRename = async (newName: string) => {
    try {
      await apiClient.patchItem(
        { target: "name", value: newName },
        {
          params: { parent_uuid: uuid },
        }
      );
      await refreshFunc();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async () => {
    try {
      await apiClient.deleteItem(undefined, {
        params: { parent_uuid: uuid },
      });
      await refreshFunc();
    } catch (error) {
      console.error(error);
    }
  };

  const handleStop = async () => {
    try {
      await apiClient.postSuspend({ uuid });
      await refreshFunc();
    } catch (error) {
      console.error(error);
    }
  };

  const handleResume = async () => {
    try {
      await apiClient.postResume({ uuid });
      await refreshFunc();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <p className="d-flex align-items-center">
      <span className="me-2 fw-semibold">Actions: </span>

      {status === "progress" && (
        <Badge
          pill
          bg="primary"
          className="mx-1"
          onClick={() => setIsOpenStopModal(true)}
          style={{ cursor: "pointer" }}
        >
          Stop
        </Badge>
      )}

      {status === "suspend" && (
        <Badge
          pill
          bg="primary"
          className="mx-1"
          onClick={() => setIsOpenResumeModal(true)}
          style={{ cursor: "pointer" }}
        >
          Resume
        </Badge>
      )}

      <Badge
        pill
        bg="danger"
        className="mx-1"
        onClick={() => setIsOpenDeleteModal(true)}
        style={{ cursor: "pointer" }}
      >
        Delete
      </Badge>

      <Badge
        pill
        bg="primary"
        className="mx-1"
        onClick={() => setIsOpenRenameModal(true)}
        style={{ cursor: "pointer" }}
      >
        Rename
      </Badge>

      <FormModal
        defaultName={name}
        title="Rename Experiment"
        label="Enter the new name of the experiment."
        isOpen={isOpenRenameModal}
        setIsOpen={setIsOpenRenameModal}
        onSubmit={handleRename}
      />

      <ConfirmModal
        title="Delete Experiment"
        label="Are you sure you want to delete this experiment?"
        isOpen={isOpenDeleteModal}
        setIsOpen={setIsOpenDeleteModal}
        onSubmit={handleDelete}
        confirmText="Delete"
        variant="danger"
      />

      <ConfirmModal
        title="Stop Experiment"
        label="Are you sure you want to stop this experiment?"
        isOpen={isOpenStopModal}
        setIsOpen={setIsOpenStopModal}
        onSubmit={handleStop}
      />

      <ConfirmModal
        title="Resume Experiment"
        label="Are you sure you want to resume this experiment?"
        isOpen={isOpenResumeModal}
        setIsOpen={setIsOpenResumeModal}
        onSubmit={handleResume}
      />
    </p>
  );
};
