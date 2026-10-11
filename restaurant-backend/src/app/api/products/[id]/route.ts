import { NextRequest } from "next/server";
import { getProductById, updateProduct, deleteProduct } from "@/controller/productController";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return getProductById(id);
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return updateProduct(req, id);
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return deleteProduct(req, id);
}
