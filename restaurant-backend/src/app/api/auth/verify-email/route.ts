import { NextRequest } from "next/server";
import { handleVerifyEmail } from "@/controller/authController";

export async function POST(req: NextRequest) {
  return handleVerifyEmail(req);
}
