import { PayloadAction, createSlice } from "@reduxjs/toolkit";

type PageConfig = {
  parentId: string; // uuid of the parent model. when not specifed, represented as ""
  childId: number | null; // null is for the parent model
};

const pageConfigSlice = createSlice({
  name: "pageConfig",
  initialState: {
    parentId: "",
    childId: null as number | null,
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
export const { set: setPageConfig } = pageConfigSlice.actions;
export type { PageConfig };
