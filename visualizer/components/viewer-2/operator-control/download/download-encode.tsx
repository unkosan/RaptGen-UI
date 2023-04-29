import { useState } from "react";
import { Alert, Button, Form, InputGroup } from "react-bootstrap";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { uniq } from "lodash";

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
  const [series, setSeries] = useState<string>("");

  const encodeData = useSelector((state: RootState) => state.encodeData);
  if (encodeData.length === 0) {
    return <Alert variant="warning">No encode data</Alert>;
  }
  const seriesList = uniq(encodeData.map((d) => d.seriesName));

  const onDownload = () => {
    const filteredData = encodeData.filter((d) => d.seriesName === series);
    const header = "id,seq,coordX,coordY";
    const body = filteredData
      .map((d) => `${d.id},${d.randomRegion},${d.coordX},${d.coordY}`)
      .join("\n");
    const csv = header + "\n" + body;
    downloadText(csv, `${series}.csv`);
  };

  return (
    <Form.Group className="mb-3">
      <InputGroup>
        <Form.Select id="series" onChange={(e) => setSeries(e.target.value)}>
          <option value="" selected disabled>
            select series
          </option>
          {seriesList.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Form.Select>
        <Button variant="primary" onClick={onDownload} disabled={series === ""}>
          Download
        </Button>
      </InputGroup>
    </Form.Group>
  );
};

export default DownloadEncode;
