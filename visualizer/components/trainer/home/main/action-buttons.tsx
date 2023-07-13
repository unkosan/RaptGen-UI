import { Badge, Button } from "react-bootstrap";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

import { apiClient } from "../../../../services/api-client";
import { useState } from "react";

export const StopButton: React.FC<{ uuid: string }> = ({ uuid }) => {
  return (
    <Badge
      pill
      bg="warning"
      className="mx-1"
      onClick={() => {
        apiClient.postSuspend({ uuid });
      }}
      style={{ cursor: "pointer" }}
    >
      Stop
    </Badge>
  );
};

export const ResumeButton: React.FC<{ uuid: string }> = ({ uuid }) => {
  return (
    <Badge
      pill
      bg="success"
      className="mx-1"
      onClick={() => {
        apiClient.postResume({ uuid });
      }}
      style={{ cursor: "pointer" }}
    >
      Resume
    </Badge>
  );
};

export const DeleteButton: React.FC<{ uuid: string }> = ({ uuid }) => {
  return (
    <Badge
      pill
      bg="danger"
      className="mx-1"
      onClick={() => {
        apiClient.deleteItem(undefined, { params: { parent_uuid: uuid } });
      }}
      style={{ cursor: "pointer" }}
    >
      Delete
    </Badge>
  );
};

export const KillButton: React.FC<{ uuid: string }> = ({ uuid }) => {
  return (
    <Badge
      pill
      bg="danger"
      className="mx-1"
      onClick={() => {
        apiClient.postKill({ uuid });
      }}
      style={{ cursor: "pointer" }}
    >
      Kill
    </Badge>
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
}> = ({ uuid, childId }) => {
  const [pushed, setPushed] = useState(false);
  return (
    <div className="d-grid gap-2">
      <Button
        variant="primary"
        className="mx-1"
        onClick={() => {
          apiClient.postPublish({ uuid, multi: childId });
          setPushed(true);
        }}
        disabled={pushed}
      >
        {pushed ? "Added" : "Add to Viewer Dataset"}
      </Button>
    </div>
  );
};
