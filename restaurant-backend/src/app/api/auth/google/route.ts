import { NextRequest } from "next/server";
import { handleGoogleAuth } from "@/controller/googleAuthController";

export async function POST(req: NextRequest) {
  return handleGoogleAuth(req);
}
