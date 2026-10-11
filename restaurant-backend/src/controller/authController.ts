import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import dbConnect from "@/lib/dbConnect";
import User from "@/model/User";
import { sendWelcomeEmail, sendVerificationEmail } from "@/services/emailService";
import { generateToken } from "@/utlis/generateToken";
import { successResponse, errorResponse } from "@/utlis/apiResponse";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s+/g, ""))
    .refine(
      (v) => /^[0-9+()\-]{10,15}$/.test(v),
      "Please provide a valid phone number"
    ),
  address: z.string().trim().optional().or(z.literal("")),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

function formatZodErrors(issues: z.ZodIssue[]): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  issues.forEach((err) => {
    const pathKey = err.path.length ? err.path.map(String).join(".") : "root";
    fieldErrors[pathKey] = err.message;
  });
  return fieldErrors;
}

function isRequestAborted(req: NextRequest, error?: unknown): boolean {
  if (req.signal.aborted) {
    return true;
  }

  if (error instanceof Error && error.name === "AbortError") {
    return true;
  }

  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    ((error as { code?: string }).code === "ECONNRESET" ||
      (error as { code?: string }).code === "ABORT_ERR")
  );
}

function loginErrorResponse(
  req: NextRequest,
  options: Parameters<typeof errorResponse>[0]
) {
  if (req.signal.aborted) {
    return new Response(null, { status: 499 });
  }

  return errorResponse(options);
}

export async function handleRegister(req: NextRequest) {
  try {
    await dbConnect();

    let body: unknown;
    try {
      body = await req.json();
    } catch (parseError) {
      if (isRequestAborted(req, parseError)) {
        return new Response(null, { status: 499 });
      }
      console.error("JSON parse error:", parseError);
      return errorResponse({ message: "Invalid request body", status: 400 });
    }

    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse({
        message: "Validation failed",
        status: 400,
        errors: formatZodErrors(parsed.error.issues),
      });
    }

    const { name, email, password, phone, address } = parsed.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse({
        message: "An account with this email already exists",
        status: 409,
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationCode = Math.random().toString().substring(2, 8).padStart(6, "0");
    const verificationExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      address: address || "",
      isEmailVerified: false,
      emailVerificationCode: verificationCode,
      emailVerificationCodeExpiry: verificationExpiry,
    });

    try {
      await sendVerificationEmail({
        name: newUser.name,
        email: newUser.email,
        code: verificationCode,
      });
    } catch (error) {
      console.error("Registration email delivery failed:", error);
      return errorResponse({
        message: "Account created, but verification email could not be sent. Please request a new code.",
        status: 502,
      });
    }

    return successResponse({
      message: "Registration successful! Please check your email for verification code.",
      status: 201,
      data: {
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          address: newUser.address,
          isEmailVerified: newUser.isEmailVerified,
        },
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return errorResponse({
      message: "Something went wrong during registration",
      status: 500,
    });
  }
}

export async function handleLogin(req: NextRequest) {
  try {
    await dbConnect();

    if (req.signal.aborted) {
      return new Response(null, { status: 499 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch (parseError) {
      if (isRequestAborted(req, parseError)) {
        return new Response(null, { status: 499 });
      }
      console.error("JSON parse error:", parseError);
      return loginErrorResponse(req, { message: "Invalid request body", status: 400 });
    }

    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return loginErrorResponse(req, {
        message: "Validation failed",
        status: 400,
        errors: formatZodErrors(parsed.error.issues),
      });
    }

    const { email, password } = parsed.data;

    const user = await User.findOne({ email })
      .select("+password name email phone address isEmailVerified role")
      .lean()
      .maxTimeMS(3000)
      .exec();

    if (req.signal.aborted) {
      return new Response(null, { status: 499 });
    }

    if (!user) {
      return loginErrorResponse(req, {
        message: "Invalid email or password",
        status: 401,
      });
    }

    if (!user.isEmailVerified) {
      return loginErrorResponse(req, {
        message: "Please verify your email first before logging in",
        status: 403,
      });
    }
 // ADD THIS BLOCK:
    if (!user.password) {
      return loginErrorResponse(req, {
        message: "This account uses Google Sign-In. Please log in with Google instead.",
        status: 400,
      });
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (req.signal.aborted) {
      return new Response(null, { status: 499 });
    }

    if (!isPasswordCorrect) {
      return loginErrorResponse(req, {
        message: "Invalid email or password",
        status: 401,
      });
    }

    const token = generateToken(user._id.toString(), user.role);

    if (req.signal.aborted) {
      return new Response(null, { status: 499 });
    }

    return successResponse({
      message: "Login successful",
      status: 200,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          isEmailVerified: user.isEmailVerified,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    if (isRequestAborted(req, error)) {
      console.warn("Login request aborted by client");
      return new Response(null, { status: 499 });
    }

    console.error("Login error:", error);
    return loginErrorResponse(req, {
      message: "Something went wrong during login",
      status: 500,
    });
  }
}

export async function handleVerifyEmail(req: NextRequest) {
  try {
    await dbConnect();

    let body: unknown;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return errorResponse({ message: "Invalid request body", status: 400 });
    }

    const schema = z.object({
      email: z.string().trim().toLowerCase().email("Invalid email address"),
      code: z.string().trim().length(6, "Code must be 6 digits"),
    });

    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return errorResponse({
        message: "Validation failed",
        status: 400,
        errors: formatZodErrors(parsed.error.issues),
      });
    }

    const { email, code } = parsed.data;

    const user = await User.findOne({ email }).select(
      "+emailVerificationCode +emailVerificationCodeExpiry"
    );

    if (!user) {
      return errorResponse({ message: "User not found", status: 404 });
    }

    if (user.isEmailVerified) {
      return errorResponse({ message: "Email already verified", status: 400 });
    }

    if (user.emailVerificationCode !== code) {
      return errorResponse({ message: "Invalid verification code", status: 400 });
    }

    if (!user.emailVerificationCodeExpiry || user.emailVerificationCodeExpiry < new Date()) {
      return errorResponse({ message: "Verification code has expired", status: 400 });
    }

    user.isEmailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationCodeExpiry = undefined;
    await user.save();

    sendWelcomeEmail({ name: user.name, email: user.email }).catch((error) => {
      console.error("Welcome email delivery failed:", error);
    });

    const token = generateToken(user._id.toString(), user.role);

    return successResponse({
      message: "Email verified successfully! Welcome aboard! 🎉",
      status: 200,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          isEmailVerified: user.isEmailVerified,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Verify email error:", error);
    return errorResponse({
      message: "Something went wrong during email verification",
      status: 500,
    });
  }
}
const resendVerificationSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
});

/**
 * POST /api/auth/resend-verification
 * Flow: Validate email -> Find user -> Check not already verified ->
 *       Generate new code -> Update DB -> Send email -> Respond
 */
export async function handleResendVerification(req: NextRequest) {
  try {
    await dbConnect();

    let body: unknown;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return errorResponse({ message: "Invalid request body", status: 400 });
    }

    const parsed = resendVerificationSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse({
        message: "Validation failed",
        status: 400,
        errors: formatZodErrors(parsed.error.issues),
      });
    }

    const { email } = parsed.data;

    const user = await User.findOne({ email });

    if (!user) {
      return errorResponse({ message: "No account found with this email", status: 404 });
    }

    if (user.isEmailVerified) {
      return errorResponse({ message: "Email is already verified", status: 400 });
    }

    // Generate a fresh 6-digit code and reset expiry
    const verificationCode = Math.random().toString().substring(2, 8).padStart(6, "0");
    const verificationExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.emailVerificationCode = verificationCode;
    user.emailVerificationCodeExpiry = verificationExpiry;
    await user.save();

    try {
      await sendVerificationEmail({
        name: user.name,
        email: user.email,
        code: verificationCode,
      });
    } catch (error) {
      console.error("Resend email delivery failed:", error);
      return errorResponse({
        message: "Verification email could not be sent. Please try again.",
        status: 502,
      });
    }

    return successResponse({
      message: "A new verification code has been sent to your email.",
      status: 200,
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return errorResponse({
      message: "Something went wrong while resending the code",
      status: 500,
    });
  }
}
