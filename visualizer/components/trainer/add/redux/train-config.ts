import { PayloadAction, createSlice } from "@reduxjs/toolkit";

type TrainConfig = {
  reiterations?: number;
  modelLength?: number;
  epochs?: number;
  forceMatchEpochs?: number;
  betaScheduleEpochs?: number;
  earlyStoppingEpochs?: number;
  seed?: number;
  device?: string;
  embeddingSize?: number;
};

const pageConfigSlice = createSlice({
  name: "trainConfig",
  initialState: {
    reiterations: undefined as number | undefined,
    modelLength: undefined as number | undefined,
    epochs: undefined as number | undefined,
    forceMatchEpochs: undefined as number | undefined,
    betaScheduleEpochs: undefined as number | undefined,
    earlyStoppingEpochs: undefined as number | undefined,
    seed: undefined as number | undefined,
    device: undefined as string | undefined,
    embeddingSize: undefined as number | undefined,
  },
  reducers: {
    set: (state: TrainConfig, action: PayloadAction<TrainConfig>) => {
      return {
        ...state,
        reiterations: action.payload.reiterations,
        modelLength: action.payload.modelLength,
        epochs: action.payload.epochs,
        forceMatchEpochs: action.payload.forceMatchEpochs,
        betaScheduleEpochs: action.payload.betaScheduleEpochs,
        earlyStoppingEpochs: action.payload.earlyStoppingEpochs,
        seed: action.payload.seed,
        device: action.payload.device,
        embeddingSize: action.payload.embeddingSize,
      };
    },
  },
});

const trainConfigReducer = pageConfigSlice.reducer;

export default trainConfigReducer;
export type { TrainConfig };
