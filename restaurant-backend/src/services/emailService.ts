import nodemailer, { Transporter } from "nodemailer";
import type { IOrder } from "@/model/Order";
let transporter: Transporter | null = null;

/**
 * Lazily creates a single reused transporter instance instead of creating
 * a new SMTP connection on every email send.
 */
function getTransporter(): Transporter {
  if (transporter) return transporter;

  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;

  if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS) {
    throw new Error(
      "Email service is not configured. Define EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASS."
    );
  }

  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT),
    secure: Number(EMAIL_PORT) === 465,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  return transporter;
}

interface WelcomeEmailPayload {
  name: string;
  email: string;
}

interface VerificationEmailPayload {
  name: string;
  email: string;
  code: string;
}

/**
 * Sends a verification code email after successful registration.
 */
export async function sendVerificationEmail({
  name,
  email,
  code,
}: VerificationEmailPayload): Promise<void> {
  try {
    const mailTransporter = getTransporter();

    const result = await mailTransporter.sendMail({
      from: `"Restaurant Multan" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify Your Email - Restaurant Multan 🔐",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #f97316;">Verify Your Email, ${name}!</h2>
          <p>Thank you for registering at Restaurant Multan.</p>
          <p>Please use the code below to verify your email address:</p>
          <div style="background-color: #f0f0f0; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="color: #f97316; margin: 0; letter-spacing: 2px; font-family: monospace;">${code}</h1>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
          <p style="margin-top: 24px; color: #888; font-size: 12px;">
            If you didn't create this account, please ignore this email.
          </p>
        </div>
      `,
    });

    console.log(
      `✅ Verification email accepted by SMTP for ${email} (messageId: ${result.messageId})`
    );
  } catch (error) {
    console.error("❌ Failed to send verification email:", error);
    throw error;
  }
}

/**
 * Sends a welcome email after email verification.
 */
export async function sendWelcomeEmail({
  name,
  email,
}: WelcomeEmailPayload): Promise<void> {
  try {
    const mailTransporter = getTransporter();

    const result = await mailTransporter.sendMail({
      from: `"Restaurant Multan" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome! Your account is ready 🎉",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #f97316;">Welcome, ${name}!</h2>
          <p>Your email has been verified successfully.</p>
          <p>Your account is now active and ready to use.</p>
          <p>You can now browse our menu and place orders straight from the app.</p>
          <p style="margin-top: 24px; color: #888; font-size: 12px;">
            If you didn't create this account, please ignore this email.
          </p>
        </div>
      `,
    });

    console.log(
      `✅ Welcome email accepted by SMTP for ${email} (messageId: ${result.messageId})`
    );
  } catch (error) {
    console.error("❌ Failed to send welcome email:", error);
    throw error;
  }
}




interface OrderEmailPayload {
  user: { name: string; email: string };
}

/**
 * Sends an order-approved confirmation email with delivery timeline.
 * Called after admin approves a JazzCash payment. Needs the order populated
 * with user info (name + email) — caller is responsible for that.
 */
export async function sendOrderApprovedEmail(
  order: IOrder & { user: any }
): Promise<void> {
  try {
    // order.user may be an ObjectId (not populated) — guard against that
    const userEmail = typeof order.user === "object" ? order.user.email : null;
    const userName = typeof order.user === "object" ? order.user.name : "there";

    if (!userEmail) {
      console.warn("sendOrderApprovedEmail: order.user not populated, skipping email");
      return;
    }

    const mailTransporter = getTransporter();
    const orderShortId = order._id.toString().slice(-8).toUpperCase();

    const result = await mailTransporter.sendMail({
      from: `"Restaurant Multan" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `Order #${orderShortId} confirmed — on its way soon! 🍔`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #f97316;">Your order is confirmed, ${userName}!</h2>
          <p>We've verified your payment and your order is now being prepared.</p>
          <p><strong>Order ID:</strong> #${orderShortId}</p>
          <p><strong>Estimated delivery:</strong> ${order.estimatedDeliveryMinutes || 45} minutes</p>
          <p style="margin-top: 24px; color: #888; font-size: 12px;">
            Thank you for ordering with us!
          </p>
        </div>
      `,
    });

    console.log(
      `✅ Order approval email accepted by SMTP for ${userEmail} (messageId: ${result.messageId})`
    );
  } catch (error) {
    console.error("❌ Failed to send order approval email:", error);
  }
}
