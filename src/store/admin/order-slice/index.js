import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  orderList: [],
  orderDetails: null,
  isLoading: false, // Added missing isLoading state
  error: null, // Added error state for better error handling
};

// Base URL for API calls to avoid repetition
const API_BASE_URL = `${import.meta.env.VITE_API_URL}/admin/orders`;

export const getAllOrdersForAdmin = createAsyncThunk(
  "adminOrders/getAllOrdersForAdmin",
  async (_, { rejectWithValue }) => { // Added rejectWithValue for better error handling
    try {
      const response = await axios.get(`${API_BASE_URL}/get`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch orders"
      );
    }
  }
);

export const getOrderDetailsForAdmin = createAsyncThunk(
  "adminOrders/getOrderDetailsForAdmin",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/details/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch order details"
      );
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  "adminOrders/updateOrderStatus",
  async ({ id, orderStatus }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/update/${id}`, {
        orderStatus,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update order status"
      );
    }
  }
);

const adminOrderSlice = createSlice({
  name: "adminOrders",
  initialState,
  reducers: {
    resetOrderDetails: (state) => {
      state.orderDetails = null;
      state.error = null; // Reset error when clearing details
    },
    clearError: (state) => {
      state.error = null;
    },
    // Optional: Add a reducer to update local order status without refetching
    updateLocalOrderStatus: (state, action) => {
      const { orderId, orderStatus } = action.payload;
      const order = state.orderList.find(order => order._id === orderId);
      if (order) {
        order.orderStatus = orderStatus;
      }
      // Also update orderDetails if it's the current order
      if (state.orderDetails && state.orderDetails._id === orderId) {
        state.orderDetails.orderStatus = orderStatus;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // getAllOrdersForAdmin cases
      .addCase(getAllOrdersForAdmin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllOrdersForAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orderList = action.payload.data || [];
        state.error = null;
      })
      .addCase(getAllOrdersForAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.orderList = [];
        state.error = action.payload || "Failed to load orders";
      })
      // getOrderDetailsForAdmin cases
      .addCase(getOrderDetailsForAdmin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getOrderDetailsForAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orderDetails = action.payload.data || null;
        state.error = null;
      })
      .addCase(getOrderDetailsForAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.orderDetails = null;
        state.error = action.payload || "Failed to load order details";
      })
      // updateOrderStatus cases
      .addCase(updateOrderStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update the order in the list if it exists
        const updatedOrder = action.payload.data;
        if (updatedOrder) {
          const index = state.orderList.findIndex(
            order => order._id === updatedOrder._id
          );
          if (index !== -1) {
            state.orderList[index] = updatedOrder;
          }
          // Also update orderDetails if it's the current order
          if (state.orderDetails && state.orderDetails._id === updatedOrder._id) {
            state.orderDetails = updatedOrder;
          }
        }
        state.error = null;
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to update order status";
      });
  },
});

export const {
  resetOrderDetails,
  clearError,
  updateLocalOrderStatus
} = adminOrderSlice.actions;

export default adminOrderSlice.reducer;
