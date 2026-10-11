import { NextRequest } from "next/server";
import { handleRegister } from "@/controller/authController";

export async function POST(req: NextRequest) {
  return handleRegister(req);
}
