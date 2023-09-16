import { useEffect, useState } from "react";
import { Button, Spinner } from "react-bootstrap";
import { apiClient } from "~/services/api-client";

type ButtonProps<T> = {
  sequences: string[];
  targetLength: number;
  onCalcFinish: (estimatedValue: T) => void;
};

const EstimateForwardButton: React.FC<ButtonProps<string>> = (props) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleEstimate = () => setIsLoading(true);

  useEffect(() => {
    if (isLoading) {
      (async () => {
        if (isNaN(props.targetLength)) {
          return;
        }
        const res = await apiClient.estimateAdapters({
          target_length: props.targetLength,
          sequences: props.sequences,
        });

        if (res.status === "success") {
          const value = res.data.forward_adapter;
          props.onCalcFinish(value);
        }
      })().then(() => {
        setIsLoading(false);
      });
    }
  }, [isLoading]);

  return (
    <Button
      variant="outline-secondary"
      onClick={handleEstimate}
      disabled={
        isLoading || isNaN(props.targetLength) || props.sequences.length === 0
      }
    >
      {isLoading ? (
        <>
          <Spinner animation="border" size="sm" />
          {" Estimating..."}
        </>
      ) : (
        "Estimate"
      )}
    </Button>
  );
};

const EstimateReverseButton: React.FC<ButtonProps<string>> = (props) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleEstimate = () => setIsLoading(true);

  useEffect(() => {
    if (isLoading) {
      (async () => {
        if (isNaN(props.targetLength)) {
          return;
        }
        const res = await apiClient.estimateAdapters({
          target_length: props.targetLength,
          sequences: props.sequences,
        });

        if (res.status === "success") {
          const value = res.data.reverse_adapter;
          props.onCalcFinish(value);
        }
      })().then(() => {
        setIsLoading(false);
      });
    }
  }, [isLoading]);

  return (
    <Button
      variant="outline-secondary"
      onClick={handleEstimate}
      disabled={
        isLoading || isNaN(props.targetLength) || props.sequences.length === 0
      }
    >
      {isLoading ? (
        <>
          <Spinner animation="border" size="sm" />
          {" Estimating..."}
        </>
      ) : (
        "Estimate"
      )}
    </Button>
  );
};

const EstimateTargetLengthButton: React.FC<ButtonProps<number>> = (props) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleEstimate = () => setIsLoading(true);

  useEffect(() => {
    if (isLoading) {
      (async () => {
        const res = await apiClient.estimateTargetLength({
          sequences: props.sequences,
        });

        if (res.status === "success") {
          const value = res.data.target_length;
          props.onCalcFinish(value);
        }
      })().then(() => {
        setIsLoading(false);
      });
    }
  }, [isLoading]);

  return (
    <Button
      variant="outline-secondary"
      onClick={handleEstimate}
      disabled={isLoading || props.sequences.length === 0}
    >
      {isLoading ? (
        <>
          <Spinner animation="border" size="sm" />
          {" Estimating..."}
        </>
      ) : (
        "Estimate"
      )}
    </Button>
  );
};

export {
  EstimateForwardButton,
  EstimateReverseButton,
  EstimateTargetLengthButton,
};
