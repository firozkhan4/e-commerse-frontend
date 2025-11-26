
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL

const initialState = {
  isLoading: false,
  orderId: null,
  razorpayOrderId: null,
  amount: 0,
  orderList: [],
  orderDetails: null,
};

// 1️⃣ Create Razorpay Order (backend generates razorpayOrderId)
export const createRazorpayOrder = createAsyncThunk(
  "order/createRazorpayOrder",
  async (orderData) => {
    const response = await axios.post(
     `${API_URL}/shop/order/create`,
      orderData
    );
    return response.data;
  }
);

// 2️⃣ Verify Razorpay Payment
export const verifyRazorpayPayment = createAsyncThunk(
  "order/verifyRazorpayPayment",
  async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId }) => {
    const response = await axios.post(
      `${API_URL}/payment/verify`,
      { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId }
    );
    return response.data;
  }
);

// 3️⃣ Get all orders
export const getAllOrdersByUserId = createAsyncThunk(
  "order/getAllOrdersByUserId",
  async (userId) => {
    const response = await axios.get(
      `${API_URL}/shop/order/list/${userId}`
    );
    return response.data;
  }
);

// 4️⃣ Get order details
export const getOrderDetails = createAsyncThunk(
  "order/getOrderDetails",
  async (id) => {
    const response = await axios.get(
      `${API_URL}/shop/order/details/${id}`
    );
    return response.data;
  }
);

const shoppingOrderSlice = createSlice({
  name: "shoppingOrderSlice",
  initialState,
  reducers: {
    resetOrderDetails: (state) => {
      state.orderDetails = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // CREATE ORDER
      .addCase(createRazorpayOrder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createRazorpayOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orderId = action.payload.orderId;
        state.razorpayOrderId = action.payload.razorpayOrderId;
        state.amount = action.payload.amount;
        sessionStorage.setItem("currentOrderId", JSON.stringify(action.payload.orderId));
      })
      .addCase(createRazorpayOrder.rejected, (state) => {
        state.isLoading = false;
        state.orderId = null;
        state.razorpayOrderId = null;
        state.amount = 0;
      })

      // VERIFY PAYMENT
      .addCase(verifyRazorpayPayment.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(verifyRazorpayPayment.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.success) {
          state.orderDetails = action.payload.data || null;
        }
      })
      .addCase(verifyRazorpayPayment.rejected, (state) => {
        state.isLoading = false;
      })

      // GET ORDERS
      .addCase(getAllOrdersByUserId.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllOrdersByUserId.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orderList = action.payload.data;
      })
      .addCase(getAllOrdersByUserId.rejected, (state) => {
        state.isLoading = false;
        state.orderList = [];
      })

      // GET ORDER DETAILS
      .addCase(getOrderDetails.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getOrderDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orderDetails = action.payload.data;
      })
      .addCase(getOrderDetails.rejected, (state) => {
        state.isLoading = false;
        state.orderDetails = null;
      });
  },
});

export const { resetOrderDetails } = shoppingOrderSlice.actions;
export default shoppingOrderSlice.reducer;


