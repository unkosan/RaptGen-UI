import { Form } from "react-bootstrap";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { RootState } from "../redux/store";

const BayesOptConfig: React.FC = () => {
  const dispatch = useDispatch();
  const columns = useSelector(
    (state: RootState) => state.registeredValues.columnNames
  );
  const bayesoptConfig = useSelector(
    (state: RootState) => state.bayesoptConfig
  );

  const onChangeColumnName = (event: React.ChangeEvent<HTMLSelectElement>) => {
    console.log(event.target.value);
    dispatch({
      type: "bayesoptConfig/set",
      payload: {
        ...bayesoptConfig,
        targetColumn: event.target.value,
      },
    });
  };

  const onChangeBudget = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: "bayesoptConfig/set",
      payload: {
        ...bayesoptConfig,
        queryBudget: Number(e.target.value),
      },
    });
  };

  return (
    <>
      <legend>Bayes-Opt Configuration</legend>
      <Form.Group className="mb-3">
        <Form.Label>Optimization method</Form.Label>
        <Form.Control
          as="select"
          defaultValue={bayesoptConfig.optimizationType}
        >
          <option>qEI (multiple query)</option>
        </Form.Control>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>The name of the value to optimize</Form.Label>
        <Form.Select
          onChange={onChangeColumnName}
          defaultValue={bayesoptConfig.targetColumn}
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
          defaultValue={bayesoptConfig.queryBudget}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Switch label="show contour plot" />
      </Form.Group>
    </>
  );
};

export default BayesOptConfig;
