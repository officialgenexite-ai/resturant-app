import { NextRequest } from "next/server";
import { placeOrder, getMyOrders } from "@/controller/orderController";

export async function POST(req: NextRequest) {
  return placeOrder(req);
}

export async function GET(req: NextRequest) {
  return getMyOrders(req);
}
