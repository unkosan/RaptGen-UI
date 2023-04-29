import { useState } from "react";
import { Form } from "react-bootstrap";
import DownloadCluster from "./download-cluster";
import DownloadEncode from "./download-encode";
import DownloadDecode from "./download-decode";

const Download: React.FC = () => {
  return (
    <Form>
      <Form.Group className="mb-3">
        <Form.Label>Download Cluster</Form.Label>
        <DownloadCluster />
        <Form.Label>Download Encoded Coords</Form.Label>
        <DownloadEncode />
        <Form.Label>Download Decoded Sequences</Form.Label>
        <DownloadDecode />
      </Form.Group>
    </Form>
  );
};

export default Download;
