import { NextRequest } from "next/server";
import { getAllProducts, createProduct } from "@/controller/productController";

export async function GET(req: NextRequest) {
  return getAllProducts(req);
}

export async function POST(req: NextRequest) {
  return createProduct(req);
}
