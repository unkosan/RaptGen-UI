import { useState } from "react";
import { apiClient } from "~/services/api-client";
import { useRouter } from "next/router";
import { ConfirmModal } from "./confirm-modal";
import { RenameModal } from "./rename-modal";
import { Badge } from "react-bootstrap";

export const ActionButtons: React.FC<{
  uuid: string;
  jobName: string;
  jobStatus: "success" | "failure" | "progress" | "suspend" | "pending";
  refreshFunc: () => void;
}> = ({ uuid, jobName, jobStatus, refreshFunc }) => {
  const { push } = useRouter();

  const [isOpenRenameModal, setIsOpenRenameModal] = useState(false);
  const [isOpenDeleteModal, setIsOpenDeleteModal] = useState(false);
  const [isOpenStopModal, setIsOpenStopModal] = useState(false);
  const [isOpenResumeModal, setIsOpenResumeModal] = useState(false);

  const handleRename = async (newName: string) => {
    try {
      await apiClient.updateGMMJobs(
        {
          target: "name",
          value: newName,
        },
        {
          params: {
            uuid: uuid,
          },
        }
      );
      await refreshFunc();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async () => {
    try {
      await apiClient.deleteGMMJobs(undefined, {
        params: {
          uuid: uuid,
        },
      });
    } catch (error) {
      console.error(error);
    }
    push("/gmm");
  };

  const handleStop = async () => {
    try {
      await apiClient.suspendGMMJobs({ uuid });
      await refreshFunc();
    } catch (error) {
      console.error(error);
    }
  };

  const handleResume = async () => {
    try {
      await apiClient.resumeGMMJobs({
        uuid: uuid,
      });
      await refreshFunc();
    } catch (error) {
      console.error(error);
    }
  };

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
        <RenameModal
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
