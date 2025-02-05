import { Form } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { RootState } from "./redux/store";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { apiClient } from "~/services/api-client";
import IntegerForm from "~/components/uploader/sidebar-vae/optional-params/integer-form";
import TextForm from "~/components/uploader/sidebar-vae/optional-params/text-form";

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
          dispatch({
            type: "params/set",
            payload: {
              ...params,
              vaeId: res.entries[0].uuid,
            },
          });
          dispatch({
            type: "paramsValid/set",
            payload: {
              ...paramsValid,
              vaeId: true,
            },
          });
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
        dispatch({
          type: "paramsValid/set",
          payload: {
            ...paramsValid,
            minNumComponents: true,
            maxNumComponents: true,
          },
        });
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
              dispatch({
                type: "params/set",
                payload: {
                  ...params,
                  vaeId: uuid,
                },
              });
              dispatch({
                type: "paramsValid/set",
                payload: {
                  ...paramsValid,
                  vaeId: true,
                },
              });
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
      <TextForm
        label="GMM name"
        placeholder="Please enter the name of the GMM."
        value={params.gmmName}
        setValue={(name) =>
          dispatch({
            type: "params/set",
            payload: {
              ...params,
              gmmName: name,
            },
          })
        }
        isValid={paramsValid.gmmName}
        setIsValid={(isValid) =>
          dispatch({
            type: "paramsValid/set",
            payload: {
              ...paramsValid,
              gmmName: isValid,
            },
          })
        }
        predicate={(value) => value.length > 0}
      />

      <legend>Parameters</legend>
      <IntegerForm
        label="Minimum number of GMM components"
        placeholder="Need to be a positive integer"
        value={params.minNumComponents}
        setValue={(n) =>
          dispatch({
            type: "params/set",
            payload: {
              ...params,
              minNumComponents: n,
            },
          })
        }
        isValid={paramsValid.minNumComponents}
        setIsValid={(isValid) =>
          dispatch({
            type: "paramsValid/set",
            payload: {
              ...paramsValid,
              minNumComponents: isValid,
            },
          })
        }
        predicate={(value) => value >= 1 && value <= params.maxNumComponents}
      />
      <IntegerForm
        label="Maximum number of GMM components"
        placeholder="Need to be a positive integer"
        value={params.maxNumComponents}
        setValue={(n) =>
          dispatch({
            type: "params/set",
            payload: {
              ...params,
              maxNumComponents: n,
            },
          })
        }
        isValid={paramsValid.maxNumComponents}
        setIsValid={(isValid) =>
          dispatch({
            type: "paramsValid/set",
            payload: {
              ...paramsValid,
              maxNumComponents: isValid,
            },
          })
        }
        predicate={(value) => value >= 1 && value >= params.minNumComponents}
      />
      <IntegerForm
        label="Step size of the search"
        placeholder="Need to be a positive integer"
        value={params.stepSize}
        setValue={(n) =>
          dispatch({
            type: "params/set",
            payload: {
              ...params,
              stepSize: n,
            },
          })
        }
        isValid={paramsValid.stepSize}
        setIsValid={(isValid) =>
          dispatch({
            type: "paramsValid/set",
            payload: {
              ...paramsValid,
              stepSize: isValid,
            },
          })
        }
        predicate={(value) => value >= 1}
      />
      <IntegerForm
        label="Number of trials on each number of components"
        placeholder="Need to be a positive integer"
        value={params.numTrials}
        setValue={(n) =>
          dispatch({
            type: "params/set",
            payload: {
              ...params,
              numTrials: n,
            },
          })
        }
        isValid={paramsValid.numTrials}
        setIsValid={(isValid) =>
          dispatch({
            type: "paramsValid/set",
            payload: {
              ...paramsValid,
              numTrials: isValid,
            },
          })
        }
        predicate={(value) => value >= 1}
      />
    </>
  );
};

export default Forms;
