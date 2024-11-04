import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { useSelector } from "react-redux";
import {
  Button,
  Form,
  InputGroup,
  OverlayTrigger,
  Spinner,
  Tooltip,
} from "react-bootstrap";
import { setPreprocessingConfig } from "../../redux/preprocessing-config";
import { setPageConfig } from "../../redux/page-config";
import { apiClient } from "~/services/api-client";

const availableModelTypes = [
  "RaptGen",
  // "RaptGen-freq",
  // "RaptGen-logfreq",
  // "RfamGen"
];

function useIsLoading(): [boolean, () => void, () => void] {
  const [currentJobs, setCurrentJobs] = useState(0);
  const lock = useCallback(() => {
    setCurrentJobs((prev) => prev + 1);
  }, []);
  const unlock = useCallback(() => {
    setCurrentJobs((prev) => prev - 1);
  }, [currentJobs]);
  const isLoading = currentJobs > 0;

  return [isLoading, lock, unlock];
}

function useStateWithPredicate<T>(
  initialValue: T,
  predicate: (value: T) => boolean,
  initialTrue: boolean = false
): [T, (value: T) => boolean, boolean] {
  const [value, _setValue] = useState<T>(initialValue);
  const [isValid, setIsValid] = useState<boolean>(
    initialTrue ? true : predicate(value)
  );
  const setValue = useCallback((value: T) => {
    _setValue(value);
    const isValid = predicate(value);
    setIsValid(isValid);
    return isValid;
  }, []);

  return [value, setValue, isValid];
}

const SideBar: React.FC = () => {
  const pageConfig = useSelector((state: RootState) => state.pageConfig);
  const preprocessingConfig = useSelector(
    (state: RootState) => state.preprocessingConfig
  );
  const fullSequences = useSelector(
    (state: RootState) => state.selexData.sequences
  );

  const [modelType, setModelType] = useStateWithPredicate<string>(
    pageConfig.modelType,
    () => true
  );
  const [experimentName, setExperimentName, isValidExperimentName] =
    useStateWithPredicate(
      pageConfig.experimentName,
      (value) => value.length > 0,
      true
    );
  const [forwardAdapter, setForwardAdapter, isValidForwardAdapter] =
    useStateWithPredicate(
      preprocessingConfig.forwardAdapter,
      (value) => /^[AUGC]*$/.test(value),
      true
    );
  const [reverseAdapter, setReverseAdapter, isValidReverseAdapter] =
    useStateWithPredicate(
      preprocessingConfig.reverseAdapter,
      (value) => /^[AUGC]*$/.test(value),
      true
    );
  const [targetLength, setTargetLength, isValidTargetLength] =
    useStateWithPredicate(
      preprocessingConfig.targetLength,
      (value) => !isNaN(value) && value > 0,
      true
    );
  const [tolerance, setTolerance, isValidTolerance] = useStateWithPredicate(
    preprocessingConfig.tolerance,
    (value) => value >= 0,
    true
  );
  const [minCount, setMinCount, isValidMinCount] = useStateWithPredicate(
    preprocessingConfig.minCount,
    (value) => value > 0,
    true
  );

  const [isLoadingAdapters, lockAdapters, unlockAdapters] = useIsLoading();
  const [isLoadingTargetlen, lockTargetlen, unlockTargetlen] = useIsLoading();

  const dispatch = useDispatch();

  return (
    <>
      <legend>Model Type</legend>

      <Form.Group className="mb-3">
        <Form.Select
          value={modelType}
          isInvalid={false}
          onChange={(e) => {
            setModelType(e.target.value);
            if (e.target.value === "RaptGen") {
              dispatch(
                setPageConfig({
                  ...pageConfig,
                  modelType: e.target.value,
                })
              );
            }
          }}
        >
          {availableModelTypes.map((modelType) => (
            <option key={modelType}>{modelType}</option>
          ))}
        </Form.Select>
      </Form.Group>

      <legend>Experiment Name</legend>

      <Form.Group className="mb-3">
        <Form.Control
          type="text"
          placeholder="Please enter the name of the experiment."
          value={experimentName}
          onChange={(e) => {
            setExperimentName(e.target.value);
            dispatch(
              setPageConfig({
                ...pageConfig,
                experimentName: e.target.value,
              })
            );
          }}
          isInvalid={!isValidExperimentName}
        />
      </Form.Group>

      <legend>Preprocessing Parameters</legend>

      <Form.Group className="mb-3">
        <Form.Label>Adapters</Form.Label>
        <InputGroup>
          <Form.Control
            type="text"
            placeholder="Forward adapter"
            value={forwardAdapter}
            isInvalid={!isValidForwardAdapter}
            onChange={(e) => {
              const value = e.target.value.toUpperCase().replace(/T/g, "U");
              setForwardAdapter(value);
              dispatch(
                setPreprocessingConfig({
                  ...preprocessingConfig,
                  forwardAdapter: value,
                })
              );
            }}
          />
          <Form.Control
            type="text"
            placeholder="Reverse adapter"
            value={reverseAdapter}
            isInvalid={!isValidReverseAdapter}
            onChange={(e) => {
              const value = e.target.value.toUpperCase().replace(/T/g, "U");
              setReverseAdapter(value);
              dispatch(
                setPreprocessingConfig({
                  ...preprocessingConfig,
                  reverseAdapter: value,
                })
              );
            }}
          />
          <OverlayTrigger
            placement="top"
            overlay={
              <Tooltip id="tooltip-estimate-adapters">
                You need to fill in the target length first to estimate
                adapters.
              </Tooltip>
            }
            show={!isValidTargetLength ? undefined : false}
          >
            <Button
              variant="outline-primary"
              onClick={async () => {
                lockAdapters();
                const res = await apiClient.estimateAdapters({
                  target_length: targetLength,
                  sequences: fullSequences,
                });

                if (res.status === "success") {
                  const fwd = res.data["forward_adapter"]
                    .toUpperCase()
                    .replace(/T/g, "U");
                  const rev = res.data["reverse_adapter"]
                    .toUpperCase()
                    .replace(/T/g, "U");
                  setForwardAdapter(fwd);
                  setReverseAdapter(rev);
                  dispatch(
                    setPreprocessingConfig({
                      ...preprocessingConfig,
                      forwardAdapter: fwd,
                      reverseAdapter: rev,
                    })
                  );
                }
                unlockAdapters();
              }}
              disabled={
                !isValidTargetLength ||
                fullSequences.length === 0 ||
                isLoadingAdapters
              }
            >
              {isLoadingAdapters ? (
                <Spinner animation="border" size="sm" />
              ) : (
                "Estimate"
              )}
            </Button>
          </OverlayTrigger>
        </InputGroup>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Target Length</Form.Label>
        <InputGroup>
          <Form.Control
            type="number"
            placeholder="Allows a positive integer"
            value={targetLength}
            isInvalid={!isValidTargetLength}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              setTargetLength(value);
              dispatch(
                setPreprocessingConfig({
                  ...preprocessingConfig,
                  targetLength: value,
                })
              );
            }}
          />
          <Button
            variant="outline-primary"
            disabled={isLoadingTargetlen || fullSequences.length === 0}
            onClick={async () => {
              lockTargetlen();
              const res = await apiClient.estimateTargetLength({
                sequences: fullSequences,
              });

              if (res.status === "success") {
                setTargetLength(res.data["target_length"]);
                dispatch(
                  setPreprocessingConfig({
                    ...preprocessingConfig,
                    targetLength: res.data["target_length"],
                  })
                );
              }
              unlockTargetlen();
            }}
          >
            {isLoadingTargetlen ? (
              <Spinner animation="border" size="sm" />
            ) : (
              "Estimate"
            )}
          </Button>
        </InputGroup>
        <Form.Text className="text-muted">
          This value is used to filter out sequences which lengths are not
          within the target. Adapters are included in the length calculation.
        </Form.Text>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Filtering Tolerance</Form.Label>
        <Form.Control
          type="number"
          placeholder="Allows a not-negative integer"
          value={tolerance}
          isInvalid={!isValidTolerance}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            setTolerance(value);
            dispatch(
              setPreprocessingConfig({
                ...preprocessingConfig,
                tolerance: value,
              })
            );
          }}
        />
        <Form.Text className="text-muted">
          Tolerance means the allowed maximum difference between the target
          length and that of the sequences.
        </Form.Text>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Minimum Count</Form.Label>
        <Form.Control
          type="number"
          placeholder="Allows a positive integer"
          value={minCount}
          isInvalid={!isValidMinCount}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            setMinCount(value);
            dispatch(
              setPreprocessingConfig({
                ...preprocessingConfig,
                minCount: value,
              })
            );
          }}
        />
        <Form.Text className="text-muted">
          Minimum count is the minimum number of duplicates that are required to
          pass the filtering.
        </Form.Text>
      </Form.Group>
    </>
  );
};

export default SideBar;
