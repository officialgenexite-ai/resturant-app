import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IOrderItem {
  productId: Types.ObjectId;
  title: string;
  variantName: string | null;
  unitPrice: number;
  quantity: number;
}

export interface IDeliveryAddress {
  area: string;
  streetDetail: string;
  landmark?: string;
  phone: string;
}

export interface IStatusHistoryEntry {
  status: string;
  timestamp: Date;
}

// OCR Checks Interface
export interface IOcrChecks {
  accountMatched: boolean;
  amountMatched: boolean;
  timeWithinWindow: boolean;
}

export interface IOrder extends Document {
  user: Types.ObjectId;
  items: IOrderItem[];
  deliveryAddress: IDeliveryAddress;
  paymentMethod: "COD" | "JazzCash";
  paymentStatus: "pending" | "pending_verification";
  transactionId?: string;

  // OCR and Payment Fields
  paymentScreenshot?: string;
  ocrStatus: "verified" | "flagged" | "not_applicable";
  ocrExtractedText?: string;
  ocrChecks?: IOcrChecks;
  adminReviewStatus: "pending" | "approved" | "rejected" | "not_required";

  subtotal: number;
  deliveryFee: number;
  total: number;
  estimatedDeliveryMinutes?: number;
  status: "Pending" | "Preparing" | "Out for Delivery" | "Delivered" | "Cancelled";
  statusHistory: IStatusHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    title: { type: String, required: true },
    variantName: { type: String, default: null },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const DeliveryAddressSchema = new Schema<IDeliveryAddress>(
  {
    area: { type: String, required: true },
    streetDetail: { type: String, required: true, trim: true },
    landmark: { type: String, trim: true, default: "" },
    phone: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const StatusHistorySchema = new Schema<IStatusHistoryEntry>(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

const OrderSchema: Schema<IOrder> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [OrderItemSchema], required: true },
    deliveryAddress: { type: DeliveryAddressSchema, required: true },
    paymentMethod: { type: String, enum: ["COD", "JazzCash"], required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "pending_verification"],
      required: true,
    },
    transactionId: { type: String, trim: true },

    // --- Added OCR and Payment Verification Fields ---
    paymentScreenshot: {
      type: String,
      trim: true,
    },
    ocrStatus: {
      type: String,
      enum: ["verified", "flagged", "not_applicable"],
      default: "not_applicable",
    },
    ocrExtractedText: {
      type: String,
      select: false, // debugging data — don't return by default to keep responses clean
    },
    ocrChecks: {
      accountMatched: { type: Boolean, default: false },
      amountMatched: { type: Boolean, default: false },
      timeWithinWindow: { type: Boolean, default: false },
      tidMatched: { type: Boolean, default: false },

    },
    adminReviewStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "not_required"],
      default: "not_required",
    },
    // --------------------------------------------------

    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, required: true },
    total: { type: Number, required: true },
    estimatedDeliveryMinutes: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ["Pending", "Preparing", "Out for Delivery", "Delivered", "Cancelled"],
      default: "Pending",
    },
    statusHistory: {
      type: [StatusHistorySchema],
      default: () => [{ status: "Pending", timestamp: new Date() }],
    },
  },
  { timestamps: true }
);

OrderSchema.index({ user: 1, createdAt: -1 });

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
