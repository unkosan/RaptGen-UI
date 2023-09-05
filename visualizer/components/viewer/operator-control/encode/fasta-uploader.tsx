import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { useState } from "react";
import { ResponseEncode } from "../../../../types/api-interface/session";
import { Form } from "react-bootstrap";
import { apiClient } from "../../../../services/api-client";

const parser = (text: string) => {
  const regex = /^>\s*(\S+)[\n\r]+([ACGTUacgtu\n\r]+)$/gm;
  let ids: string[] = [];
  let seqs: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text))) {
    ids.push(match[1]);
    seqs.push(
      match[2]
        .replace(/[\n\r]/g, "")
        .toUpperCase()
        .replace(/T/g, "U")
    );
  }

  return { ids, seqs };
};

const FastaUploader: React.FC = () => {
  const dispatch = useDispatch();
  const sessionId = useSelector(
    (state: RootState) => state.sessionConfig.sessionId
  );

  const encodeData = useSelector((state: RootState) => state.encodeData);

  // const [feedback, setFeedback] = useState<string>("");
  const [isValid, setIsValid] = useState<boolean>(true);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const { ids, seqs } = parser(text);
      if (ids.length === 0 || seqs.length === 0) {
        setIsValid(false);
        return;
      }

      const res = await apiClient.encode({
        session_id: sessionId,
        sequences: seqs,
      });

      if (res.status === "error") {
        return;
      }

      const coords = res.data;
      const firstKey = (encodeData[-1]?.key ?? 0) + 1;
      console.log(coords);

      dispatch({
        type: "encodeData/set",
        payload: encodeData.concat(
          coords.map((coord, i) => {
            return {
              key: firstKey + i,
              id: ids[i],
              sequence: "",
              randomRegion: seqs[i],
              coordX: coord.coord_x,
              coordY: coord.coord_y,
              isSelected: false,
              isShown: true,
              category: "fasta",
              seriesName: file.name,
            };
          })
        ),
      }),
        setIsValid(true);
    };
    reader.readAsText(file);
  };

  return (
    <Form.Group className="mb-3">
      <Form.Control type="file" onChange={handleFile} isInvalid={!isValid} />
      <Form.Control.Feedback type="invalid">
        Invalid FASTA file
      </Form.Control.Feedback>
    </Form.Group>
  );
};

export default FastaUploader;
