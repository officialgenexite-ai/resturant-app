import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IVariant {
  name: string;
  priceModifier: number;
}

export interface IProduct extends Document {
  title: string;
  description: string;
  category: Types.ObjectId;
  basePrice: number;
  variants: IVariant[];
  image: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VariantSchema = new Schema<IVariant>(
  {
    name: {
      type: String,
      required: [true, "Variant name is required"],
      trim: true,
    },
    priceModifier: {
      type: Number,
      required: [true, "Variant price modifier is required"],
      default: 0,
    },
  },
  { _id: false } // variants don't need their own separate _id
);

const ProductSchema: Schema<IProduct> = new Schema(
  {
    title: {
      type: String,
      required: [true, "Product title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    basePrice: {
      type: Number,
      required: [true, "Base price is required"],
      min: [0, "Price cannot be negative"],
    },
    variants: {
      type: [VariantSchema],
      default: [],
    },
    image: {
      type: String,
      required: [true, "Image URL is required"],
      trim: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast category-filtered queries (very common on the menu screen)
ProductSchema.index({ category: 1, isAvailable: 1 });

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
