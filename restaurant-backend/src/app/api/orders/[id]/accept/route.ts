import { NextRequest } from "next/server";
import { acceptCodOrder } from "@/controller/orderController";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return acceptCodOrder(req, id);
}
