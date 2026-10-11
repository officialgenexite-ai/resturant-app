import { NextRequest } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/dbConnect";
import Product from "@/model/Product";
import Category from "@/model/Category";
import { requireAdmin } from "@/middlewares/authMiddleware";
import { successResponse, errorResponse } from "@/utlis/apiResponse";

function formatZodErrors(issues: z.ZodIssue[]): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  issues.forEach((err) => {
    const pathKey = err.path.length ? err.path.map(String).join(".") : "root";
    fieldErrors[pathKey] = err.message;
  });
  return fieldErrors;
}

const variantSchema = z.object({
  name: z.string().trim().min(1, "Variant name is required"),
  priceModifier: z.number(),
});

const createProductSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters"),
  description: z.string().trim().min(5, "Description must be at least 5 characters"),
  category: z.string().trim().min(1, "Category is required"),
  basePrice: z.number().min(0, "Price cannot be negative"),
  variants: z.array(variantSchema).optional(),
  image: z.string().trim().url("Image must be a valid URL"),
  isAvailable: z.boolean().optional(),
});

const updateProductSchema = z.object({
  title: z.string().trim().min(2).optional(),
  description: z.string().trim().min(5).optional(),
  category: z.string().trim().min(1).optional(),
  basePrice: z.number().min(0).optional(),
  variants: z.array(variantSchema).optional(),
  image: z.string().trim().url().optional(),
  isAvailable: z.boolean().optional(),
});

/**
 * GET /api/products
 * Public. Optional ?category=<slug> query param to filter.
 * Populates category name/slug so mobile app doesn't need a second request.
 */
export async function getAllProducts(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get("category");

    const filter: Record<string, unknown> = { isAvailable: true };

    if (categorySlug) {
      const category = await Category.findOne({ slug: categorySlug, isActive: true });
      if (!category) {
        // Category doesn't exist — return empty list rather than an error,
        // since this is a valid "no results" state for the mobile app
        return successResponse({
          message: "No products found for this category",
          status: 200,
          data: { products: [] },
        });
      }
      filter.category = category._id;
    }

    const products = await Product.find(filter)
      .populate("category", "name slug")
      .sort({ createdAt: -1 });

    return successResponse({
      message: "Products fetched successfully",
      status: 200,
      data: { products },
    });
  } catch (error) {
    console.error("Get products error:", error);
    return errorResponse({ message: "Failed to fetch products", status: 500 });
  }
}

/**
 * GET /api/products/:id
 * Public. Single product detail.
 */
export async function getProductById(id: string) {
  try {
    await dbConnect();

    const product = await Product.findById(id).populate("category", "name slug");

    if (!product) {
      return errorResponse({ message: "Product not found", status: 404 });
    }

    return successResponse({
      message: "Product fetched successfully",
      status: 200,
      data: { product },
    });
  } catch (error) {
    console.error("Get product by id error:", error);
    return errorResponse({ message: "Failed to fetch product", status: 500 });
  }
}

/**
 * POST /api/products
 * Admin only.
 */
export async function createProduct(req: NextRequest) {
  try {
    const check = requireAdmin(req);
    if ("error" in check) return check.error;

    await dbConnect();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return errorResponse({ message: "Invalid request body", status: 400 });
    }

    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse({
        message: "Validation failed",
        status: 400,
        errors: formatZodErrors(parsed.error.issues),
      });
    }

    const { title, description, category, basePrice, variants, image, isAvailable } = parsed.data;

    // Verify the referenced category actually exists before creating the product
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return errorResponse({ message: "Referenced category does not exist", status: 400 });
    }

    const product = await Product.create({
      title,
      description,
      category,
      basePrice,
      variants: variants || [],
      image,
      isAvailable: isAvailable ?? true,
    });

    const populated = await product.populate("category", "name slug");

    return successResponse({
      message: "Product created successfully",
      status: 201,
      data: { product: populated },
    });
  } catch (error) {
    console.error("Create product error:", error);
    return errorResponse({ message: "Failed to create product", status: 500 });
  }
}

/**
 * PUT /api/products/:id
 * Admin only.
 */
export async function updateProduct(req: NextRequest, id: string) {
  try {
    const check = requireAdmin(req);
    if ("error" in check) return check.error;

    await dbConnect();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return errorResponse({ message: "Invalid request body", status: 400 });
    }

    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse({
        message: "Validation failed",
        status: 400,
        errors: formatZodErrors(parsed.error.issues),
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return errorResponse({ message: "Product not found", status: 404 });
    }

    const updates = parsed.data;

    if (updates.category) {
      const categoryExists = await Category.findById(updates.category);
      if (!categoryExists) {
        return errorResponse({ message: "Referenced category does not exist", status: 400 });
      }
    }

    Object.assign(product, updates);
    await product.save();

    const populated = await product.populate("category", "name slug");

    return successResponse({
      message: "Product updated successfully",
      status: 200,
      data: { product: populated },
    });
  } catch (error) {
    console.error("Update product error:", error);
    return errorResponse({ message: "Failed to update product", status: 500 });
  }
}

/**
 * DELETE /api/products/:id
 * Admin only.
 */
export async function deleteProduct(req: NextRequest, id: string) {
  try {
    const check = requireAdmin(req);
    if ("error" in check) return check.error;

    await dbConnect();

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return errorResponse({ message: "Product not found", status: 404 });
    }

    return successResponse({
      message: "Product deleted successfully",
      status: 200,
      data: null,
    });
  } catch (error) {
    console.error("Delete product error:", error);
    return errorResponse({ message: "Failed to delete product", status: 500 });
  }
}
