import { NextRequest } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { z } from "zod";
import dbConnect from "@/lib/dbConnect";
import User from "@/model/User";
import { sendWelcomeEmail } from "@/services/emailService";
import { generateToken } from "@/utlis/generateToken";
import { successResponse, errorResponse } from "@/utlis/apiResponse";

const GOOGLE_WEB_CLIENT_ID = process.env.GOOGLE_WEB_CLIENT_ID as string;
const GOOGLE_ANDROID_CLIENT_ID = process.env.GOOGLE_ANDROID_CLIENT_ID as string;

if (!GOOGLE_WEB_CLIENT_ID || !GOOGLE_ANDROID_CLIENT_ID) {
  throw new Error(
    "Please define GOOGLE_WEB_CLIENT_ID and GOOGLE_ANDROID_CLIENT_ID in .env.local"
  );
}

// OAuth2Client verifies tokens against BOTH client IDs — the mobile app's
// idToken is issued under the Android client, but we accept it against
// either audience since both belong to the same Google Cloud project.
const googleClient = new OAuth2Client();

const googleAuthSchema = z.object({
  idToken: z.string().min(10, "Invalid Google ID token"),
});

function formatZodErrors(issues: z.ZodIssue[]): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  issues.forEach((err) => {
    const pathKey = err.path.length ? err.path.map(String).join(".") : "root";
    fieldErrors[pathKey] = err.message;
  });
  return fieldErrors;
}

/**
 * POST /api/auth/google
 * Flow: Receive idToken from mobile app -> Verify with Google servers ->
 *       Extract verified payload (email, name, googleId) ->
 *       Find user by googleId or email -> If not found, auto-register ->
 *       If found (was local account), link googleId to it ->
 *       Generate JWT -> Respond
 */
export async function handleGoogleAuth(req: NextRequest) {
  try {
    await dbConnect();

    let body: unknown;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return errorResponse({ message: "Invalid request body", status: 400 });
    }

    const parsed = googleAuthSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse({
        message: "Validation failed",
        status: 400,
        errors: formatZodErrors(parsed.error.issues),
      });
    }

    const { idToken } = parsed.data;

    // Verify the token directly with Google — never trust a client-sent token blindly
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: [GOOGLE_WEB_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID],
      });
      payload = ticket.getPayload();
    } catch (verifyError) {
      console.error("Google token verification failed:", verifyError);
      return errorResponse({
        message: "Invalid or expired Google token",
        status: 401,
      });
    }

    if (!payload || !payload.email || !payload.sub) {
      return errorResponse({
        message: "Could not retrieve user info from Google",
        status: 401,
      });
    }

    const { email, name, sub: googleId, email_verified } = payload;

    // Try finding by googleId first (returning Google user)
    let user = await User.findOne({ googleId }).select("+googleId");

    if (!user) {
      // Not found by googleId — check if a local account already exists with this email
      user = await User.findOne({ email });

      if (user) {
        // Existing local account — link Google to it instead of creating a duplicate
        user.googleId = googleId;
        if (!user.isEmailVerified && email_verified) {
          user.isEmailVerified = true;
        }
        await user.save();
      } else {
        // Brand new user — auto-register via Google
        user = await User.create({
          name: name || email.split("@")[0],
          email,
          googleId,
          authProvider: "google",
          isEmailVerified: !!email_verified,
        });

        // Fire-and-forget welcome email
        sendWelcomeEmail({ name: user.name, email: user.email }).catch(() => {});
      }
    }

    const token = generateToken(user._id.toString(), user.role);

    return successResponse({
      message: "Google authentication successful",
      status: 200,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          address: user.address || "",
          isEmailVerified: user.isEmailVerified,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    return errorResponse({
      message: "Something went wrong during Google authentication",
      status: 500,
    });
  }
}
