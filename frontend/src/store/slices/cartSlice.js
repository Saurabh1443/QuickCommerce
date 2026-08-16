import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { cartService } from "../../services/cartService";
import { extractErrorMessage } from "../../services/api";

export const fetchCart = createAsyncThunk("cart/fetch", async (_, thunkAPI) => {
  try {
    const { data } = await cartService.get();
    return data;
  } catch (error) {
    return thunkAPI.rejectWithValue(extractErrorMessage(error));
  }
});

export const addToCart = createAsyncThunk(
  "cart/addItem",
  async ({ productId, quantity = 1, replaceCart = false }, thunkAPI) => {
    try {
      const { data } = await cartService.addItem(productId, quantity, replaceCart);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const updateCartItem = createAsyncThunk(
  "cart/updateItem",
  async ({ itemId, quantity }, thunkAPI) => {
    try {
      const { data } = await cartService.updateItem(itemId, quantity);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const removeCartItem = createAsyncThunk("cart/removeItem", async (itemId, thunkAPI) => {
  try {
    const { data } = await cartService.removeItem(itemId);
    return data;
  } catch (error) {
    return thunkAPI.rejectWithValue(extractErrorMessage(error));
  }
});

export const clearCart = createAsyncThunk("cart/clear", async (_, thunkAPI) => {
  try {
    const { data } = await cartService.clear();
    return data;
  } catch (error) {
    return thunkAPI.rejectWithValue(extractErrorMessage(error));
  }
});

const initialState = {
  cart: null,
  status: "idle",
  error: null,
  conflict: null, // set when the backend reports a different-shop conflict
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    clearCartError(state) {
      state.error = null;
    },
    clearConflict(state) {
      state.conflict = null;
    },
    resetCart(state) {
      state.cart = null;
      state.status = "idle";
    },
  },
  extraReducers: (builder) => {
    const setCart = (state, action) => {
      state.status = "succeeded";
      state.cart = action.payload;
    };
    const setError = (state, action) => {
      state.status = "failed";
      state.error = action.payload;
      if (typeof action.payload === "string" && action.payload.toLowerCase().includes("another shop")) {
        state.conflict = action.meta.arg;
      }
    };
    builder
      .addCase(fetchCart.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCart.fulfilled, setCart)
      .addCase(fetchCart.rejected, setError)
      .addCase(addToCart.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.conflict = null;
        setCart(state, action);
      })
      .addCase(addToCart.rejected, setError)
      .addCase(updateCartItem.fulfilled, setCart)
      .addCase(updateCartItem.rejected, setError)
      .addCase(removeCartItem.fulfilled, setCart)
      .addCase(removeCartItem.rejected, setError)
      .addCase(clearCart.fulfilled, setCart)
      .addCase(clearCart.rejected, setError);
  },
});

export const { clearCartError, clearConflict, resetCart } = cartSlice.actions;

export const selectCart = (state) => state.cart.cart;
export const selectCartStatus = (state) => state.cart.status;
export const selectCartError = (state) => state.cart.error;
export const selectCartConflict = (state) => state.cart.conflict;
export const selectCartItemCount = (state) => state.cart.cart?.item_count || 0;

export default cartSlice.reducer;
