import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import adminReducer from "./adminSlice";
import profileReducer from "./profileSlice";
import listingReducer from "./listingSlice";
import requestReducer from "./requestSlice";
import servicesReducer from "./servicesSlice";
import eventsReducer from "./eventsSlice";

//store and update data
export const store = configureStore({
  reducer: {
    auth: authReducer,
    admin: adminReducer,
    profile: profileReducer,
    listings: listingReducer,
    serviceRequests: requestReducer,
    services: servicesReducer,
    events: eventsReducer
  },
});
