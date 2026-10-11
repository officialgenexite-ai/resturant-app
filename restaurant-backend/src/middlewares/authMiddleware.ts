import { NextRequest } from "next/server";
import { verifyToken, JwtPayload } from "@/utlis/generateToken";
import { errorResponse } from "@/utlis/apiResponse";

/**
 * Extracts and verifies the JWT from the Authorization header.
 * Returns the decoded payload on success, or null if missing/invalid.
 * Never throws — callers check for null and respond accordingly.
 */
export function getAuthPayload(req: NextRequest): JwtPayload | null {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7); // remove "Bearer " prefix

  try {
    return verifyToken(token);
  } catch {
    return null; // expired or malformed token
  }
}

/**
 * Guard for routes that require ANY authenticated user (customer or admin).
 * Returns an error Response if unauthorized, or null if the request may proceed.
 * Usage: const authError = requireAuth(req); if (authError) return authError;
 */
export function requireAuth(req: NextRequest): { error: Response } | { payload: JwtPayload } {
  const payload = getAuthPayload(req);

  if (!payload) {
    return { error: errorResponse({ message: "Authentication required", status: 401 }) };
  }

  return { payload };
}

/**
 * Guard for routes that require an ADMIN user specifically.
 * Usage: const check = requireAdmin(req); if ("error" in check) return check.error;
 */
export function requireAdmin(req: NextRequest): { error: Response } | { payload: JwtPayload } {
  const payload = getAuthPayload(req);

  if (!payload) {
    return { error: errorResponse({ message: "Authentication required", status: 401 }) };
  }

  if (payload.role !== "admin") {
    return { error: errorResponse({ message: "Admin access required", status: 403 }) };
  }

  return { payload };
}
