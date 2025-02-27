import { Eye, EyeSlash, Trash } from "react-bootstrap-icons";
import {
  actionButtonStyles,
  useDecoderActions,
  useEncoderActions,
} from "./hooks/use-actions";

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

export const DecoderActions: React.FC<ActionProps> = (props) => {
  const { data } = props;
  const index = data.key; // key is index
  const { onClickShow, onClickDelete } = useDecoderActions(index);

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
  const { onClickShow, onClickDelete } = useEncoderActions(index);

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
