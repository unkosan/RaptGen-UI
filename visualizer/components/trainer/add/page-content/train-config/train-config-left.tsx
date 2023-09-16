import React from "react";
import { useDispatch } from "react-redux";
import { Button, Form } from "react-bootstrap";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { apiClient } from "~/services/api-client";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { requestPostSubmitJob } from "~/services/route/train";
import { useRouter } from "next/router";

const schema = z.object({
  // z.nan is needed for allowing empty number, string.empty() is for string
  // reiteration: z.union([z.number().positive(), z.nan()]),
  reiteration: z.number().positive(),
  modelLength: z.number().positive(),
  epochs: z.number().positive(),
  betaDuration: z.number().positive(),
  matchForcingDuration: z.number().positive(),
  earlyStopping: z.number().positive(),
  seedValue: z.number().positive(),
  matchCost: z.number().positive(),
  device: z.string(),
});

type Inputs = z.infer<typeof schema>;

const TrainConfigLeft: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
  });

  const router = useRouter();

  const modelType = useSelector(
    (state: RootState) => state.pageConfig.modelType
  );
  const experimentName = useSelector(
    (state: RootState) => state.pageConfig.experimentName
  );
  const preprocessingConfig = useSelector(
    (state: RootState) => state.preprocessingConfig
  );
  const selexData = useSelector((state: RootState) => state.selexData);

  //   const onSubmit: SubmitHandler<Inputs> = (data) => console.log(data);
  const onSubmit: SubmitHandler<Inputs> = (data) => {
    console.log(data);

    const parsed = requestPostSubmitJob.safeParse({
      type: modelType,
      name: experimentName,
      params_preprocessing: {
        forward: preprocessingConfig.forwardAdapter,
        reverse: preprocessingConfig.reverseAdapter,
        random_region_length:
          (preprocessingConfig.targetLength ?? 0) -
          (preprocessingConfig.forwardAdapter?.length ?? 0) -
          (preprocessingConfig.reverseAdapter?.length ?? 0),
        tolerance: preprocessingConfig.tolerance,
        minimum_count: preprocessingConfig.minCount,
      },
      random_regions: selexData.randomRegions,
      duplicates: selexData.duplicates,
      reiteration: data.reiteration,
      params_training: {
        model_length: data.modelLength,
        epochs: data.epochs,
        match_forcing_duration: data.matchForcingDuration,
        beta_duration: data.betaDuration,
        early_stopping: data.earlyStopping,
        seed_value: data.seedValue,
        match_cost: data.matchCost,
        device: data.device,
      },
    });

    if (parsed.success) {
      apiClient.postSubmitJob(parsed.data).then(() => router.push("/trainer"));
    } else {
      alert(`Failed to submit a job: ${parsed.error.message}`);
    }
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)} id="train-config-form">
      <legend>Training Parameters</legend>
      <Form.Group className="mb-3">
        <Form.Label htmlFor="reiteration">Reiteration of Training</Form.Label>
        <Form.Control
          id="reiteration"
          {...register("reiteration", { valueAsNumber: true, required: true })}
          type="number"
          placeholder="The model with lowest ELBO is selected"
          isInvalid={errors.reiteration !== undefined}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label htmlFor="modelLength">pHMM Model Length</Form.Label>
        <Form.Control
          id="modelLength"
          {...register("modelLength", { valueAsNumber: true, required: true })}
          type="number"
          placeholder="The length of matching states on the pHMM model"
          isInvalid={errors.modelLength !== undefined}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label htmlFor="epochs">Maximum Number of Epochs</Form.Label>
        <Form.Control
          id="epochs"
          {...register("epochs", { valueAsNumber: true, required: true })}
          type="number"
          placeholder="The maxium number of epochs to train for"
          isInvalid={errors.epochs !== undefined}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label htmlFor="betaDuration">Beta Weighting Epochs</Form.Label>
        <Form.Control
          id="betaDuration"
          {...register("betaDuration", { valueAsNumber: true, required: true })}
          type="number"
          placeholder="The number of epochs under beta weighting"
          isInvalid={errors.betaDuration !== undefined}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label htmlFor="matchForcingDuration">
          Force Matching Epochs
        </Form.Label>
        <Form.Control
          id="matchForcingDuration"
          {...register("matchForcingDuration", {
            valueAsNumber: true,
            required: true,
          })}
          type="number"
          placeholder="The number of epochs under match forcing"
          isInvalid={errors.matchForcingDuration !== undefined}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label htmlFor="earlyStopping">Early Stopping Patience</Form.Label>
        <Form.Control
          id="earlyStopping"
          {...register("earlyStopping", {
            valueAsNumber: true,
            required: true,
          })}
          type="number"
          placeholder="The number of epochs to wait before early stopping"
          isInvalid={errors.earlyStopping !== undefined}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label htmlFor="seedValue">Seed Value</Form.Label>
        <Form.Control
          id="seedValue"
          {...register("seedValue", { valueAsNumber: true, required: true })}
          type="number"
          placeholder="An integer value for random seed"
          isInvalid={errors.seedValue !== undefined}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label htmlFor="matchCost">Match Cost</Form.Label>
        <Form.Control
          id="matchCost"
          {...register("matchCost", { valueAsNumber: true, required: true })}
          type="number"
          placeholder="The cost of match forcing"
          isInvalid={errors.matchCost !== undefined}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label htmlFor="device">Device</Form.Label>
        <Form.Select
          id="device"
          {...register("device", { required: true })}
          isInvalid={errors.device !== undefined}
        >
          <option>cpu</option>
          <option>cuda:0</option>
          <option>cuda:1</option>
        </Form.Select>
      </Form.Group>
    </Form>
  );
};

export default TrainConfigLeft;
