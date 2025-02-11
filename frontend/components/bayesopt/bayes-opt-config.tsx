import { Form } from "react-bootstrap";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { RootState } from "./redux/store";
import { setIsDirty } from "./redux/is-dirty";
import { setBayesoptConfig } from "./redux/bayesopt-config";

const BayesOptConfig: React.FC = () => {
  const dispatch = useDispatch();
  const columns = useSelector(
    (state: RootState) => state.registeredValues.columnNames
  );
  const bayesoptConfig = useSelector(
    (state: RootState) => state.bayesoptConfig
  );

  const setDirty = () => {
    dispatch(setIsDirty(true));
  };

  const onChangeColumnName = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setDirty();
    dispatch(
      setBayesoptConfig({
        ...bayesoptConfig,
        targetColumn: event.target.value,
      })
    );
  };

  const onChangeBudget = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDirty();
    dispatch(
      setBayesoptConfig({
        ...bayesoptConfig,
        queryBudget: Number(e.target.value),
      })
    );
  };

  return (
    <>
      <Form.Group className="mb-3">
        <Form.Label>Optimization method</Form.Label>
        <Form.Control
          as="select"
          value={bayesoptConfig.optimizationType}
          onChange={() => {}}
        >
          <option>qEI (multiple query)</option>
        </Form.Control>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>The name of the value to optimize</Form.Label>
        <Form.Select
          onChange={onChangeColumnName}
          value={bayesoptConfig.targetColumn}
        >
          {columns.map((column) => (
            <option key={column}>{column}</option>
          ))}
        </Form.Select>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Query budget (The number of proposal values)</Form.Label>
        <Form.Control
          type="number"
          onChange={onChangeBudget}
          value={bayesoptConfig.queryBudget}
        />
      </Form.Group>
    </>
  );
};

export default BayesOptConfig;
