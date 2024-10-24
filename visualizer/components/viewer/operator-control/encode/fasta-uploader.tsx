import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { useState } from "react";
import { Form } from "react-bootstrap";
import { apiClient } from "~/services/api-client";
import { setEncoded } from "../../redux/interaction-data";

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
  const encodedData2 = useSelector(
    (state: RootState) => state.interactionData.encoded
  );

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
        session_uuid: sessionId,
        sequences: seqs,
      });

      const firstKey = (encodeData[-1]?.key ?? 0) + 1;

      dispatch({
        type: "encodeData/set",
        payload: encodeData.concat(
          res.coords_x.map((coord, i) => {
            return {
              key: firstKey + i,
              id: ids[i],
              sequence: "",
              randomRegion: seqs[i],
              coordX: coord,
              coordY: res.coords_y[i],
              isSelected: false,
              isShown: true,
              category: "fasta",
              seriesName: file.name,
            };
          })
        ),
      });
      dispatch(
        setEncoded({
          ids: encodedData2.ids.concat(ids),
          randomRegions: encodedData2.randomRegions.concat(seqs),
          coordsX: encodedData2.coordsX.concat(res.coords_x),
          coordsY: encodedData2.coordsY.concat(res.coords_y),
          shown: encodedData2.shown.concat(Array(ids.length).fill(true)),
        })
      );

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
