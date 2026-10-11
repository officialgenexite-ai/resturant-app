import axiosInstance from "./axiosInstance";
import { ApiSuccessResponse } from "../types/auth.types";
import { Order, PlaceOrderPayload } from "../types/order.types";

export async function placeOrder(payload: PlaceOrderPayload): Promise<Order> {
  const response = await axiosInstance.post<ApiSuccessResponse<{ order: Order }>>(
    "/orders",
    payload
  );
  return response.data.data.order;
}

export async function fetchMyOrders(): Promise<Order[]> {
  const response = await axiosInstance.get<ApiSuccessResponse<{ orders: Order[] }>>("/orders");
  return response.data.data.orders;
}
