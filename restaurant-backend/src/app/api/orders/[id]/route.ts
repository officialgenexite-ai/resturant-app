import { NextRequest } from "next/server";
import { getOrderById } from "@/controller/orderController";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return getOrderById(req, id);
}
