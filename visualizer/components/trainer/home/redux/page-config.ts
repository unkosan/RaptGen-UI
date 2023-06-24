import { PayloadAction, createSlice } from "@reduxjs/toolkit";

type PageConfig = {
  uuid: string; // uuid of the parent model. when not specifed, represented as ""
  childIndex: number | null; // null is for the parent model
};

const pageConfigSlice = createSlice({
  name: "pageConfig",
  initialState: {
    uuid: "",
    childIndex: null as number | null,
  },
  reducers: {
    set: (state: PageConfig, action: PayloadAction<PageConfig>) => {
      return {
        ...action.payload,
      };
    },
  },
});

const pageConfigReducer = pageConfigSlice.reducer;

export default pageConfigReducer;
export type { PageConfig };
