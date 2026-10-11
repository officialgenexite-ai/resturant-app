import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "30d";

if (!JWT_SECRET) {
  throw new Error("Please define the JWT_SECRET environment variable inside .env.local");
}

export interface JwtPayload {
  userId: string;
  role: "customer" | "admin";
}

export function generateToken(userId: string, role: "customer" | "admin"): string {
  return jwt.sign({ userId, role } as JwtPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
