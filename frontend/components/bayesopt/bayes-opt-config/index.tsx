import React from "react";
import { Form } from "react-bootstrap";
import { useBayesOptConfig } from "./hooks/use-bayesopt-config";

/**
 * BayesOptConfig component
 * Renders form controls for configuring Bayesian optimization parameters
 * Uses the useBayesOptConfig hook for all the logic
 */
const BayesOptConfig: React.FC = () => {
  const {
    columns,
    optimizationType,
    targetColumn,
    queryBudget,
    isValidBudget,
    handleChangeColumnName,
    handleChangeBudget,
    handleChangeOptimizationType,
  } = useBayesOptConfig();

  return (
    <>
      <Form.Group className="mb-3">
        <Form.Label>Optimization method</Form.Label>
        <Form.Select
          value={optimizationType}
          onChange={handleChangeOptimizationType}
        >
          <option>qEI (multiple query)</option>
        </Form.Select>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>The name of the value to optimize</Form.Label>
        <Form.Select onChange={handleChangeColumnName} value={targetColumn}>
          {columns.map((column) => (
            <option key={column}>{column}</option>
          ))}
        </Form.Select>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Query budget (The number of proposal values)</Form.Label>
        <Form.Control
          type="number"
          onChange={handleChangeBudget}
          value={queryBudget}
          isInvalid={!isValidBudget}
        />
        <Form.Control.Feedback type="invalid">
          Please enter a positive number.
        </Form.Control.Feedback>
      </Form.Group>
    </>
  );
};

export default BayesOptConfig;
