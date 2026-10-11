import storage from "./storage";
import { MenuCache, Category, Product } from "../types/menu.types";

const CACHE_KEY = "menuCache";
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export async function getCachedMenu(): Promise<MenuCache | null> {
  try {
    const raw = await storage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MenuCache;
  } catch {
    return null;
  }
}

export function isCacheFresh(cache: MenuCache | null): boolean {
  if (!cache) return false;
  return Date.now() - cache.cachedAt < CACHE_TTL_MS;
}

export async function setCachedMenu(categories: Category[], products: Product[]): Promise<void> {
  const cache: MenuCache = { categories, products, cachedAt: Date.now() };
  try {
    await storage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Non-critical — if caching fails, app still works, just refetches next time
  }
}
