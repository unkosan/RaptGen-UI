import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { Alert, Button } from "react-bootstrap";
import { Form } from "react-bootstrap";

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

const DownloadDecode: React.FC = () => {
  const decodeData = useSelector(
    (state: RootState) => state.interactionData.decoded
  );
  if (!decodeData.ids.length) {
    return <Alert variant="warning">No decode data</Alert>;
  }

  const onDownload = () => {
    const header = "id,seq,coordX,coordY";
    const body = decodeData.ids
      .map(
        (id, index) =>
          `${id},` +
          `${decodeData.randomRegions[index]},` +
          `${decodeData.coordsX[index]},` +
          `${decodeData.coordsY}`
      )
      .join("\n");
    const csv = header + "\n" + body;
    downloadText(csv, `decoded.csv`);
  };

  return (
    <Form.Group className="mb-3">
      <Button onClick={onDownload}>Download</Button>
    </Form.Group>
  );
};

export default DownloadDecode;
