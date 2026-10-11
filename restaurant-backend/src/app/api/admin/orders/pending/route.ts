import { NextRequest } from "next/server";
import { getPendingOrders } from "@/controller/adminOrderController";

export async function GET(req: NextRequest) {
  return getPendingOrders(req);
}
