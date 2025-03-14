import { Check2, X } from "react-bootstrap-icons";
import { EditorProps } from "~/components/common/custom-datagrid";
import {
  editorStyles,
  EDITOR_CLASS_NAME,
  useCoordXEditor,
  useCoordYEditor,
  useIdEditor,
  useSequenceEditor,
} from "./hooks/use-editors";

const Editor: React.FC<{
  value: string;
  isInvalid: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onConfirmClick: () => Promise<void>;
  onCancel: () => void;
}> = (props) => {
  return (
    <div
      style={
        {
          ...editorStyles.base,
          ...(props.isInvalid ? editorStyles.invalid : {}),
        } as React.CSSProperties
      }
      className={EDITOR_CLASS_NAME}
    >
      <input
        value={props.value}
        onChange={props.onChange}
        style={editorStyles.input}
      />
      <Check2
        size={18}
        style={{
          cursor: !props.isInvalid ? "pointer" : "not-allowed",
          marginInline: "0.2rem",
          color: !props.isInvalid ? "grey" : "lightgrey",
        }}
        onClick={!props.isInvalid ? props.onConfirmClick : undefined}
      />
      <X
        size={20}
        style={{ cursor: "pointer", marginInline: "0.2rem", color: "grey" }}
        onClick={props.onCancel}
      />
    </div>
  );
};

export const CoordXEditor: React.FC<EditorProps> = (props) => {
  const { valueX, valid, handleChange, handleConfirmClick, handleCancel } =
    useCoordXEditor(props.cellProps, props.onComplete, props.onCancel);

  return (
    <Editor
      value={valueX}
      isInvalid={!valid}
      onChange={handleChange}
      onConfirmClick={handleConfirmClick}
      onCancel={handleCancel}
    />
  );
};

export const CoordYEditor: React.FC<EditorProps> = (props) => {
  const { valueY, valid, handleChange, handleConfirmClick, handleCancel } =
    useCoordYEditor(props.cellProps, props.onComplete, props.onCancel);

  return (
    <Editor
      value={valueY}
      isInvalid={!valid}
      onChange={handleChange}
      onConfirmClick={handleConfirmClick}
      onCancel={handleCancel}
    />
  );
};

export const IdEditor: React.FC<EditorProps> = (props) => {
  const { value, valid, handleChange, handleConfirmClick, handleCancel } =
    useIdEditor(props.cellProps, props.value, props.onComplete, props.onCancel);

  return (
    <Editor
      value={value}
      isInvalid={!valid}
      onChange={handleChange}
      onConfirmClick={handleConfirmClick}
      onCancel={handleCancel}
    />
  );
};

export const SequenceEditor: React.FC<EditorProps> = (props) => {
  const { value, valid, handleChange, handleConfirmClick, handleCancel } =
    useSequenceEditor(
      props.cellProps,
      props.value,
      props.onComplete,
      props.onCancel
    );

  return (
    <Editor
      value={value}
      isInvalid={!valid}
      onChange={handleChange}
      onConfirmClick={handleConfirmClick}
      onCancel={handleCancel}
    />
  );
};
