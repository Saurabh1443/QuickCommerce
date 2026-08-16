import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  snackbar: { open: false, message: "", severity: "info" },
  location: null, // { latitude, longitude, label } — customer's selected delivery location
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    showSnackbar(state, action) {
      const { message, severity = "info" } = action.payload;
      state.snackbar = { open: true, message, severity };
    },
    hideSnackbar(state) {
      state.snackbar.open = false;
    },
    setLocation(state, action) {
      state.location = action.payload;
      localStorage.setItem("qc_location", JSON.stringify(action.payload));
    },
    loadLocationFromStorage(state) {
      try {
        const saved = JSON.parse(localStorage.getItem("qc_location"));
        if (saved) state.location = saved;
      } catch {
        state.location = null;
      }
    },
  },
});

export const { showSnackbar, hideSnackbar, setLocation, loadLocationFromStorage } =
  uiSlice.actions;

export const selectSnackbar = (state) => state.ui.snackbar;
export const selectLocation = (state) => state.ui.location;

export default uiSlice.reducer;
