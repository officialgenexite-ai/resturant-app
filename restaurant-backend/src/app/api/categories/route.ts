import { NextRequest } from "next/server";
import { getAllCategories, createCategory } from "@/controller/categoryController";

export async function GET() {
  return getAllCategories();
}

export async function POST(req: NextRequest) {
  return createCategory(req);
}
