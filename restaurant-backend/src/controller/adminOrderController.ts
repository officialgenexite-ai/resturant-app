import { NextRequest } from "next/server";
import User from "@/model/User";
import dbConnect from "@/lib/dbConnect";
import Order from "@/model/Order";
import { requireAdmin } from "@/middlewares/authMiddleware";
import { successResponse, errorResponse } from "@/utlis/apiResponse";

/**
 * GET /api/admin/orders/pending
 * Admin only. Returns JazzCash orders awaiting manual payment review —
 * i.e. adminReviewStatus is still "pending". COD orders never appear here
 * since they don't require screenshot verification.
 */

export async function getPendingOrders(req: NextRequest) {
  try {
    const check = requireAdmin(req);
    if ("error" in check) return check.error;

    await dbConnect();

    // Two categories of "needs admin attention": JazzCash orders awaiting
    // payment review, and COD orders awaiting simple acceptance
    const orders = await Order.find({
      $or: [
        { paymentMethod: "JazzCash", adminReviewStatus: "pending" },
        { paymentMethod: "COD", status: "Pending" },
      ],
    })
      .populate("user", "name phone email")
      .sort({ createdAt: -1 });

    return successResponse({
      message: "Pending orders fetched successfully",
      status: 200,
      data: { orders },
    });
  } catch (error) {
    console.error("Get pending orders error:", error);
    return errorResponse({ message: "Failed to fetch pending orders", status: 500 });
  }
}
/**
 * GET /api/admin/orders/active
 * Admin only. Returns orders currently in progress (Preparing or
 * Out for Delivery) so the admin can advance them through the pipeline.
 */
export async function getActiveOrders(req: NextRequest) {
  try {
    const check = requireAdmin(req);
    if ("error" in check) return check.error;

    await dbConnect();

    const orders = await Order.find({
      status: { $in: ["Preparing", "Out for Delivery"] },
    })
      .populate("user", "name phone email")
      .sort({ createdAt: 1 }); // oldest first — first-in-first-out kitchen queue

    return successResponse({
      message: "Active orders fetched successfully",
      status: 200,
      data: { orders },
    });
  } catch (error) {
    console.error("Get active orders error:", error);
    return errorResponse({ message: "Failed to fetch active orders", status: 500 });
  }
}
