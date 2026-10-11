import { NextRequest } from "next/server";
import { updateCategory, deleteCategory } from "@/controller/categoryController";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return updateCategory(req, id);
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return deleteCategory(req, id);
}
