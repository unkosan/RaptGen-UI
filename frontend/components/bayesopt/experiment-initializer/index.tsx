import React from "react";
import { useExperimentInitializer } from "./hooks/use-experiment-initializer";

/**
 * ExperimentInitializer component
 * Handles initialization of experiment data from API or creates a new experiment
 * Uses the useExperimentInitializer hook for all the logic
 * Doesn't render anything as loading state is handled at the page level
 */
const ExperimentInitializer: React.FC = () => {
  // Just use the hook for its side effects (initialization)
  useExperimentInitializer();

  // This component doesn't render anything
  return null;
};

export default ExperimentInitializer;
