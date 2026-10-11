import { NextRequest } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/dbConnect";
import Order from "@/model/Order";
import Product from "@/model/Product";
import { requireAuth, requireAdmin } from "@/middlewares/authMiddleware";
import { successResponse, errorResponse } from "@/utlis/apiResponse";
import { MULTAN_AREAS } from "@/contants/MultanAreas";
import { uploadBase64Image } from "@/lib/cloudinary";
import { sendOrderApprovedEmail } from "@/services/emailService";

const DELIVERY_FEE = 100;
const DEFAULT_PREP_MINUTES = 45;

function formatZodErrors(issues: z.ZodIssue[]): Record<string, string> {
  const errors: Record<string, string> = {};
  issues.forEach((issue) => {
    errors[issue.path.length ? issue.path.map(String).join(".") : "root"] = issue.message;
  });
  return errors;
}

const placeOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    variantName: z.string().nullable().optional(),
    quantity: z.number().int().min(1),
  })).min(1, "Cart cannot be empty"),
  area: z.enum(MULTAN_AREAS, { error: "Please select a valid delivery area" }),
  streetDetail: z.string().trim().min(3, "Please provide street/house details"),
  landmark: z.string().trim().optional(),
  phone: z.string().trim().transform((value) => value.replace(/\s+/g, ""))
    .refine((value) => /^[0-9+()\-]{10,15}$/.test(value), "Please provide a valid phone number"),
  paymentMethod: z.enum(["COD", "JazzCash"]),
  transactionId: z.string().trim().optional(),
  paymentScreenshotBase64: z.string().optional(),
}).refine((data) => data.paymentMethod !== "JazzCash" || !!data.transactionId, {
  message: "Transaction ID is required for JazzCash payment", path: ["transactionId"],
}).refine((data) => data.paymentMethod !== "JazzCash" || !!data.paymentScreenshotBase64, {
  message: "Payment screenshot is required for JazzCash payment", path: ["paymentScreenshotBase64"],
});

export async function placeOrder(req: NextRequest) {
  try {
    const check = requireAuth(req);
    if ("error" in check) return check.error;
    await dbConnect();
    let body: unknown;
    try { body = await req.json(); } catch { return errorResponse({ message: "Invalid request body", status: 400 }); }
    const parsed = placeOrderSchema.safeParse(body);
    if (!parsed.success) return errorResponse({ message: "Validation failed", status: 400, errors: formatZodErrors(parsed.error.issues) });

    const { items, area, streetDetail, landmark, phone, paymentMethod, transactionId, paymentScreenshotBase64 } = parsed.data;
    const orderItems = [];
    let subtotal = 0;
    for (const cartItem of items) {
      const product = await Product.findById(cartItem.productId);
      if (!product || !product.isAvailable) return errorResponse({ message: `"${product?.title || "An item"}" is no longer available`, status: 400 });
      let unitPrice = product.basePrice;
      if (cartItem.variantName) {
        const variant = product.variants.find((item) => item.name === cartItem.variantName);
        if (!variant) return errorResponse({ message: `Selected variant for "${product.title}" is no longer available`, status: 400 });
        unitPrice += variant.priceModifier;
      }
      orderItems.push({ productId: product._id, title: product.title, variantName: cartItem.variantName || null, unitPrice, quantity: cartItem.quantity });
      subtotal += unitPrice * cartItem.quantity;
    }

    // --- JazzCash-specific: upload screenshot for manual admin review ---
    // OCR (Tesseract.js) temporarily removed — was hanging indefinitely on
    // Vercel serverless (300s timeout), likely due to CDN fetch of worker/
    // language files failing silently in that environment. Reverting to
    // pure manual review: screenshot + TID go straight to admin, no
    // automated pass/fail. Re-introduce automated verification later via
    // a serverless-friendly OCR provider (e.g. Google Cloud Vision).
    let paymentScreenshotUrl: string | undefined;

    if (paymentMethod === "JazzCash" && paymentScreenshotBase64) {
      try {
        paymentScreenshotUrl = await uploadBase64Image(paymentScreenshotBase64, "payment-screenshots");
      } catch (uploadError) {
        console.error("Screenshot upload error:", uploadError);
        return errorResponse({
          message: "We couldn't upload your payment screenshot. Please try again.",
          status: 400,
        });
      }
    }

    const order = await Order.create({
      user: check.payload.userId,
      items: orderItems,
      deliveryAddress: { area, streetDetail, landmark: landmark || "", phone },
      paymentMethod,
      paymentStatus: paymentMethod === "JazzCash" ? "pending_verification" : "pending",
      transactionId: paymentMethod === "JazzCash" ? transactionId : undefined,
      paymentScreenshot: paymentScreenshotUrl,
      ocrStatus: "not_applicable", // OCR temporarily disabled
      adminReviewStatus: paymentMethod === "JazzCash" ? "pending" : "not_required",
      subtotal,
      deliveryFee: DELIVERY_FEE,
      total: subtotal + DELIVERY_FEE,
      status: "Pending",
      statusHistory: [{ status: "Pending", timestamp: new Date() }],
    });

    return successResponse({ message: "Order placed successfully", status: 201, data: { order } });
  } catch (error) {
    console.error("Place order error:", error);
    return errorResponse({ message: "Failed to place order", status: 500 });
  }
}

export async function getOrderById(req: NextRequest, id: string) {
  try {
    const check = requireAuth(req);
    if ("error" in check) return check.error;
    await dbConnect();
    const order = await Order.findById(id);
    if (!order) return errorResponse({ message: "Order not found", status: 404 });
    if (order.user.toString() !== check.payload.userId) return errorResponse({ message: "You do not have access to this order", status: 403 });
    return successResponse({ message: "Order fetched successfully", status: 200, data: { order } });
  } catch (error) {
    console.error("Get order error:", error);
    return errorResponse({ message: "Failed to fetch order", status: 500 });
  }
}

const verifyPaymentSchema = z.object({ decision: z.enum(["approved", "rejected"]) });
export async function verifyPaymentByAdmin(req: NextRequest, id: string) {
  try {
    const check = requireAdmin(req);
    if ("error" in check) return check.error;
    await dbConnect();
    const parsed = verifyPaymentSchema.safeParse(await req.json());
    if (!parsed.success) return errorResponse({ message: "Validation failed", status: 400, errors: formatZodErrors(parsed.error.issues) });
    const order = await Order.findById(id).populate("user", "name email");
    if (!order) return errorResponse({ message: "Order not found", status: 404 });
    if (order.paymentMethod !== "JazzCash") return errorResponse({ message: "This order does not require payment verification", status: 400 });
    order.adminReviewStatus = parsed.data.decision;
    if (parsed.data.decision === "approved") {
      order.paymentStatus = "pending";
      order.status = "Preparing";
      order.estimatedDeliveryMinutes = DEFAULT_PREP_MINUTES;
      order.statusHistory.push({ status: "Preparing", timestamp: new Date() });
      sendOrderApprovedEmail(order).catch(() => {});
    } else {
      order.status = "Cancelled";
      order.statusHistory.push({ status: "Cancelled", timestamp: new Date() });
    }
    await order.save();
    return successResponse({ message: `Payment ${parsed.data.decision} successfully`, status: 200, data: { order } });
  } catch (error) {
    console.error("Verify payment error:", error);
    return errorResponse({ message: "Failed to verify payment", status: 500 });
  }
}

export async function getMyOrders(req: NextRequest) {
  try {
    const check = requireAuth(req);
    if ("error" in check) return check.error;
    await dbConnect();
    const orders = await Order.find({ user: check.payload.userId }).sort({ createdAt: -1 });
    return successResponse({ message: "Orders fetched successfully", status: 200, data: { orders } });
  } catch (error) {
    console.error("Get my orders error:", error);
    return errorResponse({ message: "Failed to fetch orders", status: 500 });
  }
}

export async function acceptCodOrder(req: NextRequest, id: string) {
  try {
    const check = requireAdmin(req);
    if ("error" in check) return check.error;
    await dbConnect();
    const order = await Order.findById(id);
    if (!order) return errorResponse({ message: "Order not found", status: 404 });
    if (order.paymentMethod !== "COD" || order.status !== "Pending") return errorResponse({ message: "Only pending COD orders can be accepted", status: 400 });
    order.status = "Preparing";
    order.estimatedDeliveryMinutes = DEFAULT_PREP_MINUTES;
    order.statusHistory.push({ status: "Preparing", timestamp: new Date() });
    await order.save();
    return successResponse({ message: "Order accepted successfully", status: 200, data: { order } });
  } catch (error) {
    console.error("Accept COD order error:", error);
    return errorResponse({ message: "Failed to accept order", status: 500 });
  }
}

const statusSchema = z.object({ newStatus: z.enum(["Preparing", "Out for Delivery", "Delivered", "Cancelled"]) });
const validTransitions: Record<string, string[]> = {
  Pending: ["Preparing", "Cancelled"], Preparing: ["Out for Delivery", "Cancelled"],
  "Out for Delivery": ["Delivered"], Delivered: [], Cancelled: [],
};

export async function updateOrderStatus(req: NextRequest, id: string) {
  try {
    const check = requireAdmin(req);
    if ("error" in check) return check.error;
    await dbConnect();
    const parsed = statusSchema.safeParse(await req.json());
    if (!parsed.success) return errorResponse({ message: "Validation failed", status: 400, errors: formatZodErrors(parsed.error.issues) });
    const order = await Order.findById(id);
    if (!order) return errorResponse({ message: "Order not found", status: 404 });
    if (!validTransitions[order.status]?.includes(parsed.data.newStatus)) return errorResponse({ message: `Cannot move order from ${order.status} to ${parsed.data.newStatus}`, status: 400 });
    order.status = parsed.data.newStatus;
    order.statusHistory.push({ status: parsed.data.newStatus, timestamp: new Date() });
    await order.save();
    return successResponse({ message: "Order status updated successfully", status: 200, data: { order } });
  } catch (error) {
    console.error("Update order status error:", error);
    return errorResponse({ message: "Failed to update order status", status: 500 });
  }
}
