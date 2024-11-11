import { useEffect, useState } from "react";
import { Badge, Button, Form, Modal } from "react-bootstrap";
import { apiClient } from "~/services/api-client";

export const StopButton: React.FC<{
  uuid: string;
  updateFunc: (parentId: string | undefined) => Promise<void>;
}> = ({ uuid, updateFunc }) => {
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
            variant="warning"
            onClick={async () => {
              await apiClient.postSuspend({ uuid });
              await updateFunc(uuid);
              setIsModalOpen(false);
            }}
          >
            Stop
          </Button>
        </Modal.Footer>
      </Modal>
      <Badge
        pill
        bg="warning"
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
  updateFunc: (parentId: string | undefined) => Promise<void>;
}> = ({ uuid, updateFunc }) => {
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
            variant="success"
            onClick={async () => {
              await apiClient.postResume({ uuid });
              await updateFunc(uuid);
              setIsModalOpen(false);
            }}
          >
            Resume
          </Button>
        </Modal.Footer>
      </Modal>
      <Badge
        pill
        bg="success"
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
  updateFunc: (parentId: string | undefined) => Promise<void>;
}> = ({ uuid, updateFunc }) => {
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
              await updateFunc(uuid);
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
  updateFunc: (parentId: string | undefined) => Promise<void>;
}> = ({ uuid, defaultName, updateFunc }) => {
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
            variant="success"
            onClick={async () => {
              await apiClient.patchItem(
                { target: "name", value: name },
                {
                  params: { parent_uuid: uuid },
                }
              );
              await updateFunc(uuid);
              setIsModalOpen(false);
            }}
          >
            Rename
          </Button>
        </Modal.Footer>
      </Modal>
      <Badge
        pill
        bg="success"
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

// download latent points to csv file
type LatentDataType = {
  randomRegions: string[];
  coordsX: number[];
  coordsY: number[];
  duplicates: number[];
};
export const DownloadCurrentCodesButton: React.FC<LatentDataType> = (props) => {
  return (
    <Badge
      pill
      bg="success"
      className="mx-1"
      onClick={() => {
        const csvHeader = "random_region, x, y, duplicate";
        let csvData = "";
        for (let i = 0; i < props.randomRegions.length; i++) {
          csvData +=
            props.randomRegions[i] +
            "," +
            props.coordsX[i] +
            "," +
            props.coordsY[i] +
            "," +
            props.duplicates[i] +
            "\n";
        }
        // download csv file
        const blob = new Blob([csvHeader + "\n" + csvData], {
          type: "text/csv",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.setAttribute("hidden", "");
        a.setAttribute("href", url);
        a.setAttribute("download", "latent_points.csv");
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }}
      style={{ cursor: "pointer" }}
    >
      Download Latent Codes
    </Badge>
  );
};

// download losses transition to csv file
type LossesDataType = {
  trainLoss: number[];
  testLoss: number[];
  testReconLoss: number[];
  testKldLoss: number[];
};
export const DownloadLossesButton: React.FC<LossesDataType> = (props) => {
  return (
    <Badge
      pill
      bg="success"
      className="mx-1"
      onClick={() => {
        const csvHeader = "epoch, train_loss, test_loss, test_recon, test_kld";
        let csvData = "";
        for (let i = 0; i < props.trainLoss.length; i++) {
          csvData +=
            i +
            "," +
            props.trainLoss[i] +
            "," +
            props.testLoss[i] +
            "," +
            props.testReconLoss[i] +
            "," +
            props.testKldLoss[i] +
            "\n";
        }
        // download csv file
        const blob = new Blob([csvHeader + "\n" + csvData], {
          type: "text/csv",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.setAttribute("hidden", "");
        a.setAttribute("href", url);
        a.setAttribute("download", "losses.csv");
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }}
      style={{ cursor: "pointer" }}
    >
      Download Loss Transtions
    </Badge>
  );
};

export const ApplyViewerButton: React.FC<{
  uuid: string;
  childId?: number;
  disabled: boolean;
  setDisabled: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ uuid, childId, disabled, setDisabled }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");

  return (
    <>
      <Modal show={isModalOpen} onHide={() => setIsModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Apply to Viewer Dataset</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Enter the name of the experiment to apply to the viewer dataset.
          </p>
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
            onClick={() => {
              apiClient.postPublish({ uuid, multi: childId, name });
              setDisabled(!disabled);
              setIsModalOpen(false);
            }}
            disabled={name === ""}
          >
            Add to Viewer Dataset
          </Button>
        </Modal.Footer>
      </Modal>
      <Button
        variant="primary"
        onClick={() => setIsModalOpen(true)}
        disabled={disabled}
      >
        {disabled ? "Added" : "Add to Viewer Dataset"}
      </Button>
    </>
  );
};
