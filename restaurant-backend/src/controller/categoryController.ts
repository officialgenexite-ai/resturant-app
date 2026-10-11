import { NextRequest } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/dbConnect";
import Category from "@/model/Category";
import { requireAdmin } from "@/middlewares/authMiddleware";
import { successResponse, errorResponse } from "@/utlis/apiResponse";
import { slugify } from "@/utlis/slugify";

function formatZodErrors(issues: z.ZodIssue[]): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  issues.forEach((err) => {
    const pathKey = err.path.length ? err.path.map(String).join(".") : "root";
    fieldErrors[pathKey] = err.message;
  });
  return fieldErrors;
}

const createCategorySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  displayOrder: z.number().int().optional(),
});

const updateCategorySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/categories
 * Public. Returns only active categories, sorted by displayOrder.
 */
export async function getAllCategories() {
  try {
    await dbConnect();

    const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1, name: 1 });

    return successResponse({
      message: "Categories fetched successfully",
      status: 200,
      data: { categories },
    });
  } catch (error) {
    console.error("Get categories error:", error);
    return errorResponse({ message: "Failed to fetch categories", status: 500 });
  }
}

/**
 * POST /api/categories
 * Admin only. Auto-generates a unique slug from the name.
 */
export async function createCategory(req: NextRequest) {
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

    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse({
        message: "Validation failed",
        status: 400,
        errors: formatZodErrors(parsed.error.issues),
      });
    }

    const { name, displayOrder } = parsed.data;
    const slug = slugify(name);

    const existing = await Category.findOne({ $or: [{ name }, { slug }] });
    if (existing) {
      return errorResponse({ message: "A category with this name already exists", status: 409 });
    }

    const category = await Category.create({
      name,
      slug,
      displayOrder: displayOrder ?? 0,
    });

    return successResponse({
      message: "Category created successfully",
      status: 201,
      data: { category },
    });
  } catch (error) {
    console.error("Create category error:", error);
    return errorResponse({ message: "Failed to create category", status: 500 });
  }
}

/**
 * PUT /api/categories/:id
 * Admin only.
 */
export async function updateCategory(req: NextRequest, id: string) {
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

    const parsed = updateCategorySchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse({
        message: "Validation failed",
        status: 400,
        errors: formatZodErrors(parsed.error.issues),
      });
    }

    const category = await Category.findById(id);
    if (!category) {
      return errorResponse({ message: "Category not found", status: 404 });
    }

    const { name, displayOrder, isActive } = parsed.data;

    if (name && name !== category.name) {
      const newSlug = slugify(name);
      const duplicate = await Category.findOne({
        _id: { $ne: id },
        $or: [{ name }, { slug: newSlug }],
      });
      if (duplicate) {
        return errorResponse({ message: "A category with this name already exists", status: 409 });
      }
      category.name = name;
      category.slug = newSlug;
    }

    if (displayOrder !== undefined) category.displayOrder = displayOrder;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    return successResponse({
      message: "Category updated successfully",
      status: 200,
      data: { category },
    });
  } catch (error) {
    console.error("Update category error:", error);
    return errorResponse({ message: "Failed to update category", status: 500 });
  }
}

/**
 * DELETE /api/categories/:id
 * Admin only.
 */
export async function deleteCategory(req: NextRequest, id: string) {
  try {
    const check = requireAdmin(req);
    if ("error" in check) return check.error;

    await dbConnect();

    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return errorResponse({ message: "Category not found", status: 404 });
    }

    return successResponse({
      message: "Category deleted successfully",
      status: 200,
      data: null,
    });
  } catch (error) {
    console.error("Delete category error:", error);
    return errorResponse({ message: "Failed to delete category", status: 500 });
  }
}
