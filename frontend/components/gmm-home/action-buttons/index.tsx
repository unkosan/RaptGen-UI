import { useState } from "react";
import ConfirmModal from "../../common/confirm-modal";
import FormModal from "../../common/form-modal";
import { Badge } from "react-bootstrap";
import { useActions } from "./hooks/use-actions";

export const ActionButtons: React.FC<{
  uuid: string;
  jobName: string;
  jobStatus: "success" | "failure" | "progress" | "suspend" | "pending";
  refreshFunc: () => void;
}> = ({ uuid, jobName, jobStatus, refreshFunc }) => {
  const [isOpenRenameModal, setIsOpenRenameModal] = useState(false);
  const [isOpenDeleteModal, setIsOpenDeleteModal] = useState(false);
  const [isOpenStopModal, setIsOpenStopModal] = useState(false);
  const [isOpenResumeModal, setIsOpenResumeModal] = useState(false);

  const { handleRename, handleDelete, handleStop, handleResume } = useActions(
    uuid,
    refreshFunc
  );

  return (
    <p className="d-flex flex-row">
      <span className="fw-semibold">Actions:</span>
      {jobStatus === "progress" && (
        <Badge // Stop Button
          pill
          bg="primary"
          className="align-self-center mx-1"
          onClick={() => {
            setIsOpenStopModal(true);
          }}
          style={{ cursor: "pointer" }}
        >
          Stop
        </Badge>
      )}
      {jobStatus === "suspend" && (
        <Badge // Stop Button
          pill
          bg="primary"
          className="align-self-center mx-1"
          onClick={() => {
            setIsOpenResumeModal(true);
          }}
          style={{ cursor: "pointer" }}
        >
          Resume
        </Badge>
      )}
      <Badge // Rename Button
        pill
        bg="primary"
        className="align-self-center mx-1"
        onClick={() => {
          setIsOpenRenameModal(true);
        }}
        style={{ cursor: "pointer" }}
      >
        Rename
      </Badge>
      <Badge // Delete Button
        pill
        bg="danger"
        className="align-self-center mx-1"
        onClick={() => {
          setIsOpenDeleteModal(true);
        }}
        style={{ cursor: "pointer" }}
      >
        Delete
      </Badge>
      <>
        <FormModal
          defaultName={jobName}
          title="Rename Job"
          label="Enter the new name of the job."
          isOpen={isOpenRenameModal}
          setIsOpen={setIsOpenRenameModal}
          onSubmit={handleRename}
        />
        <ConfirmModal
          title="Delete Job"
          label="Are you sure you want to delete this job?"
          isOpen={isOpenDeleteModal}
          setIsOpen={setIsOpenDeleteModal}
          onSubmit={handleDelete}
          confirmText="Delete"
          variant="danger"
        />
        <ConfirmModal
          title="Stop Job"
          label="Are you sure you want to stop this job?"
          isOpen={isOpenStopModal}
          setIsOpen={setIsOpenStopModal}
          onSubmit={handleStop}
        />
        <ConfirmModal
          title="Resume Job"
          label="Are you sure you want to resume this job?"
          isOpen={isOpenResumeModal}
          setIsOpen={setIsOpenResumeModal}
          onSubmit={handleResume}
        />
      </>
    </p>
  );
};
