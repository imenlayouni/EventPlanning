import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  services: [],

  nearby: [],
};

const servicesSlice = createSlice({
  name: "services",
  initialState,
  reducers: {
    setNearbyServices: (state, action) => {
      state.nearby = action.payload;
    },
  },
});

export const { setNearbyServices } = servicesSlice.actions;
export default servicesSlice.reducer;
