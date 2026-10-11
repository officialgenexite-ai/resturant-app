import { NextRequest } from "next/server";
import { getActiveOrders } from "@/controller/adminOrderController";

export async function GET(req: NextRequest) {
  return getActiveOrders(req);
}
