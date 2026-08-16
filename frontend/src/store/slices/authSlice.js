import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { authService } from "../../services/authService";
import { extractErrorMessage, getTokens, setTokens } from "../../services/api";

const ROLE_HOME = {
  CUSTOMER: "/customer",
  SHOPKEEPER: "/shopkeeper/dashboard",
  DELIVERY_PARTNER: "/delivery/dashboard",
  ADMIN: "/admin/dashboard",
};

export const login = createAsyncThunk("auth/login", async ({ email, password }, thunkAPI) => {
  try {
    const { data } = await authService.login(email, password);
    setTokens({ access: data.access, refresh: data.refresh });
    return data.user;
  } catch (error) {
    return thunkAPI.rejectWithValue(extractErrorMessage(error));
  }
});

export const registerCustomer = createAsyncThunk(
  "auth/registerCustomer",
  async (payload, thunkAPI) => {
    try {
      const { data } = await authService.registerCustomer(payload);
      setTokens({ access: data.access, refresh: data.refresh });
      return data.user;
    } catch (error) {
      return thunkAPI.rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const fetchCurrentUser = createAsyncThunk("auth/fetchCurrentUser", async (_, thunkAPI) => {
  try {
    const { data } = await authService.me();
    return data;
  } catch (error) {
    return thunkAPI.rejectWithValue(extractErrorMessage(error));
  }
});

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (payload, thunkAPI) => {
    try {
      const { data } = await authService.updateProfile(payload);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(extractErrorMessage(error));
    }
  }
);

const initialState = {
  user: null,
  status: "idle", // idle | loading | succeeded | failed
  bootstrapped: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      setTokens(null);
      state.user = null;
      state.status = "idle";
      state.bootstrapped = true;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
        state.bootstrapped = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(registerCustomer.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(registerCustomer.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
        state.bootstrapped = true;
      })
      .addCase(registerCustomer.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchCurrentUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
        state.bootstrapped = true;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.status = "idle";
        state.user = null;
        state.bootstrapped = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;

export const selectAuthUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => Boolean(state.auth.user) && Boolean(getTokens());
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthBootstrapped = (state) => state.auth.bootstrapped;
export const selectAuthError = (state) => state.auth.error;
export const selectRoleHome = (state) => ROLE_HOME[state.auth.user?.role] || "/";

export default authSlice.reducer;
