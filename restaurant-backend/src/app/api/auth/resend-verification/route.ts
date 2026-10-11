import { NextRequest } from "next/server";
import { handleResendVerification } from "@/controller/authController";

export async function POST(req: NextRequest) {
  return handleResendVerification(req);
}
