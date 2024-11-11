import { Alert, Button, Form } from "react-bootstrap";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";

const downloadText = (text: string, filename: string) => {
  const link = document.createElement("a");
  link.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(text)
  );
  link.setAttribute("download", filename);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const DownloadEncode: React.FC = () => {
  const encodeData = useSelector(
    (state: RootState) => state.interactionData.encoded
  );
  if (!encodeData.ids.length) {
    return <Alert variant="warning">No encode data</Alert>;
  }
  const onDownload = () => {
    const header = "id,seq,coordX,coordY";
    const body = encodeData.ids
      .map(
        (id, index) =>
          `${id},` +
          `${encodeData.randomRegions[index]},` +
          `${encodeData.coordsX[index]},` +
          `${encodeData.coordsY}`
      )
      .join("\n");
    const csv = header + "\n" + body;
    downloadText(csv, `encode.csv`);
  };

  return (
    <Form.Group className="mb-3">
      <Button onClick={onDownload}>Download</Button>
    </Form.Group>
  );
};

export default DownloadEncode;
