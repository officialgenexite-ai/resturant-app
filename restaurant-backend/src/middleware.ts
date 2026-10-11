import { NextRequest, NextResponse } from "next/server";

// --- CORS Config (for /api/* routes — used by the mobile app) ---
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:8081", // React Native / Expo local development
];

// --- Layer 1 Gate Config (for /admin/* routes — used by the browser dashboard) ---
const GATE_USERNAME = process.env.GATE_USERNAME;
const GATE_PASSWORD = process.env.GATE_PASSWORD;

function handleCors(request: NextRequest): NextResponse {
  const origin = request.headers.get("origin");
  const isAllowedOrigin = origin && ALLOWED_ORIGINS.includes(origin);

  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  };

  if (isAllowedOrigin) {
    corsHeaders["Access-Control-Allow-Origin"] = origin;
  }

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  const response = NextResponse.next();
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

function handleAdminGate(request: NextRequest): NextResponse {
  const authHeader = request.headers.get("authorization");

  if (authHeader) {
    const encoded = authHeader.split(" ")[1] || "";
    const decoded = Buffer.from(encoded, "base64").toString();
    const [user, pass] = decoded.split(":");

    if (user === GATE_USERNAME && pass === GATE_PASSWORD) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Restricted"',
    },
  });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    return handleAdminGate(request);
  }

  // Everything else matched by the matcher is an /api/* route
  return handleCors(request);
}

export const config = {
  matcher: ["/api/:path*", "/admin/:path*"],
};
