import { PayloadAction, createSlice } from "@reduxjs/toolkit";

type UploadConfig = {
  pseudoRoute: string;
};

const uploadConfigSlice = createSlice({
  name: "uploadConfig",
  initialState: {
    pseudoRoute: "/",
  },
  reducers: {
    setRoute: (state: UploadConfig, action: PayloadAction<string>) => {
      return {
        ...state,
        pseudoRoute: action.payload,
      };
    },
  },
});

const uploadConfigReducer = uploadConfigSlice.reducer;

export default uploadConfigReducer;
export type { UploadConfig };
