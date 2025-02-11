import { PayloadAction, createSlice } from "@reduxjs/toolkit";

type ExperimentsList = {
  selected_uuid: string | null; // selected experiment specified by the user, designated by uuid
  last_updated: number[]; // timestamp of the last update;
  name: string[]; // name of the experiment
  uuid: string[]; // uuid of the experiment
};

const experimentsListSlice = createSlice({
  name: "experimentsList",
  initialState: {
    selected_uuid: "",
    last_updated: [],
    name: [],
    uuid: [],
  } as ExperimentsList,
  reducers: {
    setExperimentsList: (
      state: ExperimentsList,
      action: PayloadAction<ExperimentsList>
    ) => {
      return action.payload;
    },
  },
});

const experimentsListReducer = experimentsListSlice.reducer;

export default experimentsListReducer;
export type { ExperimentsList };
export const { setExperimentsList } = experimentsListSlice.actions;
