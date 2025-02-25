import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { RootState } from "../redux/store";
import { setDecoded, setEncoded } from "../redux/interaction-data";
import { Eye, EyeSlash, Trash } from "react-bootstrap-icons";

export interface ActionProps {
  data: {
    key: number;
    id: string;
    coordX: string;
    coordY: string;
    randomRegion: string;
    isShown: boolean;
  };
}

const actionButtonStyles = {
  shown: {
    cursor: "pointer",
    borderRadius: 4,
    height: "24px",
    width: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#e8e8e8",
    background: "#7986cb",
    border: "2px solid #7986cb",
    marginInline: "0.2rem",
  },
  notShown: {
    cursor: "pointer",
    borderRadius: 4,
    height: "24px",
    width: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid #7986cb",
    marginInline: "0.2rem",
  },
  delete: {
    cursor: "pointer",
    borderRadius: 4,
    height: "24px",
    width: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    background: "#ff6347",
    border: "2px solid #ff6347",
    marginInline: "0.2rem",
  },
};

export const DecoderActions: React.FC<ActionProps> = (props) => {
  const { data } = props;
  const index = data.key; // key is index
  const dispatch = useDispatch();
  const decodeData = useSelector(
    (state: RootState) => state.interactionData.decoded
  );

  const onClickShow = async () => {
    const newShown = decodeData.shown.map((e, i) => (i === index ? !e : e));
    dispatch(
      setDecoded({
        ...decodeData,
        shown: newShown,
      })
    );
  };

  const onClickDelete = async () => {
    dispatch(
      setDecoded({
        ids: decodeData.ids.filter((_, i) => i !== index),
        coordsX: decodeData.coordsX.filter((_, i) => i !== index),
        coordsY: decodeData.coordsY.filter((_, i) => i !== index),
        randomRegions: decodeData.randomRegions.filter((_, i) => i !== index),
        shown: decodeData.shown.filter((_, i) => i !== index),
      })
    );
  };

  return (
    <div className="d-flex">
      <span
        style={
          data.isShown ? actionButtonStyles.shown : actionButtonStyles.notShown
        }
        onClick={onClickShow}
      >
        {data.isShown ? <Eye size={16} /> : <EyeSlash size={16} />}
      </span>
      <span style={actionButtonStyles.delete} onClick={onClickDelete}>
        <Trash size={16} />
      </span>
    </div>
  );
};

export const EncoderActions: React.FC<ActionProps> = (props) => {
  const { data } = props;
  const index = data.key; // key is index
  const dispatch = useDispatch();
  const encodeData = useSelector(
    (state: RootState) => state.interactionData.encoded
  );

  const onClickShow = async () => {
    const newShown = encodeData.shown.map((e, i) => (i === index ? !e : e));
    dispatch(
      setEncoded({
        ...encodeData,
        shown: newShown,
      })
    );
  };

  const onClickDelete = async () => {
    dispatch(
      setEncoded({
        ids: encodeData.ids.filter((_, i) => i !== index),
        coordsX: encodeData.coordsX.filter((_, i) => i !== index),
        coordsY: encodeData.coordsY.filter((_, i) => i !== index),
        randomRegions: encodeData.randomRegions.filter((_, i) => i !== index),
        shown: encodeData.shown.filter((_, i) => i !== index),
      })
    );
  };

  return (
    <div className="d-flex">
      <span
        style={
          data.isShown ? actionButtonStyles.shown : actionButtonStyles.notShown
        }
        onClick={onClickShow}
      >
        {data.isShown ? <Eye size={16} /> : <EyeSlash size={16} />}
      </span>
      <span style={actionButtonStyles.delete} onClick={onClickDelete}>
        <Trash size={16} />
      </span>
    </div>
  );
};
