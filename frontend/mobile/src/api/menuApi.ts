import axiosInstance from "./axiosInstance";
import { Category, Product } from "../types/menu.types";
import { ApiSuccessResponse } from "../types/auth.types";

export async function fetchCategories(): Promise<Category[]> {
  const response = await axiosInstance.get<ApiSuccessResponse<{ categories: Category[] }>>(
    "/categories"
  );
  return response.data.data.categories;
}

export async function fetchProducts(): Promise<Product[]> {
  const response = await axiosInstance.get<ApiSuccessResponse<{ products: Product[] }>>(
    "/products"
  );
  return response.data.data.products;
}
