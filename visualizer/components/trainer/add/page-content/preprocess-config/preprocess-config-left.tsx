import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { Form, InputGroup } from "react-bootstrap";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";

import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useDispatch } from "react-redux";
import {
  EstimateForwardButton,
  EstimateReverseButton,
  EstimateTargetLengthButton,
} from "./estimate-bottons";

type Props = {
  setRoute: React.Dispatch<
    React.SetStateAction<"/preprocess-config" | "/train-config">
  >;
};

const availableModelTypes = [
  "RaptGen",
  // "RaptGen-freq",
  // "RaptGen-logfreq",
  // "RaptGen2"
];

const formSchema = z.object({
  modelType: z
    .string()
    .refine((modelType) => availableModelTypes.includes(modelType)),
  experimentName: z.string().nonempty(),
  forwardAdapter: z
    .string()
    .regex(/^[ACGTU]*$/)
    .transform((adapter) => adapter.toUpperCase().replaceAll("T", "U")),
  reverseAdapter: z
    .string()
    .regex(/^[ACGTU]*$/)
    .transform((adapter) => adapter.toUpperCase().replaceAll("T", "U")),
  targetLength: z.number().int().positive(),
  tolerance: z.number().int().nonnegative(),
  minCount: z.number().int().positive(),
});

const PreprocessConfigLeft: React.FC<Props> = ({ setRoute }) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const preprocessingConfig = useSelector(
    (state: RootState) => state.preprocessingConfig
  );
  const selexData = useSelector((state: RootState) => state.selexData);
  const dispatch = useDispatch();

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = (data) => {
    console.log(data);
    dispatch({
      type: "preprocessingConfig/set",
      payload: {
        ...preprocessingConfig,
        isValidParams: true,
        isDirty: false,
        minCount: data.minCount,
        forwardAdapter: data.forwardAdapter,
        reverseAdapter: data.reverseAdapter,
        targetLength: data.targetLength,
        tolerance: data.tolerance,
      },
    });
    dispatch({
      type: "pageConfig/setModelType",
      payload: data.modelType,
    });
    dispatch({
      type: "pageConfig/setExperimentName",
      payload: data.experimentName,
    });
    setRoute("/train-config");
  };

  return (
    <div id="preprocess-config-left">
      <Form onSubmit={handleSubmit(onSubmit)} id="preprocess-config-form">
        <legend>Model Type</legend>
        <Form.Group className="mb-3">
          <Form.Select
            defaultValue={availableModelTypes[0]}
            {...register("modelType", { required: true })}
          >
            {availableModelTypes.map((modelType) => (
              <option key={modelType}>{modelType}</option>
            ))}
          </Form.Select>
        </Form.Group>
        <legend>Experiment Name</legend>
        <Form.Group className="mb-3">
          <Form.Control
            {...register("experimentName", { required: true })}
            type="text"
            placeholder="Please enter the name of the experiment."
            isInvalid={errors.experimentName !== undefined}
          />
        </Form.Group>
        <legend>Preprocessing Parameters</legend>
        <Form.Group className="mb-3">
          <Form.Label htmlFor="forwardAdapter">Forward Adapter</Form.Label>
          <InputGroup>
            <Form.Control
              {...register("forwardAdapter", { required: true })}
              type="text"
              placeholder="Please enter the forward adapter. (AUCG only)"
              isInvalid={errors.forwardAdapter !== undefined}
            />
            <EstimateForwardButton
              sequences={selexData.sequences}
              targetLength={watch("targetLength")}
              onCalcFinish={(adapter) => setValue("forwardAdapter", adapter)}
            />
          </InputGroup>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label htmlFor="reverseAdapter">Reverse Adapter</Form.Label>
          <InputGroup>
            <Form.Control
              {...register("reverseAdapter", { required: true })}
              type="text"
              placeholder="Please enter the reverse adapter. (AUCG only)"
              isInvalid={errors.reverseAdapter !== undefined}
            />
            <EstimateReverseButton
              sequences={selexData.sequences}
              targetLength={watch("targetLength")}
              onCalcFinish={(adapter) => setValue("reverseAdapter", adapter)}
            />
          </InputGroup>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label htmlFor="targetLength">Target Length</Form.Label>
          <InputGroup>
            <Form.Control
              {...register("targetLength", {
                required: true,
                valueAsNumber: true,
              })}
              type="number"
              placeholder="Please enter the target length."
              isInvalid={errors.targetLength !== undefined}
            />
            <EstimateTargetLengthButton
              sequences={selexData.sequences}
              targetLength={watch("targetLength")}
              onCalcFinish={(targetLength) =>
                setValue("targetLength", targetLength)
              }
            />
          </InputGroup>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label htmlFor="tolerance">Tolerance</Form.Label>
          <Form.Control
            {...register("tolerance", {
              required: true,
              valueAsNumber: true,
            })}
            type="number"
            placeholder="Please enter the tolerance."
            isInvalid={errors.tolerance !== undefined}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label htmlFor="minCount">Minimum Count</Form.Label>
          <Form.Control
            {...register("minCount", { required: true, valueAsNumber: true })}
            type="number"
            placeholder="Please enter the minimum count."
            isInvalid={errors.minCount !== undefined}
          />
        </Form.Group>
      </Form>
    </div>
  );
};

export default PreprocessConfigLeft;
