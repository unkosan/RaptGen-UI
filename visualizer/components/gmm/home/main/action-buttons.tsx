import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { Badge, Button, Form, Modal } from "react-bootstrap";
import { apiClient } from "~/services/api-client";

export const RenameButton: React.FC<{
  uuid: string;
  defaultName: string;
  refreshFunc: () => {};
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
          <Modal.Title>Rename Job</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Enter the new name of the job.</p>
          <Form.Control
            type="text"
            placeholder="Entry Name"
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
              await apiClient.updateGMMJobs(
                {
                  target: "name",
                  value: name,
                },
                {
                  params: {
                    uuid: uuid,
                  },
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
        className="align-self-center mx-1"
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

export const DeleteButton: React.FC<{
  uuid: string;
}> = ({ uuid }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Modal show={isModalOpen} onHide={() => setIsModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Job</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this job?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              await apiClient.deleteGMMJobs(undefined, {
                params: {
                  uuid: uuid,
                },
              });
              setIsModalOpen(false);
              router.push("/gmm");
            }}
          >
            OK
          </Button>
        </Modal.Footer>
      </Modal>
      <Badge
        pill
        bg="danger"
        className="align-self-center mx-1"
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

export const StopButton: React.FC<{
  uuid: string;
  refreshFunc: () => {};
}> = ({ uuid, refreshFunc }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Modal show={isModalOpen} onHide={() => setIsModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Stop Job</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to stop this job?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={async () => {
              await apiClient.suspendGMMJobs({ uuid });
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
        className="align-self-center mx-1"
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
  refreshFunc: () => {};
}> = ({ uuid, refreshFunc }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Modal show={isModalOpen} onHide={() => setIsModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Resume Job</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to resume this job?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={async () => {
              await apiClient.resumeGMMJobs({
                uuid: uuid,
              });
              await refreshFunc();
            }}
          >
            OK
          </Button>
        </Modal.Footer>
      </Modal>
      <Badge
        pill
        bg="primary"
        className="align-self-center mx-1"
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

export const ActionButtons: React.FC<{
  uuid: string;
  jobName: string;
  jobStatus: "success" | "failure" | "progress" | "suspend" | "pending";
  refreshFunc: () => {};
}> = ({ uuid, jobName, jobStatus, refreshFunc }) => {
  return (
    <p className="d-flex flex-row">
      <span className="fw-semibold">Actions:</span>
      {jobStatus === "progress" && (
        <StopButton uuid={uuid} refreshFunc={refreshFunc} />
      )}
      {jobStatus === "suspend" && (
        <ResumeButton uuid={uuid} refreshFunc={refreshFunc} />
      )}
      <RenameButton
        uuid={uuid}
        refreshFunc={refreshFunc}
        defaultName={jobName}
      />
      <DeleteButton uuid={uuid} />
    </p>
  );
};
