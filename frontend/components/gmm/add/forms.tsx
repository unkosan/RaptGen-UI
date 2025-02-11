import { Form } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { RootState } from "./redux/store";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { apiClient } from "~/services/api-client";
import { setParams } from "./redux/params";
import { setParamsValid } from "./redux/paramsValid";

const Forms: React.FC = () => {
  const params = useSelector((state: RootState) => state.params);
  const paramsValid = useSelector((state: RootState) => state.paramsValid);

  const [vaeModels, setVaeModels] = useState<
    {
      uuid: string;
      name: string;
    }[]
  >([]);

  const dispatch = useDispatch();

  // retrieve VAE model names
  useEffect(() => {
    (async () => {
      const res = await apiClient.getVAEModelNames();

      setVaeModels(res.entries);

      if (res.entries.length > 0) {
        try {
          dispatch(
            setParams({
              ...params,
              vaeId: res.entries[0].uuid,
            })
          );
          dispatch(
            setParamsValid({
              ...paramsValid,
              vaeId: true,
            })
          );
        } catch (e) {
          console.error(e);
        }
      }
    })();
  }, []);

  // validate minNumComponents and maxNumComponents
  useEffect(() => {
    if (!paramsValid.minNumComponents || !paramsValid.maxNumComponents) {
      if (
        params.minNumComponents <= params.maxNumComponents &&
        params.minNumComponents >= 1 &&
        params.maxNumComponents >= 1
      ) {
        dispatch(
          setParamsValid({
            ...paramsValid,
            minNumComponents: true,
            maxNumComponents: true,
          })
        );
      }
      return;
    }
  }, [params.minNumComponents, params.maxNumComponents]);

  return (
    <>
      <legend>Target VAE model</legend>
      <Form.Group className="mb-3">
        <Form.Label>Model type</Form.Label>
        <Form.Select
          value={params.vaeId}
          onChange={(e) => {
            const uuid = e.target.value;
            try {
              dispatch(
                setParams({
                  ...params,
                  vaeId: uuid,
                })
              );
              dispatch(
                setParamsValid({
                  ...paramsValid,
                  vaeId: true,
                })
              );
            } catch (e) {
              console.error(e);
            }
          }}
        >
          {vaeModels.map((model, index) => (
            <option key={index} value={model.uuid}>
              {model.name}
            </option>
          ))}
        </Form.Select>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Model name</Form.Label>
        <Form.Control
          type="text"
          placeholder="Please enter the name of the VAE model."
          defaultValue={params.gmmName}
          onChange={(e) => {
            const name = e.target.value.trim();
            const isValid = name.length > 0;
            dispatch(
              setParamsValid({
                ...paramsValid,
                gmmName: isValid,
              })
            );
            if (isValid) {
              dispatch(
                setParams({
                  ...params,
                  gmmName: name,
                })
              );
            }
          }}
          isInvalid={!paramsValid.gmmName}
        />
      </Form.Group>

      <legend>Parameters</legend>
      <Form.Group className="mb-3">
        <Form.Label>Minimum number of GMM components</Form.Label>
        <Form.Control
          type="number"
          placeholder="Need to be a positive integer"
          defaultValue={params.minNumComponents}
          onChange={(e) => {
            const numComponents = parseInt(e.target.value);
            const isValid =
              !isNaN(numComponents) &&
              numComponents >= 1 &&
              numComponents <= params.maxNumComponents;
            dispatch(
              setParamsValid({
                ...paramsValid,
                minNumComponents: isValid,
              })
            );
            if (isValid) {
              dispatch(
                setParams({
                  ...params,
                  minNumComponents: numComponents,
                })
              );
            }
          }}
          isInvalid={!paramsValid.minNumComponents}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Maximum number of GMM components</Form.Label>
        <Form.Control
          type="number"
          placeholder="Need to be a positive integer"
          defaultValue={params.maxNumComponents}
          onChange={(e) => {
            const numComponents = parseInt(e.target.value);
            const isValid =
              !isNaN(numComponents) && numComponents >= params.minNumComponents;
            dispatch(
              setParamsValid({
                ...paramsValid,
                maxNumComponents: isValid,
              })
            );
            if (isValid) {
              dispatch(
                setParams({
                  ...params,
                  maxNumComponents: numComponents,
                })
              );
            }
          }}
          isInvalid={!paramsValid.maxNumComponents}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Step size of the search</Form.Label>
        <Form.Control
          type="number"
          placeholder="Need to be a positive integer"
          defaultValue={params.stepSize}
          onChange={(e) => {
            const stepSize = parseInt(e.target.value);
            const isValid = !isNaN(stepSize) && stepSize >= 1;
            dispatch(
              setParamsValid({
                ...paramsValid,
                stepSize: isValid,
              })
            );
            if (isValid) {
              dispatch(
                setParams({
                  ...params,
                  stepSize: stepSize,
                })
              );
            }
          }}
          isInvalid={!paramsValid.stepSize}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Number of trials on each number of components</Form.Label>
        <Form.Control
          type="number"
          placeholder="Need to be a positive integer"
          defaultValue={params.numTrials}
          onChange={(e) => {
            const numTrials = parseInt(e.target.value);
            const isValid = !isNaN(numTrials) && numTrials >= 1;
            dispatch(
              setParamsValid({
                ...paramsValid,
                numTrials: isValid,
              })
            );
            if (isValid) {
              dispatch(
                setParams({
                  ...params,
                  numTrials: numTrials,
                })
              );
            }
          }}
          isInvalid={!paramsValid.numTrials}
        />
      </Form.Group>
    </>
  );
};

export default Forms;
