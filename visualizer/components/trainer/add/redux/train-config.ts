import { PayloadAction, createSlice } from "@reduxjs/toolkit";

interface TrainConfigState {
  reiteration: number;
  modelLength: number;
  epochs: number;
  forceMatchEpochs: number;
  betaScheduleEpochs: number;
  earlyStoppingEpochs: number;
  seed: number;
  device: string;
  matchCost: number;
}

interface TrainConfigStateWithFlags extends TrainConfigState {
  isValidParams: boolean;
}

const pageConfigSlice = createSlice({
  name: "trainConfig",
  initialState: {
    isValidParams: true,
    reiteration: 1,
    modelLength: 0,
    epochs: 1000,
    forceMatchEpochs: 50,
    betaScheduleEpochs: 50,
    earlyStoppingEpochs: 50,
    seed: 0,
    device: "CPU",
    matchCost: 4,
  },
  reducers: {
    setTrainConfig: (
      state: TrainConfigStateWithFlags,
      action: PayloadAction<TrainConfigState>
    ) => {
      const {
        reiteration,
        modelLength,
        epochs,
        forceMatchEpochs,
        betaScheduleEpochs,
        earlyStoppingEpochs,
        seed,
        device,
        matchCost,
      } = action.payload;

      const isValidParams =
        reiteration >= 1 &&
        modelLength >= 1 &&
        epochs >= 1 &&
        forceMatchEpochs >= 0 &&
        betaScheduleEpochs >= 0 &&
        earlyStoppingEpochs >= 1 &&
        seed >= 0 &&
        matchCost >= 0;

      return {
        isValidParams,
        reiteration,
        modelLength,
        epochs,
        forceMatchEpochs,
        betaScheduleEpochs,
        earlyStoppingEpochs,
        seed,
        device,
        matchCost,
      };
    },
  },
});

const trainConfigReducer = pageConfigSlice.reducer;

export default trainConfigReducer;
export type { TrainConfigState };
export const { setTrainConfig } = pageConfigSlice.actions;
