import { NextRequest } from "next/server";
import { handleLogin } from "@/controller/authController";

export async function POST(req: NextRequest) {
  return handleLogin(req);
}
